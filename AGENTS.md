# AGENTS.md

Project instructions and context for AI coding assistants working in this repository.

## Project Summary

This repository contains the Orkyst graph-based analytics pipeline and dashboard prototype.

The system ingests analytics/social data, converts it into graph-friendly records, extracts entities and relationships with Gemini, stores graph context in Neo4j, and exposes analytics through both:

- A Python/Streamlit dashboard in `dashboard/app.py`
- A FastAPI backend in `api/server.py`
- A Next.js frontend in `frontend/`

## Current Architecture

Main pipeline flow:

1. `pipeline/data_loader.py` loads local JSON analytics data.
2. `pipeline/chunker.py` converts analytics records into text chunks.
3. `pipeline/entity_extractor.py` extracts graph entities/relationships with Gemini.
4. `pipeline/vectorizer.py` generates embeddings.
5. `pipeline/neo4j_loader.py` writes graph data to Neo4j.
6. `pipeline/retriever.py` fetches graph context by `userId`.
7. `pipeline/llm_analyst.py` generates AI insights/recommendations.
8. `dashboard/app.py` and `api/server.py` present the data.

## Important Project Rules

- Do not rewrite the full pipeline unless explicitly asked.
- Keep all user-specific graph data scoped by `userId`.
- Preserve `LOCAL_TEST_USER_ID = "local_test"` for local testing unless production hardening is requested.
- Do not hard-code real credentials into source files.
- Use `.env` for Neo4j and Gemini configuration.
- Prefer extending existing files over creating parallel replacement systems.
- For admin/user-base analytics, build inside the real Orkyst app codebase if available, not only this pipeline prototype.

## Environment Variables

Expected `.env` values:

```env
NEO4J_URI=neo4j+s://<instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=neo4j
GEMINI_API_KEY=<key>
```

## Running Locally

Python dependencies are listed in `requirements.txt`.

Recommended local backend command:

```bash
python -m uvicorn api.server:app --host 127.0.0.1 --port 8002
```

Recommended frontend command:

```bash
cd frontend
npm run dev -- --hostname 127.0.0.1 --port 3002
```

Streamlit dashboard:

```bash
streamlit run dashboard/app.py
```

Pipeline:

```bash
python pipeline/run_pipeline.py
```

## Current Local Notes

- The existing `.venv` may not be reliable on every machine.
- A Python 3.12 virtual environment was used successfully as `.venv312`.
- The Next.js frontend expects `frontend/lib/api.ts` and `frontend/lib/utils.ts`.
- The FastAPI CORS list should include the frontend dev origin when using non-default ports.

## Admin Dashboard Recommendation

The client needs visibility into the user base:

- Total users
- Signup frequency
- Recent signups
- Signin activity
- Events/activity data

Best implementation path:

- Build a protected `/admin` area in the real Orkyst application.
- Do not mix admin analytics into the normal user-facing Analytics dashboard.
- Show the admin entry only to admin users.
- Start with a simple MVP: KPI cards, signup trend, signin trend, recent users table, and event counts.
- Add deeper event analytics later if event tracking data already exists or can be added.

## Files To Read First

When starting work, inspect these files first:

- `README.md`
- `ENGINEER_HANDOFF.md`
- `api/server.py`
- `dashboard/app.py`
- `pipeline/processor.py`
- `pipeline/retriever.py`
- `pipeline/llm_analyst.py`
- `frontend/app/page.tsx`
- `frontend/components/analytics/`

## Development Style

- Keep changes small and focused.
- Match the existing frontend and backend patterns.
- Verify local endpoints after changes.
- If changing frontend data shapes, update both `api/server.py` and `frontend/lib/api.ts`.
- If changing pipeline data shapes, update `pipeline/processor.py`, `pipeline/chunker.py`, and any dashboard/API consumers.

