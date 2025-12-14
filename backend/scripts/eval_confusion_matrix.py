#!/usr/bin/env python3
"""
Evaluation script: build a confusion matrix by querying the SearchService with
text or image queries derived from the dataset categories and comparing the
returned images' classes against the query class.

Assumptions:
- Dataset is COCO-format under scripts/data/animals/{train,valid,test}
- File names in the DB (or their basenames) match the COCO image file names
- The class of an image is inferred from the COCO annotation (majority class per image)

Outputs:
- confusion_matrix_text.png / .csv (if text mode)
- confusion_matrix_image.png / .csv (if image mode)

Run (from backend):
  python scripts/eval_confusion_matrix.py \
    --data-root scripts/data/animals \
    --splits valid test \
    --mode both \
    --top-k 10 \
    --output-dir scripts/metrics
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.searchservice import SearchService


def load_coco_split(annot_path: Path):
    with open(annot_path, "r") as f:
        coco = json.load(f)
    cat_id_to_name = {c["id"]: c.get("name", str(c["id"])) for c in coco.get("categories", [])}
    # image_id -> file_name
    img_id_to_file = {img["id"]: img["file_name"] for img in coco.get("images", [])}
    # image file_name -> majority category_id
    file_to_cat: Dict[str, int] = {}
    ann_per_img: Dict[int, List[int]] = {}
    for ann in coco.get("annotations", []):
        img_id = ann["image_id"]
        ann_per_img.setdefault(img_id, []).append(ann["category_id"])
    for img_id, cat_ids in ann_per_img.items():
        if not cat_ids:
            continue
        majority = max(set(cat_ids), key=cat_ids.count)
        fname = img_id_to_file.get(img_id)
        if fname:
            file_to_cat[fname] = majority
    return cat_id_to_name, file_to_cat


def merge_splits(data_root: Path, splits: List[str]):
    all_file_to_cat: Dict[str, int] = {}
    cat_id_to_name: Dict[int, str] = {}
    for split in splits:
        annot = data_root / split / "_annotations.coco.json"
        if not annot.exists():
            print(f"⚠️  Missing annotation file: {annot}")
            continue
        cat_map, file_map = load_coco_split(annot)
        cat_id_to_name.update(cat_map)
        all_file_to_cat.update(file_map)
    return cat_id_to_name, all_file_to_cat


def infer_class_from_filename(filename: str, file_to_cat: Dict[str, int]):
    base = os.path.basename(filename)
    return file_to_cat.get(base)


def save_confusion(y_true: List[int], y_pred: List[int], labels: List[int], id_to_name: Dict[int, str], out_prefix: Path):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    names = [id_to_name[l] for l in labels]

    csv_path = f"{out_prefix}.csv"
    with open(csv_path, "w") as f:
        f.write("," + ",".join(names) + "\n")
        for i, row in enumerate(cm):
            f.write(names[i] + "," + ",".join(map(str, row)) + "\n")

    plt.figure(figsize=(max(8, len(labels) * 0.6), max(6, len(labels) * 0.6)))
    sns.heatmap(cm, annot=False, cmap="Reds", xticklabels=names, yticklabels=names)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title(out_prefix.name)
    plt.tight_layout()
    png_path = f"{out_prefix}.png"
    plt.savefig(png_path)
    plt.close()
    print(f"Saved {csv_path} and {png_path}")


async def eval_text(search_service: SearchService, cat_id_to_name, file_to_cat, labels, out_dir: Path, top_k: int):
    y_true: List[int] = []
    y_pred: List[int] = []
    for cat_id, cat_name in cat_id_to_name.items():
        results = await search_service.search_by_text(cat_name, top_k=top_k)
        for r in results:
            pred_cat = infer_class_from_filename(r.get("filename") or r.get("mediaUrl", ""), file_to_cat)
            if pred_cat is None:
                continue
            y_true.append(cat_id)
            y_pred.append(pred_cat)
    save_confusion(y_true, y_pred, labels, cat_id_to_name, out_dir / "confusion_text")


async def eval_image(search_service: SearchService, cat_id_to_name, file_to_cat, data_root: Path, splits: List[str], labels, out_dir: Path, top_k: int):
    y_true: List[int] = []
    y_pred: List[int] = []

    # pick one exemplar per class from available files
    class_to_file: Dict[int, Path] = {}
    for split in splits:
        images_dir = data_root / split
        for fname, cat_id in file_to_cat.items():
            if class_to_file.get(cat_id):
                continue
            candidate = images_dir / fname
            if candidate.exists():
                class_to_file[cat_id] = candidate
        if len(class_to_file) == len(cat_id_to_name):
            break

    for cat_id, path in class_to_file.items():
        with open(path, "rb") as f:
            img_bytes = f.read()
        results = await search_service.search_by_image(img_bytes, top_k=top_k)
        for r in results:
            pred_cat = infer_class_from_filename(r.get("filename") or r.get("mediaUrl", ""), file_to_cat)
            if pred_cat is None:
                continue
            y_true.append(cat_id)
            y_pred.append(pred_cat)
    save_confusion(y_true, y_pred, labels, cat_id_to_name, out_dir / "confusion_image")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data-root', default='scripts/data/animals', help='Root dataset path containing splits')
    ap.add_argument('--splits', nargs='+', default=['valid'], help='Splits to use (e.g., valid test)')
    ap.add_argument('--mode', choices=['text', 'image', 'both'], default='both', help='Evaluation mode')
    ap.add_argument('--top-k', type=int, default=10, help='Top K results to evaluate')
    ap.add_argument('--output-dir', default='scripts/metrics', help='Where to save confusion matrices')
    args = ap.parse_args()

    data_root = Path(args.data_root)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cat_id_to_name, file_to_cat = merge_splits(data_root, args.splits)
    labels = sorted(cat_id_to_name.keys())

    search_service = SearchService()

    if args.mode in ('text', 'both'):
        print("Running text query evaluation...")
        await eval_text(search_service, cat_id_to_name, file_to_cat, labels, out_dir, args.top_k)

    if args.mode in ('image', 'both'):
        print("Running image query evaluation...")
        await eval_image(search_service, cat_id_to_name, file_to_cat, data_root, args.splits, labels, out_dir, args.top_k)


if __name__ == '__main__':
    asyncio.run(main())
