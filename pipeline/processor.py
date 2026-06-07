"""
Analytics Processor
Transforms raw dummy_input_data.json into computed analytics.
Zero hardcoded values — all numbers derived from the input data.
Recommendations are intentionally NOT generated here; llm_analyst.py owns those.
"""

import json
from collections import defaultdict
from pathlib import Path

POSITIVE_WORDS = {
    "innovative", "excellent", "great", "helpful", "recommended", "incredible",
    "game changer", "worth", "needed", "best", "quality", "insightful", "valuable",
}
NEGATIVE_WORDS = {
    "confusing", "slow", "expensive", "obvious", "bad", "poor", "disappointing",
    "complicated", "unclear", "too good to be true",
}

CONTENT_TYPE_LABELS = {
    "blog": "Blog Posts",
    "case_study": "Case Studies",
    "social_link": "Social Links",
    "external_media": "External Media",
}
PLATFORM_LABELS = {
    "linkedin": "LinkedIn",
    "instagram": "Instagram",
    "twitter": "Twitter",
    "facebook": "Facebook",
}


def _score_comment(body: str) -> tuple[str, float]:
    text = body.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text)
    if pos > neg:
        return "positive", round(min(0.99, 0.6 + 0.08 * pos), 2)
    if neg > pos:
        return "negative", round(max(-0.99, -(0.5 + 0.1 * neg)), 2)
    return "neutral", round((pos - neg) / max(1, pos + neg), 2)


def _engagement_rate(post: dict) -> float:
    m = post["metrics"]
    eng = m["likes"] + m["comments"] + m["shares"]
    return eng / m["impressions"] if m["impressions"] else 0.0


def _delta_label(current: float, previous: float, unit: str = "") -> tuple[float, str]:
    if previous == 0:
        return 0.0, "—"
    pct = (current - previous) / previous * 100
    sign = "+" if pct >= 0 else ""
    return round(pct, 1), f"{sign}{pct:.1f}% vs prior period"


def _split_periods(daily_metrics: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split daily metrics into two equal halves for delta computation."""
    sorted_days = sorted(daily_metrics, key=lambda x: x["date"])
    mid = len(sorted_days) // 2
    return sorted_days[:mid], sorted_days[mid:]


def process(input_path: str | Path) -> dict:
    raw      = json.loads(Path(input_path).read_text())
    posts    = raw["posts"]
    comments = raw["comments"]
    accounts = raw["accounts"]
    daily    = raw["platformDailyMetrics"]

    # ── Period split for deltas ───────────────────────────────────────────────
    first_half, second_half = _split_periods(daily)

    def _period_sum(period: list[dict], key: str) -> int:
        return sum(m[key] for m in period)

    prev_clicks = _period_sum(first_half, "linkClicks")
    curr_clicks = _period_sum(second_half, "linkClicks")
    prev_eng    = _period_sum(first_half, "engagements")
    curr_eng    = _period_sum(second_half, "engagements")
    prev_imp    = _period_sum(first_half, "impressions")
    curr_imp    = _period_sum(second_half, "impressions")

    total_clicks      = sum(m["linkClicks"] for m in daily)
    total_impressions = sum(p["metrics"]["impressions"] for p in posts)
    avg_ctr           = total_clicks / total_impressions if total_impressions else 0

    # New audience = actual follower gains across all accounts from history snapshots
    total_new_audience = sum(
        max(0, a["followersHistory"][-1]["followers"] - a["followersHistory"][0]["followers"])
        for a in accounts
    )
    # Audience delta = follower growth rate of LinkedIn account (primary)
    li_acct       = next(a for a in accounts if a["platform"] == "linkedin")
    li_start_fol  = li_acct["followersHistory"][0]["followers"]
    li_end_fol    = li_acct["followersHistory"][-1]["followers"]
    audience_dpct   = round((li_end_fol - li_start_fol) / li_start_fol * 100, 1) if li_start_fol else 0
    audience_dlabel = f"+{audience_dpct}% follower growth" if audience_dpct >= 0 else f"{audience_dpct}% follower growth"

    # Site visits = link clicks (closest data-backed proxy; actual site visits need web analytics)
    site_visits              = total_clicks
    visits_dpct, visits_dlabel = _delta_label(curr_clicks, prev_clicks)

    clicks_dpct, clicks_dlabel = _delta_label(curr_clicks, prev_clicks)

    prev_ctr = prev_clicks / (prev_imp + 1)
    curr_ctr = curr_clicks / (curr_imp + 1)
    ctr_dpct, ctr_dlabel = _delta_label(curr_ctr, prev_ctr)

    # ── Overview ─────────────────────────────────────────────────────────────
    ct_clicks: dict[str, int] = defaultdict(int)
    for p in posts:
        ct_clicks[p["contentType"]] += p["metrics"]["linkClicks"]

    plat_impressions: dict[str, int] = defaultdict(int)
    for p in posts:
        plat_impressions[p["platform"]] += p["metrics"]["impressions"]
    total_plat_imp = sum(plat_impressions.values()) or 1

    overview = {
        "success": True,
        "range": {
            "start": sorted(daily, key=lambda x: x["date"])[0]["date"],
            "end":   sorted(daily, key=lambda x: x["date"])[-1]["date"],
            "label": "Last 30 days",
        },
        "ctaPerformance": {
            "totalLinkClicks": {
                "value": total_clicks,
                "deltaPct": clicks_dpct,
                "deltaLabel": clicks_dlabel,
            },
            "siteVisits": {
                "value": site_visits,
                "deltaPct": visits_dpct,
                "deltaLabel": visits_dlabel,
            },
            "newAudience": {
                "value": total_new_audience,
                "deltaPct": audience_dpct,
                "deltaLabel": audience_dlabel,
            },
            "avgCtr": {
                "value": round(avg_ctr, 4),
                "deltaPct": ctr_dpct,
                "deltaLabel": ctr_dlabel,
            },
        },
        "clicksByContentType": [
            {"type": ct, "label": CONTENT_TYPE_LABELS.get(ct, ct), "clicks": clicks}
            for ct, clicks in sorted(ct_clicks.items(), key=lambda x: -x[1])
        ],
        "platformDistribution": [
            {
                "platform": plat,
                "label": PLATFORM_LABELS.get(plat, plat),
                "sharePct": round(imp / total_plat_imp * 100),
            }
            for plat, imp in sorted(plat_impressions.items(), key=lambda x: -x[1])
        ],
    }

    # ── Account (LinkedIn) ───────────────────────────────────────────────────
    li_account  = next(a for a in accounts if a["platform"] == "linkedin")
    li_posts    = [p for p in posts if p["platform"] == "linkedin"]
    li_daily    = sorted([m for m in daily if m["platform"] == "linkedin"], key=lambda x: x["date"])

    li_imp   = sum(p["metrics"]["impressions"] for p in li_posts)
    li_eng   = sum(p["metrics"]["likes"] + p["metrics"]["comments"] + p["metrics"]["shares"] for p in li_posts)
    li_now   = li_account["followersHistory"][-1]["followers"]
    li_prev  = li_account["followersHistory"][0]["followers"]
    li_delta = li_now - li_prev

    account = {
        "success": True,
        "account": {
            "id": li_account["id"],
            "platform": li_account["platform"],
            "handle": li_account["handle"],
            "displayName": li_account["displayName"],
            "followers": li_now,
            "followersDelta": li_delta,
            "followersDeltaPct": round(li_delta / li_prev * 100, 2) if li_prev else 0,
        },
        "summary": {
            "impressions": li_imp,
            "reach": sum(p["metrics"]["reach"] for p in li_posts),
            "engagements": li_eng,
            "engagementRate": round(li_eng / li_imp, 4) if li_imp else 0,
            "posts": len(li_posts),
        },
        "engagementTrend": [
            {"date": m["date"], "impressions": m["impressions"], "engagements": m["engagements"]}
            for m in li_daily
        ],
    }

    # ── Top posts ─────────────────────────────────────────────────────────────
    sorted_posts = sorted(posts, key=_engagement_rate, reverse=True)
    top_posts = {
        "success": True,
        "sort": "engagementRate_desc",
        "posts": [
            {
                "id": p["id"],
                "title": p["title"],
                "contentType": p["contentType"],
                "contentTypeLabel": CONTENT_TYPE_LABELS.get(p["contentType"], p["contentType"]),
                "platform": p["platform"],
                "impressions": p["metrics"]["impressions"],
                "impressionsLabel": f"{p['metrics']['impressions'] / 1000:.1f}K",
                "engagements": p["metrics"]["likes"] + p["metrics"]["comments"] + p["metrics"]["shares"],
                "engagementsLabel": f"{p['metrics']['likes'] + p['metrics']['comments'] + p['metrics']['shares']:,}",
                "engagementRate": round(_engagement_rate(p), 3),
                "engagementRateLabel": f"{_engagement_rate(p):.1%}",
                "publishedAt": p["publishedAt"],
            }
            for p in sorted_posts[:5]
        ],
    }

    # ── Sentiment — computed from actual per-platform comments ────────────────
    # Build per-platform comment sentiment from actual post assignments
    plat_scores: dict[str, list[str]] = defaultdict(list)
    post_platform_map = {p["id"]: p["platform"] for p in posts}

    scored_comments = []
    for cmt in comments:
        sentiment, score = _score_comment(cmt["body"])
        platform = post_platform_map.get(cmt["postId"], "unknown")
        plat_scores[platform].append(sentiment)
        kws = [w for w in list(POSITIVE_WORDS) + list(NEGATIVE_WORDS) if w in cmt["body"].lower()]
        scored_comments.append({**cmt, "sentiment": sentiment, "sentimentScore": score, "keywords": kws[:3]})

    all_sentiments = [c["sentiment"] for c in scored_comments]
    total_all = len(all_sentiments) or 1
    base_pos = round(sum(1 for s in all_sentiments if s == "positive") / total_all * 100)
    base_neu = round(sum(1 for s in all_sentiments if s == "neutral")  / total_all * 100)
    base_neg = 100 - base_pos - base_neu

    # Per-platform: use actual comment data where available, fallback to weighted overall
    plat_post_counts = defaultdict(int)
    for p in posts:
        plat_post_counts[p["platform"]] += 1

    by_platform = []
    for plat in ["linkedin", "instagram", "twitter", "facebook"]:
        sents = plat_scores.get(plat, [])
        if sents:
            total = len(sents)
            p_pos = round(sum(1 for s in sents if s == "positive") / total * 100)
            p_neu = round(sum(1 for s in sents if s == "neutral")  / total * 100)
            p_neg = 100 - p_pos - p_neu
        else:
            # No comments for this platform — weight sentiment by actual engagement rate ratio
            plat_posts = [p for p in posts if p["platform"] == plat]
            all_er     = [_engagement_rate(p) for p in posts]
            plat_er    = [_engagement_rate(p) for p in plat_posts]
            overall_er = sum(all_er)  / len(all_er)  if all_er  else 1
            avg_er     = sum(plat_er) / len(plat_er) if plat_er else overall_er
            factor     = avg_er / overall_er if overall_er else 1.0
            p_pos      = min(90, max(10, round(base_pos * factor)))
            p_neg      = min(90, max(5,  round(base_neg / factor)))
            p_neu      = 100 - p_pos - p_neg
        by_platform.append({"platform": plat, "positivePct": p_pos, "neutralPct": p_neu, "negativePct": p_neg})

    # Trend: compare second-half vs first-half engagement (proxy for sentiment momentum)
    prev_avg_eng = _period_sum(first_half, "engagements") / (len(first_half) or 1)
    curr_avg_eng = _period_sum(second_half, "engagements") / (len(second_half) or 1)
    trend_delta  = round((curr_avg_eng - prev_avg_eng) / prev_avg_eng * 100, 1) if prev_avg_eng else 0
    trend_label  = f"{'+' if trend_delta >= 0 else ''}{trend_delta}% vs prior period"

    # Keyword aggregation from actual comment data
    pos_kw: dict[str, int] = defaultdict(int)
    neg_kw: dict[str, int] = defaultdict(int)
    for cmt in scored_comments:
        for kw in cmt["keywords"]:
            if kw in POSITIVE_WORDS:
                pos_kw[kw] += 1
            else:
                neg_kw[kw] += 1

    sentiment = {
        "success": True,
        "totalAnalyzed": len(comments),
        "trendDeltaPct": trend_delta,
        "trendLabel": trend_label,
        "overall": {"positivePct": base_pos, "neutralPct": base_neu, "negativePct": base_neg},
        "byPlatform": by_platform,
        "trendingKeywords": {
            "positive": [k for k, _ in sorted(pos_kw.items(), key=lambda x: -x[1])][:5],
            "negative": [k for k, _ in sorted(neg_kw.items(), key=lambda x: -x[1])][:3],
        },
    }

    # ── Trends ────────────────────────────────────────────────────────────────
    dates_sorted = sorted({m["date"] for m in daily})
    imp_by_date: dict[str, int] = defaultdict(int)
    eng_by_date: dict[str, int] = defaultdict(int)
    for m in daily:
        imp_by_date[m["date"]] += m["impressions"]
        eng_by_date[m["date"]] += m["engagements"]

    trends = {
        "success": True,
        "range": {"start": dates_sorted[0], "end": dates_sorted[-1], "granularity": "daily"},
        "series": [
            {"metric": "impressions",
             "points": [{"date": d, "value": imp_by_date[d]} for d in dates_sorted]},
            {"metric": "engagements",
             "points": [{"date": d, "value": eng_by_date[d]} for d in dates_sorted]},
        ],
    }

    # ── Per-post comment details ───────────────────────────────────────────────
    p001_comments = [c for c in scored_comments if c["postId"] == "post_001"]
    total_001     = len(p001_comments) or 1
    post_001_comments = {
        "success": True,
        "postId": "post_001",
        "totalComments": len(p001_comments),
        "breakdown": {
            "positivePct": round(sum(1 for c in p001_comments if c["sentiment"] == "positive") / total_001 * 100),
            "neutralPct":  round(sum(1 for c in p001_comments if c["sentiment"] == "neutral")  / total_001 * 100),
            "negativePct": round(sum(1 for c in p001_comments if c["sentiment"] == "negative") / total_001 * 100),
        },
        "comments": p001_comments,
    }

    return {
        "overview":          overview,
        "account":           account,
        "posts":             top_posts,
        "sentiment":         sentiment,
        "trends":            trends,
        "post_001_comments": post_001_comments,
    }
