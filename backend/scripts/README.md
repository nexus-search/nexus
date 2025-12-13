# Data Ingestion Pipeline for Nexus Search

This directory contains scripts for ingesting datasets into Nexus Search.

## 📋 Overview

The data ingestion pipeline consists of three main steps:

1. **Download** - Download datasets from Roboflow or other sources
2. **Process** - Upload to Cloudinary, generate CLIP embeddings
3. **Index** - Store in MongoDB and index in Elasticsearch

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
pip install roboflow pillow tqdm
```

### Step 2: Get Roboflow API Key

1. Go to https://app.roboflow.com/settings/api
2. Copy your API key

### Step 3: Download Dataset

```bash
python scripts/download_roboflow_dataset.py \
  --api-key YOUR_ROBOFLOW_API_KEY \
  --workspace yuga-pwtql \
  --project animals-eujgm \
  --version 1 \
  --output-dir ./data/animals
```

### Step 4: Run Ingestion Pipeline

```bash
python scripts/data_ingestion_pipeline.py \
  --dataset-path ./data/animals \
  --user-id system \
  --batch-size 10
```

## 📊 Pipeline Details

### Download Script (`download_roboflow_dataset.py`)

Downloads datasets from Roboflow Universe.

**Options:**
- `--api-key`: Your Roboflow API key (required)
- `--workspace`: Workspace name (default: yuga-pwtql)
- `--project`: Project name (default: animals-eujgm)
- `--version`: Dataset version (default: 1)
- `--output-dir`: Where to save (default: ./data/animals)
- `--format`: Download format (folder, coco, yolo, etc.)

**Example:**
```bash
python scripts/download_roboflow_dataset.py \
  --api-key abc123xyz \
  --output-dir ./data/my-dataset
```

### Ingestion Pipeline (`data_ingestion_pipeline.py`)

Processes images and ingests them into the system.

**What it does:**
1. Discovers all images in the dataset directory
2. Uploads each image to Cloudinary
3. Generates CLIP embeddings using the `clip-ViT-B-32` model
4. Stores metadata in MongoDB
5. Indexes embeddings in Elasticsearch

**Options:**
- `--dataset-path`: Path to dataset directory (required)
- `--user-id`: Owner user ID (default: system)
- `--batch-size`: Parallel processing batch size (default: 10)
- `--skip-cloudinary`: Skip Cloudinary upload for testing

**Example:**
```bash
# Normal run
python scripts/data_ingestion_pipeline.py \
  --dataset-path ./data/animals \
  --batch-size 20

# Test run (skip Cloudinary)
python scripts/data_ingestion_pipeline.py \
  --dataset-path ./data/animals \
  --skip-cloudinary
```

## 📁 Dataset Structure

The pipeline expects images organized like this:

```
data/animals/
├── train/
│   ├── cat/
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   ├── dog/
│   │   ├── image1.jpg
│   │   ├── image2.jpg
├── valid/
│   └── ...
└── test/
    └── ...
```

Or a flat structure:
```
data/animals/
├── image1.jpg
├── image2.jpg
├── image3.jpg
```

## 🔧 Environment Variables

Make sure these are set in your `.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nexus_search

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📈 Performance Tips

1. **Batch Size**: Adjust based on your system's memory and CPU
   - Small (2-5): Low memory systems
   - Medium (10-20): Most systems
   - Large (50+): High-end systems with lots of RAM

2. **Cloudinary**: Free tier has limits
   - Up to 25,000 images
   - 25 GB storage
   - 25 GB monthly bandwidth

3. **Skip Cloudinary**: For testing or local development
   ```bash
   python scripts/data_ingestion_pipeline.py \
     --dataset-path ./data/animals \
     --skip-cloudinary
   ```

## 🐛 Troubleshooting

### Error: "Cloudinary credentials not configured"
Solution: Set environment variables in `.env` file

### Error: "No images found"
Solution: Check dataset path and image file extensions

### Error: "MongoDB connection failed"
Solution: Start MongoDB with `docker compose up -d mongodb`

### Error: "Elasticsearch connection failed"
Solution: Start Elasticsearch with `docker compose up -d elasticsearch`

### Out of Memory
Solution: Reduce batch size with `--batch-size 5`

## 📊 Output

The pipeline will output progress and statistics:

```
============================================================
Starting Data Ingestion Pipeline
============================================================
Initializing connections...
✓ Connections initialized
Discovering images in ./data/animals...
✓ Found 1000 images
Processing 1000 images in batches of 10...
Processing images: 100%|████████████| 1000/1000 [05:23<00:00,  3.09it/s]
============================================================
Pipeline Execution Complete
============================================================
Total images found:    1000
Successfully processed: 995
Uploaded to Cloudinary: 995
Embeddings generated:   995
Indexed in ES:         995
Failed:                5
```

## 🔄 Running Multiple Datasets

You can run the pipeline multiple times with different datasets:

```bash
# Download and ingest animals dataset
python scripts/download_roboflow_dataset.py \
  --api-key YOUR_KEY \
  --project animals-eujgm \
  --output-dir ./data/animals

python scripts/data_ingestion_pipeline.py \
  --dataset-path ./data/animals

# Download and ingest another dataset
python scripts/download_roboflow_dataset.py \
  --api-key YOUR_KEY \
  --project another-dataset \
  --output-dir ./data/other

python scripts/data_ingestion_pipeline.py \
  --dataset-path ./data/other
```

## 📝 Notes

- Images are automatically tagged with their category (parent directory name)
- All ingested images are marked as `visibility: public`
- Owner is set to the `--user-id` parameter (default: "system")
- Embeddings are generated using CLIP ViT-B/32 model
- Progress is saved incrementally (MongoDB/ES), so you can resume if interrupted
