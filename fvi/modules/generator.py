"""Module 6 — Content generator.

Builds a single *summarised* context string (never raw posts) from the top
hooks, trends, and carousel structures, then makes ONE AI call to produce
30 ready-to-use content ideas (10 reels, 10 TikToks, 10 carousels).
"""

from __future__ import annotations

import logging
from typing import Any

import config
from modules import ai, utils

logger = logging.getLogger(__name__)

NICHE = "fitness"

SYSTEM_PROMPT = (
    "You are an elite short-form fitness content strategist. Using the provided "
    "intelligence summary, produce fresh content ideas for the user's fitness "
    "niche. Respond with JSON only in this exact shape: "
    '{"reels": [...], "tiktoks": [...], "carousels": [...]}. '
    "Each list must contain exactly 10 idea objects, and each idea object must "
    "have the keys: title, hook, format, why_it_will_work. Do not include any "
    "other keys or commentary."
)


def build_context(
    hook_records: list[dict[str, Any]],
    trends: dict[str, Any],
    carousels: dict[str, Any],
) -> str:
    """Build a compact, token-efficient context string for the AI."""
    top_hooks = [r["hook"] for r in hook_records if r.get("hook")][: config.TOP_POSTS_FOR_AI]

    rising = trends.get("rising") or []
    if rising:
        trending = [t["keyword"] for t in rising[:3]]
    else:
        trending = [kw for kw, _ in trends.get("top_keywords", [])[:3]]

    structures = [t["name"] for t in carousels.get("templates", [])[:3]]

    def _bullets(items: list[str]) -> list[str]:
        return [f"- {i}" for i in items] if items else ["- (none available)"]

    lines = [
        f"My niche: {NICHE}",
        "",
        "Top 5 proven hooks:",
        *_bullets(top_hooks),
        "",
        "Top 3 trending topics:",
        *_bullets(trending),
        "",
        "Top 3 carousel structures:",
        *_bullets(structures),
        "",
        "Generate 10 Reel ideas, 10 TikTok ideas, and 10 Carousel ideas.",
    ]
    return "\n".join(lines)


def _fallback_ideas(context_hooks: list[str]) -> dict[str, list[dict[str, Any]]]:
    """Deterministic ideas used when the AI is unavailable."""
    base = context_hooks or [
        "The mistake killing your gains",
        "3 moves for a stronger core",
        "Why your diet isn't working",
        "Stop doing this exercise wrong",
        "The truth about fat loss",
    ]

    def make(kind: str, fmt: str) -> list[dict[str, Any]]:
        ideas = []
        for i in range(10):
            seed = base[i % len(base)]
            ideas.append(
                {
                    "title": f"{kind} idea #{i + 1}: {seed[:40]}",
                    "hook": seed,
                    "format": fmt,
                    "why_it_will_work": (
                        "Mirrors a proven viral hook pattern and targets a common "
                        "fitness pain point with high emotional resonance."
                    ),
                }
            )
        return ideas

    return {
        "reels": make("Reel", "15-30s talking-head with on-screen text"),
        "tiktoks": make("TikTok", "Fast-cut demo with trending audio"),
        "carousels": make("Carousel", "7-slide swipe with bold title + CTA"),
    }


def _coerce_ideas(payload: Any) -> dict[str, list[dict[str, Any]]] | None:
    """Validate/normalise the AI payload into the expected idea structure."""
    if not isinstance(payload, dict):
        return None
    result: dict[str, list[dict[str, Any]]] = {}
    for key in ("reels", "tiktoks", "carousels"):
        items = payload.get(key)
        if not isinstance(items, list):
            return None
        result[key] = [i for i in items if isinstance(i, dict)]
    return result


def generate_ideas(
    hook_records: list[dict[str, Any]],
    trends: dict[str, Any],
    carousels: dict[str, Any],
    day: str | None = None,
) -> dict[str, Any]:
    """Generate content ideas via a single AI call and persist them.

    Returns the ideas dict and writes it to
    ``data/reports/YYYY-MM-DD_ideas.json``.
    """
    day = day or utils.today_str()
    context = build_context(hook_records, trends, carousels)
    logger.info("Generating content ideas (single AI call)")

    payload = ai.chat_json(SYSTEM_PROMPT, context)
    ideas = _coerce_ideas(payload)

    if ideas is None:
        logger.info("AI ideas unavailable/invalid; using deterministic fallback")
        top_hooks = [r["hook"] for r in hook_records if r.get("hook")][:5]
        ideas = _fallback_ideas(top_hooks)

    out_path = config.REPORTS_DIR / f"{day}_ideas.json"
    utils.write_json(out_path, ideas)
    logger.info(
        "Stored ideas: %d reels, %d tiktoks, %d carousels -> %s",
        len(ideas.get("reels", [])),
        len(ideas.get("tiktoks", [])),
        len(ideas.get("carousels", [])),
        out_path.name,
    )
    return ideas
