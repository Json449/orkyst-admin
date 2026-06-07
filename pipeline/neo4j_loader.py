"""
Step 5 — Neo4j Loader
Writes text chunks + extracted entities into Neo4j Aura using SimpleKGPipeline.
Every Document node is tagged with userId so data is fully isolated per user.
"""

import asyncio
import os

import neo4j
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline

from pipeline.entity_extractor import ANALYTICS_SCHEMA, GeminiLLM
from pipeline.user_config import resolve_user_id
from pipeline.vectorizer import HuggingFaceEmbedder


def build_pipeline(driver: neo4j.Driver) -> SimpleKGPipeline:
    llm = GeminiLLM(model_name="gemini-2.5-flash")
    embedder = HuggingFaceEmbedder()

    return SimpleKGPipeline(
        llm=llm,
        driver=driver,
        embedder=embedder,
        from_file=False,
        schema=ANALYTICS_SCHEMA,
        perform_entity_resolution=True,
        on_error="IGNORE",
        neo4j_database=os.getenv("NEO4J_DATABASE", "neo4j"),
    )


def load_chunks(chunks: list[str], user_id: str | None = None) -> None:
    uid = resolve_user_id(user_id)
    uri = os.environ["NEO4J_URI"]
    user = os.environ["NEO4J_USERNAME"]
    password = os.environ["NEO4J_PASSWORD"]

    with neo4j.GraphDatabase.driver(uri, auth=(user, password)) as driver:
        pipeline = build_pipeline(driver)

        async def _run():
            for i, chunk_text in enumerate(chunks):
                print(f"  [{uid}] Loading chunk {i + 1}/{len(chunks)} ...")
                await pipeline.run_async(
                    text=chunk_text,
                    document_metadata={"userId": uid},
                )

        asyncio.run(_run())
