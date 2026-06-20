"""Module 7 — Reporter.

Builds a premium, dark-theme HTML "content intelligence dashboard" from every
analysis stage, writes it to ``data/reports/YYYY-MM-DD_report.html``, and opens
it in the default web browser.

Sections:
  1. Header (logo, date, summary bar)
  2. Top viral posts (ranked cards)
  3. Content briefs (30 ready-to-film ideas with expandable scripts)
  4. Trending topics (rising/declining/stable badges)
  5. Competitor leaderboard
  6. Today's recommended post (highlighted card)
"""

from __future__ import annotations

import html
import logging
import webbrowser
from pathlib import Path
from typing import Any

import config

logger = logging.getLogger(__name__)

ACCENT = "#ff3c3c"

# Known format types → CSS modifier class for badge colouring.
_FORMAT_CLASSES = {
    "talking head": "fmt-talk",
    "carousel": "fmt-carousel",
    "listicle": "fmt-list",
    "transformation": "fmt-transform",
    "tutorial": "fmt-tutorial",
    "reaction": "fmt-reaction",
    "reel": "fmt-talk",
    "tiktok": "fmt-tutorial",
}


def _esc(value: Any) -> str:
    """HTML-escape any value as a string."""
    return html.escape(str(value if value is not None else ""))


def _fmt_int(value: Any) -> str:
    """Format an integer with thousands separators (best-effort)."""
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return "0"


def _format_badge(format_type: str) -> str:
    cls = _FORMAT_CLASSES.get((format_type or "").strip().lower(), "fmt-default")
    return f'<span class="badge fmt {cls}">{_esc(format_type or "Reel")}</span>'


def _platform_badge(platform: str) -> str:
    platform = (platform or "").lower()
    if platform == "instagram":
        return '<span class="badge platform ig">Instagram</span>'
    if platform == "tiktok":
        return '<span class="badge platform tt">TikTok</span>'
    return f'<span class="badge platform">{_esc(platform or "social")}</span>'


# ---------------------------------------------------------------------------
# Section 2 — Top viral posts
# ---------------------------------------------------------------------------
def _first_line(caption: str) -> str:
    for line in (caption or "").splitlines():
        if line.strip():
            return line.strip()
    return (caption or "").strip()


def _post_card(rank: int, post: dict[str, Any], analysis: dict[str, Any] | None) -> str:
    analysis = analysis or {}
    handle = post.get("account", "?")
    hook = analysis.get("hook_text") or _first_line(post.get("caption", "")) or "—"
    why = analysis.get("why_it_worked") or (
        "This post far outperformed the account's typical engagement, signalling "
        "a hook and topic combination the audience strongly responded to."
    )
    format_type = analysis.get("format_type") or (
        "Carousel" if post.get("type") == "carousel" else "Talking Head"
    )
    url = post.get("url", "")
    view_btn = (
        f'<a class="btn" href="{_esc(url)}" target="_blank" rel="noopener">View Post →</a>'
        if url else ""
    )

    return f"""
    <article class="card post-card">
      <div class="post-head">
        <span class="rank">#{rank}</span>
        {_platform_badge(post.get("platform", ""))}
        <span class="handle">@{_esc(handle)}</span>
        {_format_badge(format_type)}
      </div>
      <div class="stats">
        <span class="stat">❤️ {_fmt_int(post.get("likes"))}</span>
        <span class="stat">💬 {_fmt_int(post.get("comments"))}</span>
        <span class="stat">👁️ {_fmt_int(post.get("views"))}</span>
        <span class="stat score">🔥 {_esc(post.get("outlier_score", 0))}x</span>
      </div>
      <div class="hook-label">HOOK</div>
      <p class="hook">{_esc(hook)}</p>
      <div class="why">
        <span class="why-label">WHY IT WORKED</span>
        <p>{_esc(why)}</p>
      </div>
      {view_btn}
    </article>
    """


def _top_posts_section(outliers: list[dict[str, Any]], analyses_by_id: dict[str, Any]) -> str:
    if not outliers:
        cards = '<p class="empty">No outlier posts detected today.</p>'
    else:
        cards = "\n".join(
            _post_card(i, post, analyses_by_id.get(str(post.get("id", ""))))
            for i, post in enumerate(outliers[:10], start=1)
        )
    return f"""
    <section id="viral">
      <h2><span class="dot"></span>Top Viral Posts</h2>
      <div class="grid">{cards}</div>
    </section>
    """


# ---------------------------------------------------------------------------
# Section 3 — Content briefs
# ---------------------------------------------------------------------------
def _script_block(script: dict[str, Any]) -> str:
    script = script or {}
    rows = [
        ("Hook (0-3s)", script.get("hook_seconds", "")),
        ("Build (3-20s)", script.get("build_seconds", "")),
        ("Payoff (20-35s)", script.get("payoff_seconds", "")),
        ("CTA (last 3s)", script.get("cta_seconds", "")),
    ]
    items = "\n".join(
        f'<div class="script-row"><span class="script-stage">{_esc(label)}</span>'
        f"<span class=\"script-text\">{_esc(text)}</span></div>"
        for label, text in rows
        if text
    )
    if not items:
        return ""
    return f"""
      <details class="script">
        <summary>📜 Full Script</summary>
        <div class="script-body">{items}</div>
      </details>
    """


def _filming_tips(tips: list[str]) -> str:
    if not tips:
        return ""
    bullets = "\n".join(f"<li>{_esc(t)}</li>" for t in tips[:3])
    return f"""
      <div class="tips">
        <span class="tips-label">🎥 Filming Tips</span>
        <ul>{bullets}</ul>
      </div>
    """


def _brief_card(idea: dict[str, Any]) -> str:
    return f"""
    <article class="card brief-card">
      <div class="brief-head">
        <h3>{_esc(idea.get("title", "Untitled idea"))}</h3>
        {_format_badge(idea.get("format", ""))}
      </div>
      <div class="hook-label">HOOK</div>
      <p class="hook">{_esc(idea.get("hook", ""))}</p>
      <div class="why">
        <span class="why-label">BREAKDOWN</span>
        <p>{_esc(idea.get("breakdown", ""))}</p>
      </div>
      {_script_block(idea.get("script", {}))}
      {_filming_tips(idea.get("filming_tips", []))}
    </article>
    """


def _briefs_subsection(anchor: str, title: str, ideas: list[dict[str, Any]]) -> str:
    if not ideas:
        cards = '<p class="empty">No ideas generated.</p>'
    else:
        cards = "\n".join(_brief_card(idea) for idea in ideas[:10])
    return f"""
      <h3 class="sub" id="{anchor}">{_esc(title)}</h3>
      <div class="grid">{cards}</div>
    """


def _briefs_section(ideas: dict[str, Any]) -> str:
    return f"""
    <section id="briefs">
      <h2><span class="dot"></span>Content Briefs</h2>
      {_briefs_subsection("reels", "🎬 10 Reel Ideas", ideas.get("reels", []))}
      {_briefs_subsection("tiktoks", "📱 10 TikTok Ideas", ideas.get("tiktoks", []))}
      {_briefs_subsection("carousels", "🎠 10 Carousel Ideas", ideas.get("carousels", []))}
    </section>
    """


# ---------------------------------------------------------------------------
# Section 4 — Trending topics
# ---------------------------------------------------------------------------
def _trends_section(trends: dict[str, Any]) -> str:
    classified = trends.get("classified") or []
    if not classified:
        body = '<p class="empty">No keyword trends detected yet.</p>'
    else:
        def badges(status: str, cls: str) -> str:
            items = [c for c in classified if c.get("status") == status]
            if not items:
                return ""
            chips = "".join(
                f'<span class="badge trend {cls}">{_esc(c["keyword"])} '
                f'<small>{c["today"]}</small></span>'
                for c in items[:20]
            )
            label = status.capitalize()
            return f'<div class="trend-group"><span class="trend-head">{label}</span>{chips}</div>'

        body = (
            badges("rising", "rising")
            + badges("declining", "declining")
            + badges("stable", "stable")
        ) or '<p class="empty">No keyword trends detected yet.</p>'
    return f"""
    <section id="trends">
      <h2><span class="dot"></span>Trending Topics</h2>
      {body}
    </section>
    """


# ---------------------------------------------------------------------------
# Section 5 — Competitor leaderboard
# ---------------------------------------------------------------------------
def _leaderboard_section(
    rows: list[dict[str, Any]], top_post_by_account: dict[str, str]
) -> str:
    if not rows:
        body = '<p class="empty">No competitor data available.</p>'
    else:
        trs = []
        for i, row in enumerate(rows, start=1):
            handle = row.get("account", "?")
            url = top_post_by_account.get(handle, "")
            link = (
                f'<a href="{_esc(url)}" target="_blank" rel="noopener">View →</a>'
                if url else "—"
            )
            trs.append(
                f"<tr><td class='rank-cell'>#{i}</td>"
                f"<td>@{_esc(handle)} {_platform_badge(row.get('platform', ''))}</td>"
                f"<td>{_fmt_int(row.get('avg_engagement'))}</td>"
                f"<td>{link}</td></tr>"
            )
        body = (
            "<table class='board'><thead><tr><th>Rank</th><th>Creator</th>"
            "<th>Avg Engagement</th><th>Top Post</th></tr></thead>"
            f"<tbody>{''.join(trs)}</tbody></table>"
        )
    return f"""
    <section id="board">
      <h2><span class="dot"></span>Competitor Leaderboard</h2>
      {body}
    </section>
    """


# ---------------------------------------------------------------------------
# Section 6 — Recommended post
# ---------------------------------------------------------------------------
def _recommended_section(ideas: dict[str, Any]) -> str:
    pool = (
        (ideas.get("reels") or [])
        + (ideas.get("tiktoks") or [])
        + (ideas.get("carousels") or [])
    )
    if not pool:
        return ""
    best = pool[0]
    checklist = best.get("filming_tips") or []
    checklist_html = "\n".join(f"<li>{_esc(t)}</li>" for t in checklist[:3])
    script = best.get("script", {}) or {}
    script_rows = [
        ("Hook (0-3s)", script.get("hook_seconds", "")),
        ("Build (3-20s)", script.get("build_seconds", "")),
        ("Payoff (20-35s)", script.get("payoff_seconds", "")),
        ("CTA (last 3s)", script.get("cta_seconds", "")),
    ]
    script_html = "\n".join(
        f'<div class="script-row"><span class="script-stage">{_esc(label)}</span>'
        f'<span class="script-text">{_esc(text)}</span></div>'
        for label, text in script_rows
        if text
    )
    return f"""
    <section id="recommended">
      <h2><span class="dot"></span>Today's Recommended Post</h2>
      <article class="card recommended">
        <div class="brief-head">
          <h3>⭐ {_esc(best.get("title", "Untitled idea"))}</h3>
          {_format_badge(best.get("format", ""))}
        </div>
        <div class="hook-label">HOOK</div>
        <p class="hook">{_esc(best.get("hook", ""))}</p>
        <div class="why">
          <span class="why-label">WHY THIS ONE</span>
          <p>{_esc(best.get("breakdown", ""))}</p>
        </div>
        <div class="script-body open">{script_html}</div>
        <div class="tips">
          <span class="tips-label">✅ Filming Checklist</span>
          <ul>{checklist_html}</ul>
        </div>
      </article>
    </section>
    """


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------
_CSS = """
:root { --bg:#0f0f0f; --card:#1a1a1a; --accent:#ff3c3c; --muted:#8a8a8a;
        --line:#2a2a2a; --text:#ededed; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text);
       font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif; line-height:1.55; }
.wrap { max-width:1180px; margin:0 auto; padding:0 24px 80px; }
a { color:var(--accent); text-decoration:none; }
header.hero { padding:48px 24px 28px; max-width:1180px; margin:0 auto; }
.logo { font-weight:800; letter-spacing:1px; font-size:28px; }
.logo .spark { color:var(--accent); }
.subtitle { color:var(--muted); margin-top:4px; font-size:15px; }
.summary { display:flex; flex-wrap:wrap; gap:16px; margin-top:24px; }
.summary .metric { background:var(--card); border:1px solid var(--line);
       border-radius:14px; padding:18px 22px; min-width:160px; flex:1; }
.summary .num { font-size:30px; font-weight:800; color:var(--accent); }
.summary .lbl { color:var(--muted); font-size:13px; text-transform:uppercase;
       letter-spacing:.5px; }
section { margin-top:48px; }
h2 { font-size:22px; display:flex; align-items:center; gap:10px; margin-bottom:18px; }
h2 .dot { width:10px; height:10px; border-radius:50%; background:var(--accent);
       display:inline-block; box-shadow:0 0 12px var(--accent); }
h3.sub { color:var(--muted); font-size:16px; margin:28px 0 14px;
       text-transform:uppercase; letter-spacing:.5px; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr));
       gap:18px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:16px;
       padding:20px; transition:border-color .2s,transform .2s; }
.card:hover { border-color:#3a3a3a; transform:translateY(-2px); }
.post-head,.brief-head { display:flex; align-items:center; gap:10px;
       flex-wrap:wrap; margin-bottom:12px; }
.brief-head h3 { margin:0; font-size:17px; flex:1; }
.rank { background:var(--accent); color:#fff; font-weight:800; border-radius:8px;
       padding:2px 10px; font-size:14px; }
.handle { color:var(--text); font-weight:600; }
.badge { font-size:12px; padding:3px 10px; border-radius:999px; font-weight:600;
       border:1px solid var(--line); }
.badge.platform.ig { background:#3a1f33; color:#ff8fc7; border-color:#5a2f4f; }
.badge.platform.tt { background:#10303a; color:#6fe3f0; border-color:#1f5562; }
.badge.fmt { background:#2a2a2a; color:#ddd; }
.fmt-talk { background:#2b1f3a; color:#c6a8ff; }
.fmt-carousel { background:#1f2e3a; color:#8fd0ff; }
.fmt-list { background:#3a3320; color:#f0d98f; }
.fmt-transform { background:#1f3a2b; color:#8fffb0; }
.fmt-tutorial { background:#3a2520; color:#ffb38f; }
.fmt-reaction { background:#3a1f2e; color:#ff8fb8; }
.stats { display:flex; flex-wrap:wrap; gap:14px; color:var(--muted); font-size:14px;
       margin-bottom:14px; }
.stats .score { color:var(--accent); font-weight:700; }
.hook-label,.why-label,.tips-label { font-size:11px; letter-spacing:1px;
       color:var(--muted); text-transform:uppercase; font-weight:700; }
.hook { font-size:19px; font-weight:700; margin:6px 0 14px; line-height:1.35; }
.why { background:#141414; border-left:3px solid var(--accent); border-radius:8px;
       padding:10px 14px; margin-bottom:14px; }
.why p { margin:6px 0 0; color:#cfcfcf; font-size:14px; }
.btn { display:inline-block; background:var(--accent); color:#fff; font-weight:700;
       padding:9px 16px; border-radius:10px; font-size:14px; }
.btn:hover { filter:brightness(1.1); }
details.script { margin:6px 0 14px; border:1px solid var(--line); border-radius:10px;
       overflow:hidden; }
details.script summary { cursor:pointer; padding:10px 14px; font-weight:600;
       background:#141414; list-style:none; }
details.script summary::-webkit-details-marker { display:none; }
.script-body { padding:6px 14px 12px; }
.script-body.open { padding:10px 0 4px; }
.script-row { display:flex; gap:12px; padding:8px 0; border-bottom:1px dashed var(--line); }
.script-row:last-child { border-bottom:none; }
.script-stage { color:var(--accent); font-weight:700; font-size:13px; min-width:120px; }
.script-text { color:#dcdcdc; font-size:14px; }
.tips ul { margin:6px 0 0; padding-left:18px; color:#cfcfcf; font-size:14px; }
.trend-group { margin-bottom:16px; }
.trend-head { display:block; color:var(--muted); font-size:13px; font-weight:700;
       text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
.badge.trend { margin:0 8px 8px 0; display:inline-block; }
.trend.rising { background:#0f2e1c; color:#5dffa0; border-color:#1f5a38; }
.trend.declining { background:#3a1414; color:#ff7b7b; border-color:#5a2020; }
.trend.stable { background:#222; color:#bbb; }
.trend small { opacity:.7; margin-left:4px; }
table.board { width:100%; border-collapse:collapse; background:var(--card);
       border:1px solid var(--line); border-radius:14px; overflow:hidden; }
table.board th,table.board td { padding:12px 16px; text-align:left;
       border-bottom:1px solid var(--line); font-size:14px; }
table.board th { color:var(--muted); text-transform:uppercase; font-size:12px;
       letter-spacing:.5px; }
table.board tr:last-child td { border-bottom:none; }
.rank-cell { color:var(--accent); font-weight:700; }
.recommended { border:2px solid var(--accent); box-shadow:0 0 30px rgba(255,60,60,.15); }
.empty { color:var(--muted); }
footer { text-align:center; color:var(--muted); font-size:13px; margin-top:60px; }
"""


def build_html(
    day: str,
    outliers: list[dict[str, Any]],
    hook_records: list[dict[str, Any]],
    trends: dict[str, Any],
    leaderboard_rows: list[dict[str, Any]],
    carousels: dict[str, Any],
    ideas: dict[str, Any],
) -> str:
    """Assemble the full premium HTML dashboard."""
    analyses_by_id = {
        str(r.get("id", "")): (r.get("analysis") or {}) for r in hook_records
    }

    total_scraped = sum(int(r.get("post_count", 0) or 0) for r in leaderboard_rows)
    outliers_found = len(outliers)
    trending_count = len(trends.get("classified") or [])

    # Best outlier post URL per account for the leaderboard link.
    top_post_by_account: dict[str, str] = {}
    for post in outliers:
        handle = post.get("account", "")
        if handle and handle not in top_post_by_account and post.get("url"):
            top_post_by_account[handle] = post["url"]

    summary = f"""
      <div class="summary">
        <div class="metric"><div class="num">{total_scraped}</div>
          <div class="lbl">Posts Scraped</div></div>
        <div class="metric"><div class="num">{outliers_found}</div>
          <div class="lbl">Outliers Found</div></div>
        <div class="metric"><div class="num">{trending_count}</div>
          <div class="lbl">Trending Topics</div></div>
      </div>
    """

    body = (
        _top_posts_section(outliers, analyses_by_id)
        + _briefs_section(ideas)
        + _trends_section(trends)
        + _leaderboard_section(leaderboard_rows, top_post_by_account)
        + _recommended_section(ideas)
    )

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fitness Viral Intelligence — {_esc(day)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{_CSS}</style></head>
<body>
  <header class="hero">
    <div class="logo">FITNESS VIRAL <span class="spark">INTELLIGENCE</span></div>
    <div class="subtitle">{_esc(day)} · Daily Report</div>
    {summary}
  </header>
  <div class="wrap">
    {body}
    <footer>Generated by fvi · Fitness Viral Intelligence</footer>
  </div>
</body></html>"""


def write_report(
    day: str,
    outliers: list[dict[str, Any]],
    hook_records: list[dict[str, Any]],
    trends: dict[str, Any],
    leaderboard_rows: list[dict[str, Any]],
    carousels: dict[str, Any],
    ideas: dict[str, Any],
    open_browser: bool = True,
) -> Path:
    """Build, persist, and (optionally) open the daily HTML dashboard."""
    html_path = config.REPORTS_DIR / f"{day}_report.html"

    try:
        document = build_html(
            day, outliers, hook_records, trends, leaderboard_rows, carousels, ideas
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to build HTML report: %s", exc)
        return html_path

    try:
        html_path.write_text(document, encoding="utf-8")
        logger.info("Wrote HTML report to %s", html_path)
    except OSError as exc:
        logger.error("Failed to write HTML report: %s", exc)
        return html_path

    if open_browser:
        try:
            webbrowser.open(html_path.resolve().as_uri())
            logger.info("Opened report in default browser")
        except Exception as exc:  # noqa: BLE001
            logger.error("Could not open report in browser: %s", exc)

    return html_path
