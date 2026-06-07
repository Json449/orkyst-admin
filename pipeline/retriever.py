"""
Neo4j Retriever
Pulls domain entities, relationships, and chunk texts scoped to a specific userId.
All queries filter through Document nodes tagged with userId so users never see each other's data.
"""

import os

import neo4j
from dotenv import load_dotenv

from pipeline.user_config import resolve_user_id

load_dotenv()


def _driver() -> neo4j.Driver:
    return neo4j.GraphDatabase.driver(
        os.environ["NEO4J_URI"],
        auth=(os.environ["NEO4J_USERNAME"], os.environ["NEO4J_PASSWORD"]),
    )


def fetch_graph_context(user_id: str | None = None) -> dict:
    """
    Returns graph context scoped to the given user_id.
    Falls back to LOCAL_TEST_USER_ID when user_id is None.

    Returns:
        {
          "user_id": str,
          "chunk_texts": [...],
          "entities": { "Account": [...], "Metric": [...], ... },
          "relationships": [...]
        }
    """
    uid = resolve_user_id(user_id)

    with _driver() as driver:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as s:
            chunk_texts = _fetch_chunks(s, uid)
            entities    = _fetch_entities(s, uid)
            rels        = _fetch_relationships(s, uid)

    return {
        "user_id":     uid,
        "chunk_texts": chunk_texts,
        "entities":    entities,
        "relationships": rels,
    }


def _fetch_chunks(s: neo4j.Session, uid: str) -> list[str]:
    result = s.run(
        """
        MATCH (doc:Document {userId: $uid})-[:FROM_DOCUMENT]-(c:Chunk)
        RETURN c.text AS text
        ORDER BY c.index
        """,
        uid=uid,
    )
    return [r["text"] for r in result if r["text"]]


def _fetch_entities(s: neo4j.Session, uid: str) -> dict[str, list[dict]]:
    domain_labels = ["Account", "Platform", "ContentType", "Metric",
                     "Post", "Sentiment", "Recommendation"]
    entities: dict[str, list[dict]] = {label: [] for label in domain_labels}

    result = s.run(
        """
        MATCH (doc:Document {userId: $uid})-[:FROM_DOCUMENT]-(c:Chunk)-[:FROM_CHUNK]-(n)
        WHERE NOT n:Chunk AND NOT n:Document
        RETURN DISTINCT labels(n) AS labels, properties(n) AS props
        """,
        uid=uid,
    )
    for record in result:
        props = dict(record["props"])
        for label in record["labels"]:
            if label in entities:
                entities[label].append(props)
                break

    return {k: v for k, v in entities.items() if v}


def _fetch_relationships(s: neo4j.Session, uid: str) -> list[dict]:
    skip = {"__KGBuilder__", "__Entity__", "Chunk", "Document"}

    result = s.run(
        """
        MATCH (doc:Document {userId: $uid})-[:FROM_DOCUMENT]-(c:Chunk)-[:FROM_CHUNK]-(n)
        MATCH (n)-[r]->(m)
        WHERE NOT n:Chunk AND NOT n:Document
          AND NOT m:Chunk AND NOT m:Document
          AND NOT type(r) IN ['FROM_CHUNK', 'FROM_DOCUMENT', 'NEXT_CHUNK']
        RETURN
            labels(n) AS from_labels, properties(n).name AS from_name,
            type(r)   AS rel,
            labels(m) AS to_labels,  properties(m).name AS to_name
        """,
        uid=uid,
    )

    rows = []
    for r in result:
        from_label = next((l for l in r["from_labels"] if l not in skip), None)
        to_label   = next((l for l in r["to_labels"]   if l not in skip), None)
        if from_label and to_label:
            rows.append({
                "from": f"{from_label}:{r['from_name']}",
                "rel":  r["rel"],
                "to":   f"{to_label}:{r['to_name']}",
            })
    return rows


def list_users() -> list[str]:
    """Return all user IDs that have data in the graph."""
    with _driver() as driver:
        with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as s:
            result = s.run(
                "MATCH (doc:Document) WHERE doc.userId IS NOT NULL "
                "RETURN DISTINCT doc.userId AS uid ORDER BY uid"
            )
            return [r["uid"] for r in result]
