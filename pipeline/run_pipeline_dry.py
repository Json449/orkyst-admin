"""
Lightweight dry-run for local testing without external APIs.

Runs steps 1 and 2 (load + chunk) and the internal `processor` to compute analytics
from `dummy_input_data.json`. Does NOT call external LLMs or Neo4j.

Usage:
  python pipeline/run_pipeline_dry.py
  python pipeline/run_pipeline_dry.py --user-id my_user
"""
from pathlib import Path
import argparse
import sys

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from pipeline import data_loader, chunker, processor  # noqa: E402
from pipeline.user_config import resolve_user_id  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-id", default=None)
    args = parser.parse_args()
    user_id = resolve_user_id(args.user_id)

    print(f"Dry-run pipeline for user: {user_id}")

    json_path = ROOT / "dummy_input_data.json"

    print("Step 1 — Loading data ...")
    records = data_loader.load(json_path)
    print(f"  Loaded {len(records)} domain records: {[r.domain for r in records]}")

    print("Step 1b — Running analytics processor (in-memory) ...")
    analytics = processor.process(json_path)
    print("  Processor produced keys:", list(analytics.keys()))

    print("Step 2 — Chunking ...")
    # data_loader.load() expects API-style payloads; processor.process returns
    # analytics dicts keyed by domain. Convert processor output to DataRecord
    # objects so the chunker can generate text chunks.
    records_from_processor = []
    for domain, payload in analytics.items():
      records_from_processor.append(data_loader.DataRecord(endpoint=f"processor/{domain}", domain=domain, payload=payload))
    chunks = chunker.chunk(records_from_processor)
    print(f"  Produced {len(chunks)} text chunks.")

    print("\nSample chunks (first 10):")
    for i, c in enumerate(chunks[:10], 1):
        print(f"  [{i}] {c}")


if __name__ == "__main__":
    main()
