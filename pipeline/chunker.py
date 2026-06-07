"""
Step 2 — Chunker
Converts DataRecord payloads into prose text chunks the LLM can extract entities from.
"""

from pipeline.data_loader import DataRecord


def _overview_to_text(payload: dict) -> list[str]:
    chunks = []

    cta = payload.get("ctaPerformance", {})
    chunks.append(
        f"Orkyst CTA Performance (last 30 days): "
        f"Total link clicks {cta.get('totalLinkClicks', {}).get('value', 0):,} "
        f"({cta.get('totalLinkClicks', {}).get('deltaLabel', '')}). "
        f"Site visits {cta.get('siteVisits', {}).get('value', 0):,} "
        f"({cta.get('siteVisits', {}).get('deltaLabel', '')}). "
        f"New audience {cta.get('newAudience', {}).get('value', 0):,} "
        f"({cta.get('newAudience', {}).get('deltaLabel', '')}). "
        f"Average CTR {cta.get('avgCtr', {}).get('value', 0):.1%} "
        f"({cta.get('avgCtr', {}).get('deltaLabel', '')})."
    )

    for item in payload.get("clicksByContentType", []):
        chunks.append(
            f"Content type '{item['label']}' received {item['clicks']:,} link clicks in the last 30 days."
        )

    for item in payload.get("platformDistribution", []):
        chunks.append(
            f"Platform {item['label']} accounts for {item['sharePct']}% of total platform distribution."
        )

    return chunks


def _account_to_text(payload: dict) -> list[str]:
    acct = payload.get("account", {})
    summary = payload.get("summary", {})
    chunks = [
        f"Orkyst {acct.get('platform', '').capitalize()} account {acct.get('handle', '')} "
        f"has {acct.get('followers', 0):,} followers "
        f"(+{acct.get('followersDelta', 0):,}, +{acct.get('followersDeltaPct', 0):.2f}%). "
        f"Summary: {summary.get('impressions', 0):,} impressions, "
        f"{summary.get('reach', 0):,} reach, "
        f"{summary.get('engagements', 0):,} engagements, "
        f"engagement rate {summary.get('engagementRate', 0):.2%}, "
        f"{summary.get('posts', 0)} posts."
    ]

    for point in payload.get("engagementTrend", []):
        chunks.append(
            f"On {point['date']} the account recorded {point['impressions']:,} impressions "
            f"and {point['engagements']:,} engagements."
        )

    return chunks


def _posts_to_text(payload: dict) -> list[str]:
    chunks = []
    for post in payload.get("posts", []):
        chunks.append(
            f"Post '{post['title']}' (id: {post['id']}) is a {post['contentTypeLabel']} "
            f"published on {post['platform'].capitalize()} on {post['publishedAt'][:10]}. "
            f"It achieved {post['impressionsLabel']} impressions, "
            f"{post['engagementsLabel']} engagements, "
            f"and an engagement rate of {post['engagementRateLabel']}."
        )
    return chunks


def _sentiment_to_text(payload: dict) -> list[str]:
    overall = payload.get("overall", {})
    chunks = [
        f"Overall sentiment across {payload.get('totalAnalyzed', 0):,} analyzed items: "
        f"{overall.get('positivePct', 0)}% positive, "
        f"{overall.get('neutralPct', 0)}% neutral, "
        f"{overall.get('negativePct', 0)}% negative. "
        f"Sentiment trend: {payload.get('trendLabel', '')}."
    ]

    for plat in payload.get("byPlatform", []):
        chunks.append(
            f"{plat['platform'].capitalize()} sentiment: "
            f"{plat['positivePct']}% positive, "
            f"{plat['neutralPct']}% neutral, "
            f"{plat['negativePct']}% negative."
        )

    keywords = payload.get("trendingKeywords", {})
    if keywords.get("positive"):
        chunks.append(f"Trending positive keywords: {', '.join(keywords['positive'])}.")
    if keywords.get("negative"):
        chunks.append(f"Trending negative keywords: {', '.join(keywords['negative'])}.")

    return chunks


def _trends_to_text(payload: dict) -> list[str]:
    chunks = []
    r = payload.get("range", {})
    header = f"Engagement trend from {r.get('start')} to {r.get('end')} ({r.get('granularity')} granularity)."
    for series in payload.get("series", []):
        metric = series["metric"]
        points_text = "; ".join(
            f"{p['date']}: {p['value']:,}" for p in series.get("points", [])
        )
        chunks.append(f"{header} {metric.capitalize()} — {points_text}.")
    return chunks


def _recommendations_to_text(payload: dict) -> list[str]:
    chunks = [
        f"AI analysis recommends posting on {payload.get('bestDay')} at {payload.get('bestTime')} "
        f"with a focus on {payload.get('topPlatform')}. "
        f"Projected engagement uplift: +{payload.get('projectedUpliftPct')}%."
    ]
    for rec in payload.get("recommendations", []):
        chunks.append(
            f"Recommendation '{rec['title']}' (impact: {rec['impact'].upper()}, "
            f"category: {rec['category']}): {rec['description']} "
            f"Expected metric improvement: {rec['metricLabel']}."
        )
    return chunks


_DOMAIN_HANDLERS = {
    "overview": _overview_to_text,
    "account": _account_to_text,
    "posts": _posts_to_text,
    "sentiment": _sentiment_to_text,
    "trends": _trends_to_text,
    "recommendations": _recommendations_to_text,
}


def chunk(records: list[DataRecord]) -> list[str]:
    all_chunks: list[str] = []
    for record in records:
        handler = _DOMAIN_HANDLERS.get(record.domain)
        if handler:
            all_chunks.extend(handler(record.payload))
    return all_chunks
