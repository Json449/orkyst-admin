"""
Pipeline orchestrator — runs all 5 steps in sequence.

Usage:
  python pipeline/run_pipeline.py                        # local test (user_id = "local_test")
  python pipeline/run_pipeline.py --user-id user_abc123  # specific user
"""

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from pipeline import data_loader, chunker  # noqa: E402
from pipeline.user_config import resolve_user_id  # noqa: E402
import os
import json
from pathlib import Path


def _mock_load_chunks(chunks: list[str], user_id: str | None = None) -> None:
    uid = resolve_user_id(user_id)
    root = Path(__file__).parent.parent
    out_path = root / f"mock_loaded_chunks_{uid}.json"
    print(f"NEO4J or LLM unavailable — performing mock load and writing {out_path}")
    out_path.write_text(json.dumps({"userId": uid, "chunks": chunks}, indent=2))
    for i, chunk_text in enumerate(chunks):
        print(f"  [MOCK:{uid}] Pretending to load chunk {i + 1}/{len(chunks)} ...")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--user-id",
        default=None,
        help="User ID to scope this pipeline run. Omit to use local_test bypass.",
    )
    args = parser.parse_args()
    user_id = resolve_user_id(args.user_id)

    print(f"Pipeline running for user: {user_id}")

    json_path = ROOT / "dummy_input_data.json"

    print("Step 1 — Loading data ...")
    records = data_loader.load(json_path)
    print(f"  Loaded {len(records)} domain records.")

    print("Step 2 — Chunking ...")
    chunks = chunker.chunk(records)
    print(f"  Produced {len(chunks)} text chunks.")

    print("Step 3 & 4 — Entity extraction + vectorization (via Gemini + HuggingFace) ...")
    print("Step 5 — Loading into Neo4j Aura ...")

    # Prefer the real loader when available and when required env vars exist.
    use_real = True
    try:
        import pipeline.neo4j_loader as neo4j_loader  # type: ignore
    except Exception:
        neo4j_loader = None
        use_real = False

    required_env = ("NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD", "GEMINI_API_KEY")
    if any(os.getenv(k) is None for k in required_env):
        use_real = False

    if use_real and neo4j_loader is not None:
        neo4j_loader.load_chunks(chunks, user_id=user_id)
    else:
        _mock_load_chunks(chunks, user_id=user_id)

    print(f"Pipeline complete for user: {user_id}")


if __name__ == "__main__":
    main()
