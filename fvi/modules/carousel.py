"""Module 5 — Carousel analysis.

Inspects carousel-type outlier posts to surface slide counts, title patterns,
and calls-to-action, then proposes reusable carousel templates.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

CTA_KEYWORDS = ("save", "share", "follow", "link", "comment")


def _first_line(caption: str) -> str:
    """Return the first non-empty line of a caption (the title pattern)."""
    for line in (caption or "").splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return (caption or "").strip()[:80]


def detect_cta(caption: str) -> list[str]:
    """Detect CTA keywords in the last 50 characters of the caption."""
    tail = (caption or "")[-50:].lower()
    return [kw for kw in CTA_KEYWORDS if kw in tail]


def analyze_carousels(outliers: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyse carousel posts and generate reusable templates.

    Returns a dict with ``carousels`` (per-post analysis) and ``templates``
    (3 reusable carousel structures derived from observed patterns).
    """
    carousels = [p for p in outliers if p.get("type") == "carousel"]
    analyses: list[dict[str, Any]] = []

    slide_counts: list[int] = []
    cta_counter: dict[str, int] = {kw: 0 for kw in CTA_KEYWORDS}

    for post in carousels:
        caption = post.get("caption", "")
        slide_count = post.get("slide_count") or 0
        ctas = detect_cta(caption)
        if slide_count:
            slide_counts.append(int(slide_count))
        for cta in ctas:
            cta_counter[cta] += 1

        analyses.append(
            {
                "url": post.get("url", ""),
                "account": post.get("account", ""),
                "slide_count": slide_count,
                "title": _first_line(caption),
                "cta": ctas,
                "outlier_score": post.get("outlier_score", 0),
            }
        )

    avg_slides = round(sum(slide_counts) / len(slide_counts)) if slide_counts else 7
    top_cta = max(cta_counter, key=cta_counter.get) if any(cta_counter.values()) else "save"

    templates = _build_templates(avg_slides, top_cta)

    logger.info(
        "Carousel analysis: %d carousels, avg %d slides, top CTA '%s'",
        len(analyses), avg_slides, top_cta,
    )

    return {
        "carousels": analyses,
        "templates": templates,
        "avg_slides": avg_slides,
        "top_cta": top_cta,
    }


def _build_templates(avg_slides: int, top_cta: str) -> list[dict[str, Any]]:
    """Generate 3 reusable carousel templates from observed patterns."""
    slides = max(5, min(avg_slides, 10))
    cta_line = f"Slide {slides}: CTA — '{top_cta.capitalize()} this for later'"
    return [
        {
            "name": "Listicle / Tips",
            "structure": [
                "Slide 1: Bold promise hook ('N tips to ...')",
                "Slides 2-{0}: One actionable tip per slide".format(slides - 1),
                cta_line,
            ],
        },
        {
            "name": "Myth vs. Truth",
            "structure": [
                "Slide 1: Common myth as the hook",
                "Slides 2-{0}: Debunk + the real truth".format(slides - 1),
                cta_line,
            ],
        },
        {
            "name": "Transformation / Step-by-step",
            "structure": [
                "Slide 1: Before/after or end-goal hook",
                "Slides 2-{0}: Sequential steps to get there".format(slides - 1),
                cta_line,
            ],
        },
    ]
