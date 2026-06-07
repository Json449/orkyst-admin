"""
Step 3 — Entity Extraction
Gemini LLM wrapper compatible with neo4j-graphrag LLMInterface.
Defines the domain KG schema for analytics data.
"""

import os
from typing import Any, List, Optional, Union
import warnings; warnings.filterwarnings("ignore")

import google.generativeai as genai
from neo4j_graphrag.llm import LLMInterface, LLMResponse
from neo4j_graphrag.llm.types import MessageList


class GeminiLLM(LLMInterface):
    """Wraps Google Gemini 1.5 Flash in the neo4j-graphrag LLMInterface contract."""

    def __init__(self, model_name: str = "gemini-2.5-flash", model_params: Optional[dict] = None) -> None:
        super().__init__(model_name=model_name, model_params=model_params)
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        self._client = genai.GenerativeModel(model_name)

    def invoke(
        self,
        input: str,
        message_history: Optional[Union[List[dict], MessageList]] = None,
        system_instruction: Optional[str] = None,
    ) -> LLMResponse:
        prompt = f"{system_instruction}\n\n{input}" if system_instruction else input
        response = self._client.generate_content(prompt)
        return LLMResponse(content=response.text)

    async def ainvoke(
        self,
        input: str,
        message_history: Optional[Union[List[dict], MessageList]] = None,
        system_instruction: Optional[str] = None,
    ) -> LLMResponse:
        prompt = f"{system_instruction}\n\n{input}" if system_instruction else input
        response = await self._client.generate_content_async(prompt)
        return LLMResponse(content=response.text)


# Domain schema grounding the LLM to analytics-relevant entities
ANALYTICS_SCHEMA = {
    "node_types": [
        {"label": "Post", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "contentType", "type": "STRING"},
            {"name": "publishedAt", "type": "STRING"},
            {"name": "engagementRate", "type": "FLOAT"},
            {"name": "impressions", "type": "INTEGER"},
            {"name": "engagements", "type": "INTEGER"},
        ]},
        {"label": "Platform", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "sharePct", "type": "FLOAT"},
        ]},
        {"label": "Account", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "handle", "type": "STRING"},
            {"name": "followers", "type": "INTEGER"},
            {"name": "engagementRate", "type": "FLOAT"},
        ]},
        {"label": "ContentType", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "clicks", "type": "INTEGER"},
        ]},
        {"label": "Metric", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "value", "type": "FLOAT"},
            {"name": "unit", "type": "STRING"},
        ]},
        {"label": "Recommendation", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "impact", "type": "STRING"},
            {"name": "category", "type": "STRING"},
            {"name": "metricLabel", "type": "STRING"},
        ]},
        {"label": "Sentiment", "properties": [
            {"name": "name", "type": "STRING"},
            {"name": "positivePct", "type": "FLOAT"},
            {"name": "negativePct", "type": "FLOAT"},
            {"name": "neutralPct", "type": "FLOAT"},
        ]},
    ],
    "relationship_types": [
        {"label": "PUBLISHED_ON"},
        {"label": "BELONGS_TO"},
        {"label": "HAS_METRIC"},
        {"label": "RECOMMENDED_FOR"},
        {"label": "EXPRESSED_IN"},
        {"label": "MANAGED_BY"},
        {"label": "PERFORMED_ON"},
    ],
    "patterns": [
        ["Post", "PUBLISHED_ON", "Platform"],
        ["Post", "BELONGS_TO", "ContentType"],
        ["Post", "HAS_METRIC", "Metric"],
        ["Post", "EXPRESSED_IN", "Sentiment"],
        ["Account", "MANAGED_BY", "Platform"],
        ["Account", "PERFORMED_ON", "Metric"],
        ["Recommendation", "RECOMMENDED_FOR", "Platform"],
    ],
    "additional_node_types": False,
}
