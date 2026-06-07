"""
LLM Analyst
Passes graph-retrieved context to Gemini and returns fully dynamic analysis
for every section of the dashboard — no hardcoded values.
"""

import json
import os
import re
import warnings

warnings.filterwarnings("ignore")

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
_MODEL = "gemini-2.5-flash"


def _call(prompt: str) -> str:
    client = genai.GenerativeModel(_MODEL)
    response = client.generate_content(prompt)
    return response.text.strip()


def _extract_json(text: str) -> dict | list:
    """Strip markdown code fences and parse JSON from LLM response."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def _build_context(graph: dict) -> str:
    """Serialize graph context into a compact string for prompts."""
    uid    = graph.get("user_id", "unknown")
    chunks = "\n".join(f"- {t}" for t in graph["chunk_texts"])

    entity_lines = []
    for label, nodes in graph["entities"].items():
        for n in nodes:
            props = ", ".join(f"{k}={v}" for k, v in n.items())
            entity_lines.append(f"  [{label}] {props}")

    rel_lines = [f"  {r['from']} --{r['rel']}--> {r['to']}"
                 for r in graph["relationships"]]

    return (
        f"=== ANALYTICS DATA (user: {uid}) ===\n"
        f"{chunks}\n\n"
        "=== ENTITY NODES ===\n"
        + "\n".join(entity_lines) + "\n\n"
        "=== RELATIONSHIPS ===\n"
        + "\n".join(rel_lines)
    )


# ── Public analysis functions ─────────────────────────────────────────────────

def analyze_overview(graph: dict) -> dict:
    """
    Returns:
        { "insight": str }
    """
    ctx = _build_context(graph)
    prompt = f"""You are a senior marketing analyst. Based on the analytics data below, write a single
concise paragraph (2-3 sentences) summarising the most important CTA performance insight.
Mention specific numbers. Be direct and actionable. Do not use generic phrases.

{ctx}

Return a JSON object with one key: "insight" (string).
Return ONLY valid JSON, no markdown fences."""

    result = _extract_json(_call(prompt))
    return result if isinstance(result, dict) else {"insight": str(result)}


def analyze_account(graph: dict) -> dict:
    """
    Returns:
        { "narrative": str, "highlight": str }
    """
    ctx = _build_context(graph)
    prompt = f"""You are a social media analyst. Based on the data below, analyse the LinkedIn account performance.

{ctx}

Return a JSON object with:
- "narrative": 2-sentence performance summary with specific numbers
- "highlight": one standout metric or trend worth calling out (max 15 words)

Return ONLY valid JSON, no markdown fences."""

    result = _extract_json(_call(prompt))
    return result if isinstance(result, dict) else {"narrative": "", "highlight": ""}


def analyze_sentiment(graph: dict) -> dict:
    """
    Returns:
        { "summary": str, "trend_label": str, "trend_delta_pct": int }
    """
    ctx = _build_context(graph)
    prompt = f"""You are a sentiment analysis expert. Based on the analytics data below, analyse audience sentiment.

{ctx}

Return a JSON object with:
- "summary": 2-sentence interpretation of overall and per-platform sentiment with specific numbers
- "trend_label": short trend label like "+4% this month" or "-2% this week" (infer from data)
- "trend_delta_pct": integer (positive = improving, negative = declining)

Return ONLY valid JSON, no markdown fences."""

    result = _extract_json(_call(prompt))
    return result if isinstance(result, dict) else {
        "summary": "", "trend_label": "+0%", "trend_delta_pct": 0
    }


def generate_recommendations(graph: dict) -> dict:
    """
    Returns the full recommendations payload — entirely Gemini-generated.
    {
      "bestDay": str,
      "bestTime": str,
      "topPlatform": str,
      "projectedUpliftPct": int,
      "insight": str,
      "recommendations": [
        {
          "id": str,
          "title": str,
          "impact": "high"|"medium"|"low",
          "category": str,
          "description": str,
          "metricLabel": str
        }, ...
      ]
    }
    """
    ctx = _build_context(graph)
    prompt = f"""You are an expert growth marketer and data analyst for Orkyst, a social media intelligence platform.
Analyse the full analytics data below and generate actionable, data-grounded recommendations.

{ctx}

Return a JSON object with these exact keys:
- "bestDay": the best day of the week to post (infer from engagement patterns in the data)
- "bestTime": best time of day like "10:30 AM" (infer from data context)
- "topPlatform": platform name with highest engagement rate
- "projectedUpliftPct": integer — realistic projected engagement uplift if recommendations are followed
- "insight": 1-sentence overall strategic insight
- "recommendations": array of exactly 4 objects, each with:
    - "id": "rec_001" through "rec_004"
    - "title": short action title (max 6 words)
    - "impact": one of "high", "medium", "low"
    - "category": one of "schedule", "content_mix", "format", "experimentation", "platform", "audience"
    - "description": 2-sentence explanation grounded in the actual data with specific numbers or percentages
    - "metricLabel": short expected metric improvement like "+43% engagement" or "2.4x CTR"

All values must be derived from the data. Do not invent numbers that contradict the data.
Return ONLY valid JSON, no markdown fences."""

    raw = _call(prompt)
    result = _extract_json(raw)
    return result if isinstance(result, dict) else {}


def analyze_trends(graph: dict) -> dict:
    """
    Returns:
        { "summary": str, "momentum": str }
    """
    ctx = _build_context(graph)
    prompt = f"""You are a growth analyst. Analyse the engagement trend data below.

{ctx}

Return a JSON object with:
- "summary": 2-sentence trend narrative with specific numbers (impressions, engagements over time)
- "momentum": one word describing momentum — "Accelerating", "Steady", "Declining", or "Volatile"

Return ONLY valid JSON, no markdown fences."""

    result = _extract_json(_call(prompt))
    return result if isinstance(result, dict) else {"summary": "", "momentum": "Steady"}
