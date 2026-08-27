# Orkyst — Graph-Based Analytics Pipeline

End-to-end system that ingests social media analytics data, builds a Knowledge Graph in Neo4j, and exposes a Streamlit dashboard for Orkyst.com.

---

## Architecture Overview

```
JSON / Cron API
      │
      ▼
┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐
│  1. Load    │───▶│  2. Chunk   │───▶│  3. Extract      │───▶│  4. Vectorize   │───▶│  5. Neo4j    │
│    Data     │    │             │    │    Entities       │    │    (HuggingFace)│    │    Loader    │
└─────────────┘    └─────────────┘    └──────────────────┘    └─────────────────┘    └──────────────┘
                                             │ Gemini LLM                                     │
                                             └─────────────────────────────────────────────────┘
                                                                                              │
                                                                                    Neo4j Aura (cloud)
                                                                                              │
                                                                                              ▼
                                                                                   Streamlit Dashboard
```

---

## Project Structure

```
graph-based-data-analytics-pipeline/
├── .env                              # Neo4j + Gemini credentials
├── requirements.txt
├── pipeline/
│   ├── __init__.py
│   ├── data_loader.py        # Step 1 — load & normalise JSON / API response
│   ├── chunker.py            # Step 2 — convert records to text chunks
│   ├── entity_extractor.py   # Step 3 — Gemini entity + relation extraction
│   ├── vectorizer.py         # Step 4 — HuggingFace sentence-transformer embeddings
│   ├── neo4j_loader.py       # Step 5 — write KG + embeddings to Neo4j Aura
│   └── run_pipeline.py       # Orchestrator — runs steps 1-5 sequentially
└── dashboard/
    └── app.py                # Streamlit dashboard (4 tabs)
```

---

## Pipeline — Step by Step

### Step 1 — Data Loader (`pipeline/data_loader.py`)

Reads an analytics JSON payload and normalises each endpoint's response into flat Python dicts grouped by domain (overview, account, posts, sentiment, trends, recommendations).

Output: list of `DataRecord(endpoint, payload)` objects.

---

### Step 2 — Chunker (`pipeline/chunker.py`)

Converts each analytics record into human-readable prose so the LLM has natural language to extract entities from. Examples:

- `"Post '5 Marketing Trends for 2026' published on LinkedIn on 2026-01-12 achieved an engagement rate of 7.5% with 24,500 impressions and 1,847 engagements."`
- `"LinkedIn sentiment: 72% positive, 20% neutral, 8% negative."`
- `"Recommendation: Optimize posting schedule (HIGH impact) — LinkedIn posts perform 43% better between 9–11 AM on Tuesdays and Thursdays. Projected uplift: +43% engagement."`

Uses `neo4j_graphrag`'s `FixedSizeSplitter` (chunk_size=500, chunk_overlap=50) to keep chunks within the LLM context window.

Output: `TextChunks` list (neo4j-graphrag native type).

---

### Step 3 — Entity Extraction (`pipeline/entity_extractor.py`)

**LLM**: Gemini 1.5 Flash via `google-generativeai`, wrapped in a custom `LLMInterface` subclass compatible with `neo4j-graphrag`.

**Knowledge Graph Schema** (domain-specific, hard-coded):

| Node Type | Key Properties |
|-----------|---------------|
| `Post` | id, title, contentType, publishedAt |
| `Platform` | name (linkedin / instagram / twitter / facebook) |
| `Account` | handle, displayName, followers |
| `ContentType` | label (Blog / Case Study / Social / External Media) |
| `Metric` | name, value, unit |
| `Recommendation` | id, title, impact, category, metricLabel |
| `Sentiment` | label (positive / neutral / negative), score |

| Relationship | Pattern |
|-------------|---------|
| `PUBLISHED_ON` | `(Post) → (Platform)` |
| `HAS_METRIC` | `(Post) → (Metric)` |
| `BELONGS_TO` | `(Post) → (ContentType)` |
| `RECOMMENDED_FOR` | `(Recommendation) → (Platform)` |
| `EXPRESSED_IN` | `(Sentiment) → (Post)` |
| `MANAGED_BY` | `(Account) → (Platform)` |
| `PERFORMED_ON` | `(Account) → (Metric)` |

Uses `LLMEntityRelationExtractor` with `on_error=IGNORE` so a single bad chunk does not abort the pipeline.

Output: `Neo4jGraph` (nodes + relationships ready for writing).

---

### Step 4 — Vectorisation (`pipeline/vectorizer.py`)

**Model**: `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace, runs fully local, no API key, 384-dimensional embeddings).

Wrapped in `neo4j_graphrag`'s `Embedder` interface via `TextChunkEmbedder`. Each chunk gets an embedding stored as the `embedding` property on the `Chunk` node in Neo4j, enabling vector similarity search later.

Output: `TextChunks` with `.metadata["embedding"]` populated on every chunk.

---

### Step 5 — Neo4j Loader (`pipeline/neo4j_loader.py`)

Uses `neo4j_graphrag.experimental.pipeline.kg_builder.SimpleKGPipeline` with:

- `llm` — Gemini wrapper from Step 3
- `driver` — Neo4j Aura bolt driver (credentials from `.env`)
- `embedder` — HuggingFace embedder from Step 4
- `schema` — the domain schema defined in Step 3
- `perform_entity_resolution=True` — runs `SinglePropertyExactMatchResolver` after ingestion to deduplicate nodes that share the same label + `name` property (e.g. the same platform mentioned across multiple chunks)
- `lexical_graph_config` — creates `Document → Chunk → Entity` node chain with `NEXT_CHUNK` and `FROM_DOCUMENT` relationships

The resulting graph in Neo4j Aura looks like:

```
(Document)
    │ FROM_DOCUMENT
    ▼
(Chunk) ──NEXT_CHUNK──▶ (Chunk) ──NEXT_CHUNK──▶ ...
    │ PART_OF_CHUNK
    ▼
(Post) ──PUBLISHED_ON──▶ (Platform)
  │                            │
  └──HAS_METRIC──▶ (Metric)   └──MANAGED_BY──▶ (Account)
  │
  └──EXPRESSED_IN──▶ (Sentiment)
```

---

## Streamlit Dashboard (`dashboard/app.py`)

Four tabs backed by the analytics API.

### Tab 1 — Overview

- **4 KPI metric cards**: Total Link Clicks · Site Visits · New Audience · Avg CTR — each with delta badge (e.g. +12.5% vs last month)
- **Horizontal bar chart**: Clicks by Content Type (Blog / Case Studies / Social Links / External Media) — Plotly
- **Donut chart**: Platform Distribution (LinkedIn 42% / Instagram 28% / Twitter 20% / Facebook 10%) — Plotly

### Tab 2 — Account & Trends

- **Account summary card**: handle, followers, follower delta, engagement rate
- **Dual-axis line chart**: Impressions (left axis) vs Engagements (right axis) over time — Plotly
- **Top Performing Posts table**: sortable, with colour-coded engagement rate badges (green > 10%, amber 4–10%, red < 4%)

### Tab 3 — Sentiment Analysis

- **Overall sentiment donut**: Positive 62% / Neutral 28% / Negative 10%
- **Stacked horizontal bar**: Per-platform sentiment breakdown (LinkedIn / Instagram / Twitter / Facebook)
- **Keyword pills**: positive keywords (green) and negative keywords (red) rendered as styled HTML chips
- **Per-post comment explorer**: dropdown to select a post → shows each comment with author, sentiment label, score bar

### Tab 4 — AI Recommendations

- **Best time banner**: Best day · Best time · Top platform · Projected uplift (+35%)
- **4 Recommendation cards**: title, impact badge (HIGH = red / MEDIUM = amber), category tag, description, metric highlight
- Cards ordered by impact (high first)

**Styling**: custom CSS injected via `st.markdown` — dark background, Orkyst gradient accent, card box-shadows, Inter/sans-serif font stack.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| LLM (entity extraction) | Gemini 1.5 Flash (`google-generativeai`) | API key already available; fast and cost-effective for structured extraction |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | Free, local, no quota limits, strong semantic quality for short analytics text |
| Graph framework | `neo4j-graphrag[experimental]` | Matches the SimpleKGPipeline docs; handles chunking → extraction → writing in one interface |
| Graph database | Neo4j Aura (cloud) | Already provisioned instance |
| Dashboard | Streamlit | Python-native, rapid iteration, built-in layout primitives |
| Charts | Plotly Express | Interactive, professional, works natively with Streamlit |
| Entity resolution | `SinglePropertyExactMatchResolver` | Deduplicates platform / content-type nodes without needing spaCy or RapidFuzz |

---

## Environment Variables (`.env`)

```
NEO4J_URI=neo4j+s://<instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=neo4j
GEMINI_API_KEY=<key>
```

---

## Running the System

```bash
# Install dependencies
pip install -r requirements.txt

# Run the 5-step pipeline (loads data → builds KG in Neo4j)
python pipeline/run_pipeline.py

# Launch the dashboard
streamlit run dashboard/app.py
```

---

## Production Swap: JSON → Live API

The only file that changes when moving from dev to production is `pipeline/data_loader.py`. Replace the JSON file read with HTTP calls to the Orkyst API endpoints:

```
GET /api/analytics/overview
GET /api/analytics/account/:id
GET /api/analytics/posts
GET /api/analytics/sentiment
GET /api/analytics/trends
GET /api/analytics/recommendations
```

A cron job (e.g. GitHub Actions, Railway, or a simple `cron` entry) calls `run_pipeline.py` on a schedule (e.g. every hour) to keep the Knowledge Graph current.

---

## Key Design Decisions

**Why a Knowledge Graph instead of a flat database?**
Analytics data has rich relationships — a Post belongs to a ContentType, is published on a Platform, generates Metrics, attracts Sentiment, and influences Recommendations. A graph makes these relationships first-class, enabling queries like "which content types drive the most positive sentiment on LinkedIn?" without complex joins.

**Why Gemini for extraction and HuggingFace for embeddings?**
Gemini handles the reasoning-heavy entity extraction task where a capable LLM is necessary. HuggingFace sentence-transformers handle the embedding task locally with no API cost — embeddings are deterministic and don't need an LLM.

**Why prose chunks instead of passing raw JSON to the LLM?**
LLMs extract entities more reliably from natural language than from raw JSON. Converting structured data to prose (Step 2) costs nothing and significantly improves extraction quality.
