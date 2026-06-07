# Engineer Handoff — Orkyst Graph Analytics Pipeline

**To:** Sarfaraz Ahmed Khan  
**Project:** graph-based-data-analytics-pipeline  
**Purpose:** Integration guide for connecting this pipeline to orkyst.com — cron jobs, live user data, per-user dashboards  

---

## What Has Been Built

This is a fully working end-to-end system. Do not rewrite it — extend it.

```
dummy_input_data.json          ← raw social media data (replace with live API)
        │
        ▼
pipeline/data_loader.py        ← Step 1: load & normalise records
pipeline/chunker.py            ← Step 2: convert to prose text chunks
pipeline/entity_extractor.py   ← Step 3: Gemini LLM entity extraction (schema defined here)
pipeline/vectorizer.py         ← Step 4: HuggingFace embeddings (all-MiniLM-L6-v2, local)
pipeline/neo4j_loader.py       ← Step 5: write KG to Neo4j Aura (tagged with userId)
pipeline/run_pipeline.py       ← Orchestrator (CLI entry point)
        │
        ▼
Neo4j Aura (cloud graph DB)    ← stores Document → Chunk → Entity nodes per user
        │
        ▼
pipeline/retriever.py          ← queries Neo4j filtered by userId
pipeline/llm_analyst.py        ← Gemini prompts → dynamic insights & recommendations
pipeline/processor.py          ← computes KPI numbers from raw input data
        │
        ▼
dashboard/app.py               ← Streamlit dashboard (tabs: Overview, Trends, Sentiment, AI Recommendations)
```

### Key design decisions you need to know

- **Everything is scoped by `userId`** — every `Document` node in Neo4j has a `userId` property. All retrieval queries filter by it. Users never see each other's data.
- **`pipeline/user_config.py`** defines `LOCAL_TEST_USER_ID = "local_test"`. When no `user_id` is passed, the system falls back to this. This is the local testing bypass — remove or gate it before going to production.
- **Gemini is used twice** — once in the KG pipeline (entity extraction) and once in the dashboard (live insight + recommendation generation via `llm_analyst.py`). These are separate calls.
- **HuggingFace embedder runs fully local** — no API key, no quota. Model is `sentence-transformers/all-MiniLM-L6-v2`.
- **The dashboard never queries Neo4j directly** — it goes through `retriever.py`, which handles all Cypher and userId scoping.

---

## Environment Variables Required

All secrets live in `.env` at the project root. Copy this to your server/CI environment:

```env
# Neo4j Aura
NEO4J_URI=neo4j+s://5ff27aef.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=neo4j

# Gemini (Google AI Studio key — not Vertex AI)
GEMINI_API_KEY=<key>
```

> **Note:** The current Neo4j Aura free tier instance may be paused after inactivity. Log in to console.neo4j.io to resume it before running anything. For production use a paid Aura instance or self-hosted Neo4j.

---

## Step 1 — Replace Dummy Data with Live Orkyst API Calls

Currently `pipeline/data_loader.py` reads from `dummy_input_data.json`. This is the **only file you need to change** to go live.

### What `data_loader.py` currently does

```python
def load(json_path) -> list[DataRecord]:
    raw = json.loads(Path(json_path).read_text())
    # parses 6 domain sections: overview, account, posts, sentiment, trends, recommendations
    ...
```

### What you need to replace it with

Create a new function `load_from_api(user_id: str) -> list[DataRecord]` that calls Orkyst's platform API endpoints and returns the same `DataRecord` list shape. The rest of the pipeline does not change.

```python
# pipeline/data_loader.py  ← your target structure

import httpx

ORKYST_API_BASE = "https://api.orkyst.com"   # or internal service URL

def load_from_api(user_id: str, auth_token: str) -> list[DataRecord]:
    headers = {"Authorization": f"Bearer {auth_token}"}
    records = []

    endpoints = {
        "overview":        f"/api/analytics/overview?userId={user_id}",
        "account":         f"/api/analytics/account?userId={user_id}",
        "posts":           f"/api/analytics/posts?userId={user_id}",
        "sentiment":       f"/api/analytics/sentiment?userId={user_id}",
        "trends":          f"/api/analytics/trends?userId={user_id}",
        "recommendations": f"/api/analytics/recommendations?userId={user_id}",
    }

    with httpx.Client(base_url=ORKYST_API_BASE, timeout=30) as client:
        for domain, path in endpoints.items():
            resp = client.get(path, headers=headers)
            resp.raise_for_status()
            records.append(DataRecord(endpoint=path, domain=domain, payload=resp.json()))

    return records
```

Then update `run_pipeline.py` to call `load_from_api(user_id, token)` instead of `load(json_path)`.

The shape of each `payload` dict must match what `pipeline/processor.py` and `pipeline/chunker.py` expect. Check those files if the API response shape differs — the mapping layer is in `chunker.py`'s domain handlers (`_overview_to_text`, `_posts_to_text`, etc.).

---

## Step 2 — Cron Job Setup (Per-User Pipeline Runs)

The pipeline is designed to be run on a schedule per user. Each run:
1. Pulls fresh data from Orkyst API for that user
2. Deletes the user's old graph data from Neo4j
3. Rebuilds the KG with the new data
4. The dashboard will reflect the new data on next load

### CLI interface (already built)

```bash
# Run for a specific user
python pipeline/run_pipeline.py --user-id <orkyst_user_id>

# Local test (no user-id → uses "local_test" bypass)
python pipeline/run_pipeline.py
```

### Adding the cleanup step before each run

Before loading fresh data, you should wipe the user's existing graph to avoid duplicate nodes. Add this to `neo4j_loader.py` inside `load_chunks()`:

```python
def _clear_user_graph(driver: neo4j.Driver, uid: str) -> None:
    """Delete all nodes and relationships for this user before reloading."""
    with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as s:
        s.run("""
            MATCH (doc:Document {userId: $uid})
            CALL {
                WITH doc
                MATCH (doc)-[:FROM_DOCUMENT]-(chunk:Chunk)
                OPTIONAL MATCH (chunk)-[:FROM_CHUNK]-(entity)
                DETACH DELETE chunk, entity
            }
            DETACH DELETE doc
        """, uid=uid)
```

Call `_clear_user_graph(driver, uid)` at the top of `load_chunks()` before the pipeline runs.

### Cron schedule recommendation

| Frequency | Use case |
|-----------|----------|
| Every 1 hour | Active users / live dashboard |
| Every 6 hours | Standard plan |
| Every 24 hours | Free tier / batch processing |

### Option A — System cron (simple)

```cron
# /etc/cron.d/orkyst-pipeline
# Run pipeline for all active users every hour
0 * * * * cd /srv/orkyst/pipeline && /usr/bin/python run_pipeline.py --user-id <user_id>
```

For multiple users, write a shell script that iterates over active user IDs pulled from your database:

```bash
#!/bin/bash
# scripts/run_all_users.sh
USERS=$(psql $DATABASE_URL -t -c "SELECT id FROM users WHERE active = true")
for USER_ID in $USERS; do
    python pipeline/run_pipeline.py --user-id "$USER_ID"
done
```

### Option B — Task queue (recommended for scale)

Use Celery + Redis or a managed job queue (Railway, Render Cron, GitHub Actions scheduled workflow):

```python
# tasks.py (Celery)
from celery import Celery
from pipeline.run_pipeline import run_for_user

app = Celery('orkyst', broker=os.environ['REDIS_URL'])

@app.task
def refresh_user_analytics(user_id: str):
    run_for_user(user_id)

# Schedule: beat config
app.conf.beat_schedule = {
    'refresh-all-users': {
        'task': 'tasks.refresh_all_users',
        'schedule': crontab(minute=0),  # every hour
    },
}
```

---

## Step 3 — Dashboard Integration into orkyst.com

### Option A — Embed Streamlit as an iframe

The fastest path. Deploy `dashboard/app.py` as a standalone Streamlit app and embed it:

```bash
# Deploy to Streamlit Community Cloud or self-host
streamlit run dashboard/app.py --server.port 8501 --server.address 0.0.0.0
```

In Orkyst frontend:
```html
<iframe src="https://analytics.orkyst.com?user_id={userId}" width="100%" height="900px" frameborder="0" />
```

Pass `user_id` via query param. In `dashboard/app.py`, read it:

```python
from streamlit.web.server.websocket_headers import _get_websocket_headers
import streamlit as st

# Read user_id from URL query param
params = st.query_params
user_id_from_url = params.get("user_id", None)
selected_user = resolve_user_id(user_id_from_url)
```

Replace the sidebar user selector with this once deployed. The sidebar selector is for local dev only.

### Option B — Expose as a JSON API (full integration)

If Orkyst has its own frontend, expose the analytics as REST endpoints. Create `api/server.py`:

```python
from fastapi import FastAPI, Header, HTTPException
from pipeline.retriever import fetch_graph_context
from pipeline.llm_analyst import generate_recommendations, analyze_overview

app = FastAPI()

@app.get("/api/analytics/{user_id}/recommendations")
async def recommendations(user_id: str, x_api_key: str = Header(...)):
    _verify_api_key(x_api_key)
    graph = fetch_graph_context(user_id=user_id)
    if not graph["chunk_texts"]:
        raise HTTPException(404, "No data found for this user. Run the pipeline first.")
    return generate_recommendations(graph)

@app.get("/api/analytics/{user_id}/overview")
async def overview(user_id: str, x_api_key: str = Header(...)):
    _verify_api_key(x_api_key)
    graph = fetch_graph_context(user_id=user_id)
    return analyze_overview(graph)
```

---

## Step 4 — Authentication & Security

Before going live, address these:

### 1. Remove the local test bypass in production

```python
# pipeline/user_config.py
import os

LOCAL_TEST_USER_ID = "local_test"

def resolve_user_id(user_id: str | None) -> str:
    if not user_id:
        if os.getenv("ENV") == "production":
            raise ValueError("user_id is required in production")
        return LOCAL_TEST_USER_ID   # only allowed in dev/local
    return user_id
```

### 2. Validate user_id before querying Neo4j

Never pass raw user input directly to Cypher. The current code uses parameterised queries (`$uid`) — this is already safe. Do not change to string interpolation.

### 3. Rotate the API keys

The `.env` file contains real credentials. Before open-sourcing or sharing this repo:
- Rotate `GEMINI_API_KEY` in Google AI Studio
- Reset `NEO4J_PASSWORD` in Neo4j Aura console
- Move secrets to a secret manager (AWS Secrets Manager, Doppler, or Vercel env vars)

---

## Step 5 — Production Neo4j Considerations

### Current state

Using Neo4j Aura Free. Fine for dev. Limitations:
- 1 database, 200MB storage, pauses after 3 days inactivity
- No SLA, no backups

### For production

1. **Upgrade to Aura Professional** or use a self-hosted Neo4j instance
2. **Add a composite index** on `userId` for fast per-user lookups:

```cypher
CREATE INDEX document_user_idx IF NOT EXISTS
FOR (d:Document)
ON (d.userId);
```

3. **Add a vector index** for semantic search on chunk embeddings:

```cypher
CREATE VECTOR INDEX chunk_embedding_idx IF NOT EXISTS
FOR (c:Chunk)
ON c.embedding
OPTIONS { indexConfig: { `vector.dimensions`: 384, `vector.similarity_function`: 'cosine' } };
```

4. **Data retention policy** — delete user data older than N days:

```cypher
MATCH (d:Document {userId: $uid})
WHERE d.createdAt < datetime() - duration({days: 90})
DETACH DELETE d
```

---

## Step 6 — File Reference

| File | Your concern |
|------|-------------|
| `pipeline/data_loader.py` | **Replace** `load()` with `load_from_api()` for live data |
| `pipeline/chunker.py` | Update domain handlers if API response shape changes |
| `pipeline/user_config.py` | Gate `local_test` bypass behind `ENV != production` |
| `pipeline/neo4j_loader.py` | Add `_clear_user_graph()` cleanup before each load |
| `pipeline/run_pipeline.py` | Add auth token arg; wire to `load_from_api()` |
| `pipeline/retriever.py` | No changes needed — already user-scoped |
| `pipeline/llm_analyst.py` | No changes needed — Gemini prompts are generic |
| `pipeline/processor.py` | Update to accept and process live API payload |
| `pipeline/entity_extractor.py` | Update `ANALYTICS_SCHEMA` if new entity types are added |
| `dashboard/app.py` | Replace sidebar user selector with URL query param reader |

---

## Step 7 — Running Locally Right Now

```bash
# 1. Activate venv
source .venv/bin/activate

# 2. Load env
cp .env .env.local  # already exists

# 3. Run pipeline (uses local_test bypass, reads dummy_input_data.json)
python pipeline/run_pipeline.py

# 4. Launch dashboard
streamlit run dashboard/app.py
# → Open http://localhost:8501
# → Sidebar shows "local_test" user with green "local bypass" indicator

# 5. Run pipeline for a specific user (to test isolation)
python pipeline/run_pipeline.py --user-id user_demo_001
```

---

## Known Limitations to Fix Before Launch

| Issue | Where | Fix |
|-------|-------|-----|
| `dummy_input_data.json` is static | `data_loader.py` | Replace with `load_from_api()` |
| No cleanup before re-running pipeline | `neo4j_loader.py` | Add `_clear_user_graph()` |
| Sidebar user selector is dev-only | `dashboard/app.py` | Replace with URL query param |
| `local_test` bypass is always on | `user_config.py` | Gate behind `ENV` check |
| Gemini calls are not cached persistently | `llm_analyst.py` | Cache results in Redis or Neo4j by `(userId, dataHash)` |
| No error boundary if Gemini fails | `llm_analyst.py` | Wrap `_call()` in try/except with fallback message |
| Neo4j Aura Free pauses on inactivity | Infrastructure | Upgrade to Aura Professional |
| No auth on the dashboard | `dashboard/app.py` | Add Streamlit session auth or deploy behind Orkyst auth proxy |

---

## Quick Glossary

| Term | Meaning in this codebase |
|------|--------------------------|
| `DataRecord` | One normalised API response (endpoint + domain + payload dict) |
| `chunk` | A prose sentence derived from analytics data, fed to the LLM |
| `Document` node | Neo4j node representing one pipeline run chunk group, tagged with `userId` |
| `Chunk` node | Neo4j node for one text chunk, has an `embedding` vector property |
| `__Entity__` label | Neo4j label added by SimpleKGPipeline to all domain entity nodes |
| `userId` | String identifier scoping all graph data to one Orkyst user |
| `local_test` | Hardcoded bypass user ID used when running locally without auth |
| `graph context` | Dict returned by `retriever.py`: chunk texts + entity nodes + triples |
| `llm_analyst` | Module that sends graph context to Gemini and returns parsed insights |

---

*Built with neo4j-graphrag · Gemini 2.5 Flash · sentence-transformers/all-MiniLM-L6-v2 · Streamlit · Plotly*
