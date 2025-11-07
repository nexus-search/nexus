# Nexus Search

Nexus Search is a multimodal discovery platform that lets users upload visual media and find similar content using deep-learning embeddings. The repo contains both the Next.js frontend and the FastAPI backend so the team can iterate in parallel.

## Project Structure

```
frontend/   # Next.js 14 App Router UI (upload, search, results views)
backend/    # FastAPI service with MongoDB GridFS + Elasticsearch wiring
```

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Context, React Dropzone
- Backend: FastAPI, Pydantic v2, MongoDB GridFS, Elasticsearch k-NN, PyTorch / Sentence Transformers (CLIP ViT-B-32)
- Tooling: Docker Compose (MongoDB 7, Elasticsearch 8), Uvicorn, ffmpeg/opencv for media processing

## Current Status

- ✅ Frontend scaffolded with pages for upload, search, and results plus reusable media components
- ✅ Backend skeleton with env config, health endpoint, Docker services, MongoDB/GridFS + Elasticsearch clients, index bootstrap
- ⏳ Next steps: implement upload/search/media endpoints, CLIP embedding service, link frontend to backend APIs

## Getting Started

### Frontend (Next.js)

```
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 (currently uses mock data until backend endpoints are ready).

### Backend (FastAPI)

```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
cp env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs: http://localhost:8000/docs. Health endpoint reports MongoDB and Elasticsearch connectivity.

### Optional: Docker services

```
cd backend
docker compose -f docker/docker-compose.yml up -d mongodb elasticsearch
docker compose -f docker/docker-compose.yml up --build backend
```

Elasticsearch runs on http://localhost:9200 and MongoDB on mongodb://localhost:27017.

## Contributing

- Create focused feature branches (e.g. `feature/backend-apis`, `feature/frontend-integration`) and keep commits small.
- Align milestones across teams (API stubs, embedding pipeline, shared type definitions) to avoid merge conflicts.
