"""
Orkyst Analytics Dashboard — Streamlit
All insights and recommendations are Gemini-generated from Neo4j graph retrieval.
Run: streamlit run dashboard/app.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import plotly.graph_objects as go
import streamlit as st

from pipeline.retriever import fetch_graph_context, list_users
from pipeline.user_config import LOCAL_TEST_USER_ID
from pipeline.llm_analyst import (
    analyze_overview,
    analyze_account,
    analyze_sentiment,
    analyze_trends,
    generate_recommendations,
)
from pipeline.processor import process  # for chart/KPI numbers

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Orkyst Analytics",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

  /* ── Palette ──
     bg-0 (app):    #0e1117   deepest dark
     bg-1 (card):   #161b27   card surface
     bg-2 (inner):  #1e2436   inset rows / nested cards
     border:        #2d3550   clearly visible border
     text-primary:  #edf0f7   near-white
     text-secondary:#b0b9d4   readable mid-gray
     text-muted:    #6e789a   for placeholders only
     accent-purple: #7b6fff   brighter purple
     accent-teal:   #2ee8d0   punchy teal
     green:         #1de9b6   success / positive
     red:           #ff5c5c   danger / negative
     amber:         #ffc840   warning / medium
  */

  .stApp { background: #0e1117; color: #edf0f7; }

  /* Tabs */
  .stTabs [data-baseweb="tab-list"] {
    gap: 4px; background: #161b27; border-radius: 12px;
    padding: 4px; border: 1px solid #2d3550;
  }
  .stTabs [data-baseweb="tab"] {
    border-radius: 8px; padding: 8px 22px;
    color: #b0b9d4; font-weight: 500; font-size: 14px;
  }
  .stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #7b6fff, #2ee8d0) !important;
    color: #fff !important; font-weight: 700;
  }

  /* KPI cards */
  .kpi-card {
    background: #161b27; border: 1px solid #2d3550;
    border-radius: 14px; padding: 22px 24px;
    position: relative; overflow: hidden;
  }
  .kpi-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #7b6fff, #2ee8d0);
    border-radius: 14px 14px 0 0;
  }
  .kpi-label {
    font-size: 11px; font-weight: 700; color: #b0b9d4;
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
  }
  .kpi-value { font-size: 34px; font-weight: 700; color: #edf0f7; line-height: 1; }
  .kpi-delta { font-size: 12px; font-weight: 600; color: #2ee8d0; margin-top: 8px; }

  /* Section cards */
  .section-card {
    background: #161b27; border: 1px solid #2d3550;
    border-radius: 14px; padding: 24px; margin-bottom: 16px;
  }
  .section-title {
    font-size: 15px; font-weight: 700; color: #edf0f7;
    margin-bottom: 16px; letter-spacing: 0.2px;
  }

  /* AI insight box */
  .ai-insight {
    background: #1a1f35;
    border: 1px solid #7b6fff88; border-radius: 12px;
    padding: 16px 20px; margin-bottom: 16px;
  }
  .ai-label {
    font-size: 10px; font-weight: 800; color: #9d95ff;
    text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;
  }
  .ai-text { font-size: 13.5px; color: #d4d9ec; line-height: 1.65; }

  /* Recommendation cards */
  .rec-card {
    background: #1e2436; border: 1px solid #2d3550;
    border-radius: 12px; padding: 20px 22px; margin-bottom: 12px;
  }
  .rec-title  { font-size: 15px; font-weight: 700; color: #edf0f7; margin-bottom: 6px; }
  .rec-desc   { font-size: 13px; color: #b0b9d4; margin-bottom: 12px; line-height: 1.6; }
  .rec-metric { font-size: 13px; font-weight: 700; color: #2ee8d0; }

  .badge-high   { background: #3d1818; color: #ff7070; border: 1px solid #ff5c5c88; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 800; }
  .badge-medium { background: #2e2510; color: #ffd060; border: 1px solid #ffc84088; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 800; }
  .badge-low    { background: #0e2b1e; color: #1de9b6; border: 1px solid #1de9b688; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 800; }

  /* Uplift banner */
  .uplift-banner {
    background: linear-gradient(135deg, #1c1b40, #0e2530);
    border: 1px solid #7b6fff66; border-radius: 14px;
    padding: 24px 32px; margin-bottom: 20px;
  }
  .uplift-val { font-size: 30px; font-weight: 800; color: #2ee8d0; }
  .uplift-lbl { font-size: 11px; font-weight: 600; color: #b0b9d4; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }

  /* Keyword pills */
  .pill-pos {
    display:inline-block; background:#0e2b1e; color:#1de9b6;
    border:1px solid #1de9b677; border-radius:20px;
    padding:4px 14px; margin:4px; font-size:12px; font-weight:600;
  }
  .pill-neg {
    display:inline-block; background:#3d1818; color:#ff7070;
    border:1px solid #ff5c5c77; border-radius:20px;
    padding:4px 14px; margin:4px; font-size:12px; font-weight:600;
  }

  /* Account card */
  .acct-card {
    background: linear-gradient(135deg, #181d33, #101e30);
    border: 1px solid #7b6fff55; border-radius: 14px;
    padding: 24px 28px; margin-bottom: 20px;
  }

  /* Post rows */
  .post-row {
    background: #1e2436; border: 1px solid #2d3550;
    border-radius: 10px; padding: 14px 18px; margin-bottom: 8px;
  }
  .er-high { color: #1de9b6; font-weight: 700; }
  .er-mid  { color: #ffc840; font-weight: 700; }
  .er-low  { color: #ff5c5c; font-weight: 700; }

  /* Momentum chip */
  .momentum-chip {
    display:inline-block; border-radius:20px; padding:4px 14px;
    font-size:12px; font-weight:700; margin-left:10px;
  }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #161b27; }
  ::-webkit-scrollbar-thumb { background: #2d3550; border-radius: 3px; }
</style>
""", unsafe_allow_html=True)

PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter", color="#b0b9d4"),
    margin=dict(l=0, r=0, t=30, b=0),
)
PLATFORM_COLORS = {
    "linkedin":  "#2D9CDB", "LinkedIn":  "#2D9CDB",
    "instagram": "#F2618A", "Instagram": "#F2618A",
    "twitter":   "#4FC3F7", "Twitter":   "#4FC3F7",
    "facebook":  "#7986CB", "Facebook":  "#7986CB",
}


# ── User selector (sidebar) ───────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        "<div style='font-size:13px;font-weight:700;color:#edf0f7;"
        "margin-bottom:8px;'>User</div>",
        unsafe_allow_html=True,
    )

    @st.cache_data(show_spinner=False, ttl=30)
    def _available_users() -> list[str]:
        users = list_users()
        return users if users else [LOCAL_TEST_USER_ID]

    available = _available_users()

    # Default to LOCAL_TEST_USER_ID when running locally
    default_idx = (
        available.index(LOCAL_TEST_USER_ID)
        if LOCAL_TEST_USER_ID in available
        else 0
    )
    selected_user = st.selectbox(
        "Select user",
        options=available,
        index=default_idx,
        label_visibility="collapsed",
    )

    st.markdown(
        f"<div style='font-size:11px;color:#b0b9d4;margin-top:4px;'>"
        f"{'🟢 local bypass' if selected_user == LOCAL_TEST_USER_ID else '👤 ' + selected_user}"
        f"</div>",
        unsafe_allow_html=True,
    )
    st.divider()
    st.markdown(
        "<div style='font-size:11px;color:#6e789a;'>"
        "Data is scoped per user.<br>"
        "Run the pipeline with <code>--user-id</code> to add more users."
        "</div>",
        unsafe_allow_html=True,
    )


# ── Data loading — cached so LLM calls only fire once per session ─────────────
@st.cache_data(show_spinner=False)
def load_graph(uid: str):
    return fetch_graph_context(user_id=uid)

@st.cache_data(show_spinner=False)
def load_computed(uid: str):
    # In production: query would be filtered by uid to pull that user's raw data
    return process(ROOT / "dummy_input_data.json")

@st.cache_data(show_spinner=False)
def load_overview_ai(_graph, uid: str):
    return analyze_overview(_graph)

@st.cache_data(show_spinner=False)
def load_account_ai(_graph, uid: str):
    return analyze_account(_graph)

@st.cache_data(show_spinner=False)
def load_sentiment_ai(_graph, uid: str):
    return analyze_sentiment(_graph)

@st.cache_data(show_spinner=False)
def load_trends_ai(_graph, uid: str):
    return analyze_trends(_graph)

@st.cache_data(show_spinner=False)
def load_recommendations_ai(_graph, uid: str):
    return generate_recommendations(_graph)


# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("""
<div style="padding:16px 0 24px 0;">
  <h1 style="font-size:28px;font-weight:700;color:#edf0f7;margin:0;">
    Orkyst <span style="background:linear-gradient(135deg,#7b6fff,#2ee8d0);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;">Analytics</span>
  </h1>
  <p style="color:#b0b9d4;font-size:14px;margin:6px 0 0 0;">
    All insights generated by Gemini from live Neo4j graph · Last 30 days · All platforms
  </p>
</div>
""", unsafe_allow_html=True)

# Load everything up front with one spinner
with st.spinner(f"Loading data for **{selected_user}** and generating AI insights..."):
    graph    = load_graph(selected_user)
    computed = load_computed(selected_user)
    ov_ai    = load_overview_ai(graph, selected_user)
    ac_ai    = load_account_ai(graph, selected_user)
    se_ai    = load_sentiment_ai(graph, selected_user)
    tr_ai    = load_trends_ai(graph, selected_user)
    rec_ai   = load_recommendations_ai(graph, selected_user)

tab_overview, tab_trends, tab_sentiment, tab_recommendations = st.tabs([
    "Overview", "Account & Trends", "Sentiment", "AI Recommendations"
])


# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — OVERVIEW
# ══════════════════════════════════════════════════════════════════════════════
with tab_overview:
    ov   = computed["overview"]
    cta  = ov["ctaPerformance"]

    def kpi(col, label, value, delta):
        col.markdown(f"""
        <div class="kpi-card">
          <div class="kpi-label">{label}</div>
          <div class="kpi-value">{value}</div>
          <div class="kpi-delta">{delta}</div>
        </div>""", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    kpi(c1, "Total Link Clicks",
        f"{cta['totalLinkClicks']['value']:,}", cta['totalLinkClicks']['deltaLabel'])
    kpi(c2, "Site Visits",
        f"{cta['siteVisits']['value']:,}", cta['siteVisits']['deltaLabel'])
    kpi(c3, "New Audience",
        f"{cta['newAudience']['value']:,}", cta['newAudience']['deltaLabel'])
    kpi(c4, "Avg CTR",
        f"{cta['avgCtr']['value']:.1%}", cta['avgCtr']['deltaLabel'])

    st.markdown("<br>", unsafe_allow_html=True)

    # AI Insight box
    st.markdown(f"""
    <div class="ai-insight">
      <div class="ai-label">Gemini Insight</div>
      <div class="ai-text">{ov_ai.get('insight', '')}</div>
    </div>""", unsafe_allow_html=True)

    col_left, col_right = st.columns([3, 2])

    with col_left:
        st.markdown('<div class="section-card"><div class="section-title">Clicks by Content Type</div>', unsafe_allow_html=True)
        ct_data = ov["clicksByContentType"]
        labels  = [c["label"]  for c in ct_data]
        clicks  = [c["clicks"] for c in ct_data]
        fig_bar = go.Figure(go.Bar(
            x=clicks, y=labels, orientation="h",
            marker=dict(
                color=clicks,
                colorscale=[[0, "#7b6fff"], [1, "#2ee8d0"]],
                line=dict(width=0),
            ),
            text=[f"{v:,}" for v in clicks],
            textposition="outside",
        ))
        fig_bar.update_layout(
            **PLOTLY_LAYOUT, height=260, showlegend=False,
            coloraxis_showscale=False,
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False, title=""),
            yaxis=dict(showgrid=False, title="", tickfont=dict(color="#edf0f7", size=13)),
        )
        st.plotly_chart(fig_bar, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col_right:
        st.markdown('<div class="section-card"><div class="section-title">Platform Distribution</div>', unsafe_allow_html=True)
        pd_data = ov["platformDistribution"]
        colors  = [PLATFORM_COLORS.get(p["platform"], "#7b6fff") for p in pd_data]
        fig_donut = go.Figure(go.Pie(
            labels=[p["label"] for p in pd_data],
            values=[p["sharePct"] for p in pd_data],
            hole=0.62,
            marker=dict(colors=colors, line=dict(color="#0e1117", width=3)),
            textinfo="label+percent",
            textfont=dict(color="#edf0f7", size=12),
        ))
        fig_donut.update_layout(**PLOTLY_LAYOUT, height=260, showlegend=False)
        st.plotly_chart(fig_donut, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — ACCOUNT & TRENDS
# ══════════════════════════════════════════════════════════════════════════════
with tab_trends:
    acct_data = computed["account"]
    acct      = acct_data["account"]
    summary   = acct_data["summary"]

    # Account card with AI narrative
    st.markdown(f"""
    <div class="acct-card">
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="width:52px;height:52px;border-radius:50%;
                    background:linear-gradient(135deg,#7b6fff,#2ee8d0);
                    display:flex;align-items:center;justify-content:center;font-size:22px;">🔗</div>
        <div>
          <div style="font-size:20px;font-weight:700;color:#edf0f7;">{acct['displayName']}</div>
          <div style="font-size:13px;color:#b0b9d4;">{acct['handle']} · {acct['platform'].capitalize()}</div>
        </div>
      </div>
      <div style="display:flex;gap:32px;margin-top:18px;flex-wrap:wrap;">
        <div><div style="font-size:22px;font-weight:700;color:#edf0f7;">{acct['followers']:,}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Followers</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#2ee8d0;">+{acct['followersDelta']:,}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Follower Growth</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#edf0f7;">{summary['impressions']:,}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Impressions</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#edf0f7;">{summary['engagements']:,}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Engagements</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#9d95ff;">{summary['engagementRate']:.2%}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Engagement Rate</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#edf0f7;">{summary['posts']}</div>
             <div style="font-size:11px;color:#b0b9d4;text-transform:uppercase;">Posts</div></div>
      </div>
    </div>""", unsafe_allow_html=True)

    # AI account insight
    highlight = ac_ai.get("highlight", "")
    narrative = ac_ai.get("narrative", "")
    st.markdown(f"""
    <div class="ai-insight">
      <div class="ai-label">Gemini Account Analysis</div>
      <div class="ai-text">{narrative}</div>
      {f'<div style="margin-top:8px;font-size:12px;color:#9d95ff;font-weight:700;">★ {highlight}</div>' if highlight else ''}
    </div>""", unsafe_allow_html=True)

    # Engagement trend chart with AI momentum label
    trend_series = {s["metric"]: s["points"] for s in computed["trends"]["series"]}
    imp_pts = trend_series.get("impressions", [])
    eng_pts = trend_series.get("engagements", [])
    dates   = [p["date"] for p in imp_pts]

    momentum     = tr_ai.get("momentum", "Steady")
    momentum_color = {"Accelerating": "#1de9b6", "Steady": "#9d95ff",
                      "Declining": "#ff5c5c", "Volatile": "#ffc840"}.get(momentum, "#9d95ff")

    st.markdown(
        f'<div class="section-card"><div class="section-title">Engagement Trend '
        f'<span class="momentum-chip" style="background:{momentum_color}22;color:{momentum_color};'
        f'border:1px solid {momentum_color}44;">{momentum}</span></div>',
        unsafe_allow_html=True,
    )
    fig_trend = go.Figure()
    fig_trend.add_trace(go.Scatter(
        x=dates, y=[p["value"] for p in imp_pts], name="Impressions",
        line=dict(color="#7b6fff", width=2.5),
        fill="tozeroy", fillcolor="rgba(123,111,255,0.12)",
        hovertemplate="%{x}<br>Impressions: %{y:,}<extra></extra>",
    ))
    fig_trend.add_trace(go.Scatter(
        x=dates, y=[p["value"] for p in eng_pts], name="Engagements",
        line=dict(color="#2ee8d0", width=2.5), yaxis="y2",
        hovertemplate="%{x}<br>Engagements: %{y:,}<extra></extra>",
    ))
    fig_trend.update_layout(
        **PLOTLY_LAYOUT, height=300,
        legend=dict(orientation="h", y=1.12, x=0, font=dict(color="#edf0f7")),
        xaxis=dict(showgrid=False, tickfont=dict(color="#b0b9d4")),
        yaxis=dict(showgrid=True, gridcolor="#232940", tickfont=dict(color="#b0b9d4"), title="Impressions"),
        yaxis2=dict(showgrid=False, overlaying="y", side="right",
                    tickfont=dict(color="#2ee8d0"), title="Engagements"),
        hovermode="x unified",
    )
    st.plotly_chart(fig_trend, use_container_width=True)

    # AI trend summary
    tr_summary = tr_ai.get("summary", "")
    if tr_summary:
        st.markdown(f"""
        <div style="background:#1e2436;border-radius:8px;padding:14px 18px;
                    font-size:13px;color:#b0b9d4;line-height:1.65;border:1px solid #2d3550;">{tr_summary}</div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    # Top posts table
    st.markdown('<div class="section-card"><div class="section-title">Top Performing Posts</div>', unsafe_allow_html=True)
    for post in computed["posts"]["posts"]:
        er = post["engagementRate"]
        er_class   = "er-high" if er >= 0.10 else ("er-mid" if er >= 0.04 else "er-low")
        plat_color = PLATFORM_COLORS.get(post["platform"], "#7b6fff")
        st.markdown(f"""
        <div class="post-row">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:14px;font-weight:600;color:#edf0f7;">{post['title']}</div>
              <div style="font-size:12px;color:#b0b9d4;margin-top:4px;">
                <span style="color:{plat_color};font-weight:600;">● {post['platform'].capitalize()}</span>
                &nbsp;·&nbsp;{post['contentTypeLabel']}&nbsp;·&nbsp;{post['publishedAt'][:10]}
              </div>
            </div>
            <div style="text-align:right;min-width:200px;">
              <div style="font-size:13px;color:#b0b9d4;">
                {post['impressionsLabel']} impr &nbsp;·&nbsp; {post['engagementsLabel']} eng
              </div>
              <div style="font-size:20px;" class="{er_class}">{post['engagementRateLabel']}</div>
            </div>
          </div>
        </div>""", unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — SENTIMENT
# ══════════════════════════════════════════════════════════════════════════════
with tab_sentiment:
    sent    = computed["sentiment"]
    overall = sent["overall"]

    # AI sentiment insight
    st.markdown(f"""
    <div class="ai-insight">
      <div class="ai-label">Gemini Sentiment Analysis</div>
      <div class="ai-text">{se_ai.get('summary', '')}</div>
    </div>""", unsafe_allow_html=True)

    col_donut, col_platform = st.columns([2, 3])

    with col_donut:
        trend_label     = se_ai.get("trend_label", "+0%")
        trend_delta_pct = se_ai.get("trend_delta_pct", 0)
        trend_color     = "#1de9b6" if trend_delta_pct >= 0 else "#ff5c5c"

        st.markdown('<div class="section-card"><div class="section-title">Overall Sentiment</div>', unsafe_allow_html=True)
        fig_sent = go.Figure(go.Pie(
            labels=["Positive", "Neutral", "Negative"],
            values=[overall["positivePct"], overall["neutralPct"], overall["negativePct"]],
            hole=0.62,
            marker=dict(colors=["#1de9b6", "#7b6fff", "#ff5c5c"],
                        line=dict(color="#0e1117", width=3)),
            textinfo="label+percent",
            textfont=dict(color="#edf0f7", size=12),
        ))
        fig_sent.update_layout(**PLOTLY_LAYOUT, height=280, showlegend=False)
        st.plotly_chart(fig_sent, use_container_width=True)
        st.markdown(
            f'<div style="font-size:13px;font-weight:600;color:{trend_color};'
            f'text-align:center;margin-top:-8px;">{trend_label}</div>',
            unsafe_allow_html=True,
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col_platform:
        st.markdown('<div class="section-card"><div class="section-title">Sentiment by Platform</div>', unsafe_allow_html=True)
        bp        = sent["byPlatform"]
        platforms = [p["platform"].capitalize() for p in bp]
        fig_stack = go.Figure()
        fig_stack.add_trace(go.Bar(name="Positive", x=platforms,
                                   y=[p["positivePct"] for p in bp], marker_color="#1de9b6"))
        fig_stack.add_trace(go.Bar(name="Neutral", x=platforms,
                                   y=[p["neutralPct"]  for p in bp], marker_color="#7b6fff"))
        fig_stack.add_trace(go.Bar(name="Negative", x=platforms,
                                   y=[p["negativePct"] for p in bp], marker_color="#ff5c5c"))
        fig_stack.update_layout(
            **PLOTLY_LAYOUT, barmode="stack", height=280,
            legend=dict(orientation="h", y=1.12, x=0, font=dict(color="#edf0f7")),
            xaxis=dict(showgrid=False, tickfont=dict(color="#edf0f7")),
            yaxis=dict(showgrid=True, gridcolor="#232940",
                       tickfont=dict(color="#b0b9d4"), ticksuffix="%"),
        )
        st.plotly_chart(fig_stack, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # Trending keywords
    st.markdown('<div class="section-card"><div class="section-title">Trending Keywords</div>', unsafe_allow_html=True)
    kw       = sent["trendingKeywords"]
    pos_pills = "".join(f'<span class="pill-pos">✓ {k}</span>' for k in kw.get("positive", []))
    neg_pills = "".join(f'<span class="pill-neg">✗ {k}</span>' for k in kw.get("negative", []))
    st.markdown(f'<div>{pos_pills}{neg_pills}</div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    # Per-post comment explorer
    post_comments = computed.get("post_001_comments", {})
    if post_comments:
        st.markdown('<div class="section-card"><div class="section-title">Post Comment Explorer</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div style="font-size:13px;color:#b0b9d4;margin-bottom:12px;">'
            f'Post: "5 Marketing Trends for 2026" · {post_comments["totalComments"]} comments</div>',
            unsafe_allow_html=True,
        )
        for cmt in post_comments.get("comments", []):
            score = cmt["sentimentScore"]
            color = "#1de9b6" if cmt["sentiment"] == "positive" else (
                    "#ff5c5c" if cmt["sentiment"] == "negative" else "#9d95ff")
            bar_w = int(abs(score) * 100)
            st.markdown(f"""
            <div style="background:#1e2436;border:1px solid #2d3550;border-radius:10px;
                        padding:12px 16px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:13px;font-weight:600;color:#edf0f7;">{cmt['author']}</div>
                <div style="font-size:11px;padding:2px 8px;border-radius:6px;
                            background:{color}22;color:{color};font-weight:600;">
                  {cmt['sentiment'].upper()}
                </div>
              </div>
              <div style="font-size:13px;color:#d4d9ec;margin:6px 0;">"{cmt['body']}"</div>
              <div style="background:#0e1117;border-radius:4px;height:4px;width:100%;margin-top:6px;">
                <div style="background:{color};border-radius:4px;height:4px;width:{bar_w}%;"></div>
              </div>
              <div style="font-size:11px;color:#b0b9d4;margin-top:4px;">Score: {score:+.2f}</div>
            </div>""", unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — AI RECOMMENDATIONS (100% Gemini-generated)
# ══════════════════════════════════════════════════════════════════════════════
with tab_recommendations:
    best_day    = rec_ai.get("bestDay", "—")
    best_time   = rec_ai.get("bestTime", "—")
    top_plat    = rec_ai.get("topPlatform", "—")
    uplift_pct  = rec_ai.get("projectedUpliftPct", "—")
    rec_insight = rec_ai.get("insight", "")
    recs        = rec_ai.get("recommendations", [])

    # Uplift banner
    st.markdown(f"""
    <div class="uplift-banner">
      <div style="display:flex;gap:40px;align-items:center;flex-wrap:wrap;">
        <div style="text-align:center;">
          <div class="uplift-val">+{uplift_pct}%</div>
          <div class="uplift-lbl">Projected Uplift</div>
        </div>
        <div style="width:1px;background:#2d3550;height:48px;"></div>
        <div style="text-align:center;">
          <div class="uplift-val" style="font-size:22px;">{best_day}</div>
          <div class="uplift-lbl">Best Day</div>
        </div>
        <div style="text-align:center;">
          <div class="uplift-val" style="font-size:22px;">{best_time}</div>
          <div class="uplift-lbl">Best Time</div>
        </div>
        <div style="text-align:center;">
          <div class="uplift-val" style="font-size:22px;">{top_plat}</div>
          <div class="uplift-lbl">Top Platform</div>
        </div>
      </div>
    </div>""", unsafe_allow_html=True)

    # AI strategic insight
    if rec_insight:
        st.markdown(f"""
        <div class="ai-insight">
          <div class="ai-label">Gemini Strategic Insight</div>
          <div class="ai-text">{rec_insight}</div>
        </div>""", unsafe_allow_html=True)

    # Recommendation cards — sorted high → medium → low
    impact_order = {"high": 0, "medium": 1, "low": 2}
    sorted_recs  = sorted(recs, key=lambda r: impact_order.get(r.get("impact", "low"), 2))

    for rec in sorted_recs:
        impact   = rec.get("impact", "medium")
        cat      = rec.get("category", "").replace("_", " ").title()
        st.markdown(f"""
        <div class="rec-card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div class="rec-title">{rec.get('title','')}</div>
            <span class="badge-{impact}">{impact.upper()}</span>
            <span style="font-size:11px;color:#b0b9d4;margin-left:4px;font-weight:500;">#{cat}</span>
          </div>
          <div class="rec-desc">{rec.get('description','')}</div>
          <div class="rec-metric">📈 {rec.get('metricLabel','')}</div>
        </div>""", unsafe_allow_html=True)
