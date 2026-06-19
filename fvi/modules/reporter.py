"""Module 7 — Reporter.

Assembles the daily markdown report from every analysis stage, writes it to
``data/reports/YYYY-MM-DD_report.md``, renders a basic HTML version, and opens
it in the default web browser.
"""

from __future__ import annotations

import logging
import webbrowser
from pathlib import Path
from typing import Any

import config
from modules import utils

logger = logging.getLogger(__name__)

try:  # pragma: no cover - import guard
    import markdown as _markdown
except ImportError:  # pragma: no cover
    _markdown = None  # type: ignore[assignment]


def _section_top_posts(outliers: list[dict[str, Any]]) -> list[str]:
    lines = ["## 🏆 Top Winning Posts", ""]
    if not outliers:
        lines.append("_No outlier posts detected today._")
        return lines
    for i, post in enumerate(outliers[:5], start=1):
        lines.append(
            f"{i}. **{post.get('account', '?')}** ({post.get('platform', '?')}) — "
            f"score `{post.get('outlier_score', 0)}x` · "
            f"[view post]({post.get('url', '')})"
        )
    return lines


def _section_top_hooks(hook_records: list[dict[str, Any]]) -> list[str]:
    lines = ["## 🎣 Top Hooks", ""]
    if not hook_records:
        lines.append("_No hooks extracted today._")
        return lines
    for record in hook_records[:5]:
        hook = record.get("hook", "").strip()
        if hook:
            lines.append(f"- \"{hook}\" — _{record.get('account', '?')}_")
    return lines


def _section_hook_templates(hook_records: list[dict[str, Any]]) -> list[str]:
    lines = ["## 📋 Hook Templates", ""]
    seen: set[str] = set()
    for record in hook_records:
        analysis = record.get("analysis") or {}
        template = (analysis.get("reusable_template") or "").strip()
        if template and template not in seen:
            seen.add(template)
            category = analysis.get("hook_category", "general")
            lines.append(f"- `{template}` _({category})_")
        if len(seen) >= 5:
            break
    if not seen:
        lines.append("_No templates available._")
    return lines


def _section_emerging_trends(trends: dict[str, Any]) -> list[str]:
    lines = ["## 📈 Emerging Trends", ""]
    rising = trends.get("rising") or []
    if not rising:
        lines.append("_No rising keywords vs. yesterday (or no prior data)._")
        return lines
    for item in rising[:10]:
        lines.append(
            f"- **{item['keyword']}** — {item['yesterday']} → {item['today']} "
            f"(_{item['status']}_)"
        )
    return lines


def _section_trending_topics(trends: dict[str, Any]) -> list[str]:
    lines = ["## 🔥 Trending Topics", ""]
    top = trends.get("top_keywords") or []
    if not top:
        lines.append("_No keywords found._")
        return lines
    for word, count in top[:10]:
        lines.append(f"- {word} (`{count}`)")
    return lines


def _section_leaderboard(board: list[dict[str, Any]]) -> list[str]:
    lines = ["## 👑 Competitor Leaderboard", "", "| Rank | Account | Platform | Avg Engagement | Posts |", "| --- | --- | --- | --- | --- |"]
    if not board:
        lines.append("| — | _no data_ | — | — | — |")
        return lines
    for i, row in enumerate(board, start=1):
        lines.append(
            f"| {i} | {row['account']} | {row['platform']} | "
            f"{row['avg_engagement']:.0f} | {row['post_count']} |"
        )
    return lines


def _section_carousels(carousels: dict[str, Any]) -> list[str]:
    lines = ["## 🎠 Best Carousel Structures", ""]
    templates = carousels.get("templates") or []
    if not templates:
        lines.append("_No carousel data available._")
        return lines
    for tmpl in templates:
        lines.append(f"### {tmpl['name']}")
        for step in tmpl.get("structure", []):
            lines.append(f"- {step}")
        lines.append("")
    return lines


def _format_ideas(title: str, ideas: list[dict[str, Any]]) -> list[str]:
    lines = [f"## {title}", ""]
    if not ideas:
        lines.append("_No ideas generated._")
        return lines
    for i, idea in enumerate(ideas[:10], start=1):
        lines.append(f"**{i}. {idea.get('title', 'Untitled')}**")
        lines.append("")
        lines.append(f"- **Hook:** {idea.get('hook', '')}")
        lines.append(f"- **Format:** {idea.get('format', '')}")
        lines.append(f"- **Why it works:** {idea.get('why_it_will_work', '')}")
        lines.append("")
    return lines


def _section_recommended(ideas: dict[str, Any]) -> list[str]:
    lines = ["## ⭐ Recommended Post For Today", ""]
    # Pick the first reel idea as the headline recommendation.
    pool = (ideas.get("reels") or []) + (ideas.get("tiktoks") or []) + (
        ideas.get("carousels") or []
    )
    if not pool:
        lines.append("_No recommendation available._")
        return lines
    best = pool[0]
    lines.extend(
        [
            f"### {best.get('title', 'Untitled')}",
            "",
            f"- **Hook:** {best.get('hook', '')}",
            f"- **Format:** {best.get('format', '')}",
            f"- **Why it will work:** {best.get('why_it_will_work', '')}",
            "",
            "> Brief: Film this as your priority post today. Lead with the hook in "
            "the first 2 seconds, keep cuts tight, and end with a clear CTA.",
        ]
    )
    return lines


def build_markdown(
    day: str,
    outliers: list[dict[str, Any]],
    hook_records: list[dict[str, Any]],
    trends: dict[str, Any],
    leaderboard_rows: list[dict[str, Any]],
    carousels: dict[str, Any],
    ideas: dict[str, Any],
) -> str:
    """Assemble the full markdown report as a string."""
    parts: list[str] = [f"# FITNESS VIRAL REPORT — {day}", ""]
    parts += _section_top_posts(outliers) + [""]
    parts += _section_top_hooks(hook_records) + [""]
    parts += _section_hook_templates(hook_records) + [""]
    parts += _section_emerging_trends(trends) + [""]
    parts += _section_trending_topics(trends) + [""]
    parts += _section_leaderboard(leaderboard_rows) + [""]
    parts += _section_carousels(carousels) + [""]
    parts += _format_ideas("🎬 10 Reel Ideas", ideas.get("reels", [])) + [""]
    parts += _format_ideas("📱 10 TikTok Ideas", ideas.get("tiktoks", [])) + [""]
    parts += _format_ideas("🎠 10 Carousel Ideas", ideas.get("carousels", [])) + [""]
    parts += _section_recommended(ideas) + [""]
    return "\n".join(parts)


def _render_html(markdown_text: str, day: str) -> str:
    """Convert markdown to a basic standalone HTML document."""
    if _markdown is not None:
        body = _markdown.markdown(markdown_text, extensions=["tables", "fenced_code"])
    else:
        logger.warning("markdown package not installed; using <pre> fallback")
        body = f"<pre>{markdown_text}</pre>"
    return (
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        f"<title>Fitness Viral Report — {day}</title>"
        "<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;"
        "max-width:840px;margin:40px auto;padding:0 20px;line-height:1.6;"
        "color:#1a1a1a}h1{border-bottom:3px solid #ff4757;padding-bottom:8px}"
        "h2{margin-top:32px;border-bottom:1px solid #eee;padding-bottom:4px}"
        "table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;"
        "padding:6px 10px;text-align:left}code{background:#f4f4f4;padding:2px 5px;"
        "border-radius:4px}blockquote{border-left:4px solid #ff4757;margin:0;"
        "padding-left:16px;color:#555}</style></head>"
        f"<body>{body}</body></html>"
    )


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
    """Build, persist, and (optionally) open the daily markdown report."""
    markdown_text = build_markdown(
        day, outliers, hook_records, trends, leaderboard_rows, carousels, ideas
    )

    md_path = config.REPORTS_DIR / f"{day}_report.md"
    html_path = config.REPORTS_DIR / f"{day}_report.html"

    try:
        md_path.write_text(markdown_text, encoding="utf-8")
        logger.info("Wrote markdown report to %s", md_path)
    except OSError as exc:
        logger.error("Failed to write markdown report: %s", exc)
        return md_path

    try:
        html_path.write_text(_render_html(markdown_text, day), encoding="utf-8")
        logger.info("Wrote HTML report to %s", html_path)
    except OSError as exc:
        logger.error("Failed to write HTML report: %s", exc)
        html_path = None  # type: ignore[assignment]

    if open_browser and html_path is not None:
        try:
            webbrowser.open(html_path.resolve().as_uri())
            logger.info("Opened report in default browser")
        except Exception as exc:  # noqa: BLE001
            logger.error("Could not open report in browser: %s", exc)

    return md_path
