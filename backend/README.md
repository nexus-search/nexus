# Nexus Search Backend (FastAPI)

## Quickstart

1. Create venv
```
python3 -m venv .venv
source .venv/bin/activate
```

2. Install deps
```
pip install -U pip
pip install -r requirements.txt
```

3. Configure env
```
cp env.example .env
```

4. Run
```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000/docs

## Notes
- CORS allows http://localhost:3000 by default
- Health endpoint: GET /api/v1/health

## Docker (MongoDB + Elasticsearch + Backend)

From this folder:
```
docker compose -f docker/docker-compose.yml up -d mongodb elasticsearch
docker compose -f docker/docker-compose.yml up --build backend
```

Elasticsearch: http://localhost:9200
MongoDB: mongodb://localhost:27017

