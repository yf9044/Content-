"""Module 3 — Hook extraction.

Extracts the opening "hook" from each outlier caption and enriches it with an
AI analysis (category, emotional/curiosity triggers, reusable template).

Token-cost rules honoured here:
  * Only the hook text (first sentence / 125 chars) is ever sent to the AI,
    never the full caption.
  * Posts already analysed (tracked in ``seen_ids.json``) are skipped.
  * All *new* hooks are batched into ONE AI call (keeping the run within
    the 3-calls-per-day budget) rather than one call per hook.
  * Analyses are cached on disk so they are never recomputed.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import config
from modules import ai, utils

logger = logging.getLogger(__name__)

HOOK_MAX_CHARS = 125

FORMAT_TYPES = (
    "Talking Head",
    "Carousel",
    "Listicle",
    "Transformation",
    "Tutorial",
    "Reaction",
)

SYSTEM_PROMPT = (
    "You are a viral content analyst. You will be given a numbered list of "
    "fitness hooks. For EACH hook return one JSON object with these exact "
    "keys: hook_text, hook_category, emotional_trigger, curiosity_trigger, "
    "reusable_template, why_it_worked, format_type. "
    "'why_it_worked' must be a 2-3 sentence explanation of why a post with this "
    "hook likely went viral. 'format_type' must be exactly one of: "
    "Talking Head, Carousel, Listicle, Transformation, Tutorial, Reaction. "
    "Respond with JSON only in the form "
    '{"results": [ {..}, {..} ]} where the results array preserves the input '
    "order and length."
)


def extract_hook(caption: str) -> str:
    """Return the hook = first sentence or first 125 characters of caption."""
    if not caption:
        return ""
    text = caption.strip()
    # First sentence: split on sentence-ending punctuation or a newline.
    match = re.split(r"(?<=[.!?])\s+|\n", text, maxsplit=1)
    first = match[0].strip() if match else text
    if first and len(first) <= HOOK_MAX_CHARS:
        return first
    return text[:HOOK_MAX_CHARS].strip()


def _hooks_cache_path(day: str):
    return utils.cache_dir_for(day) / "hook_analyses.json"


def _heuristic_analysis(hook_text: str) -> dict[str, Any]:
    """Fallback analysis when the AI is unavailable (no key/budget)."""
    lowered = hook_text.lower()
    if any(w in lowered for w in ("stop", "mistake", "wrong", "never", "avoid")):
        category = "warning"
        emotional = "fear of failure"
        format_type = "Talking Head"
    elif any(w in lowered for w in ("how", "step", "do this", "tutorial")):
        category = "educational"
        emotional = "curiosity"
        format_type = "Tutorial"
    elif any(w in lowered for w in ("why", "secret", "truth", "nobody")):
        category = "educational"
        emotional = "curiosity"
        format_type = "Talking Head"
    elif any(c.isdigit() for c in hook_text) and any(
        w in lowered for w in ("tips", "ways", "things", "reasons", "moves", "foods")
    ):
        category = "listicle"
        emotional = "value"
        format_type = "Listicle"
    elif any(w in lowered for w in ("before", "after", "transformation", "days", "weeks")):
        category = "transformation"
        emotional = "aspiration"
        format_type = "Transformation"
    elif any(w in lowered for w in ("i ", "my ", "me ")):
        category = "personal story"
        emotional = "relatability"
        format_type = "Talking Head"
    else:
        category = "tip"
        emotional = "aspiration"
        format_type = "Talking Head"
    return {
        "hook_text": hook_text,
        "hook_category": category,
        "emotional_trigger": emotional,
        "curiosity_trigger": "open loop",
        "reusable_template": re.sub(
            r"\d+", "[N]", hook_text[:HOOK_MAX_CHARS]
        ) or "[Hook template]",
        "why_it_worked": (
            "The hook opens a curiosity gap and speaks to a common fitness pain "
            "point, so viewers stop scrolling to find the answer. Its "
            f"{emotional} angle drives saves and shares, which the algorithm "
            "rewards with wider reach."
        ),
        "format_type": format_type,
    }


def _analyze_batch(hook_texts: list[str]) -> list[dict[str, Any]]:
    """Analyse a batch of hooks with a single AI call (or heuristics)."""
    if not hook_texts:
        return []

    numbered = "\n".join(f"{i + 1}. {h}" for i, h in enumerate(hook_texts))
    payload = ai.chat_json(SYSTEM_PROMPT, numbered)

    results: list[dict[str, Any]] = []
    if isinstance(payload, dict) and isinstance(payload.get("results"), list):
        results = [r for r in payload["results"] if isinstance(r, dict)]
    elif isinstance(payload, list):
        results = [r for r in payload if isinstance(r, dict)]

    if len(results) != len(hook_texts):
        if results:
            logger.warning(
                "AI returned %d analyses for %d hooks; filling gaps heuristically",
                len(results), len(hook_texts),
            )
        else:
            logger.info("Using heuristic hook analysis for %d hooks", len(hook_texts))
        # Pad/trim to align with inputs, filling missing with heuristics.
        aligned: list[dict[str, Any]] = []
        for idx, text in enumerate(hook_texts):
            if idx < len(results):
                item = dict(results[idx])
                item.setdefault("hook_text", text)
                aligned.append(item)
            else:
                aligned.append(_heuristic_analysis(text))
        return aligned

    return results


def analyze_hooks(
    outliers: list[dict[str, Any]],
    day: str | None = None,
) -> list[dict[str, Any]]:
    """Extract and analyse hooks for every outlier post.

    Returns a list of hook records, each containing the post id/url/account,
    the extracted ``hook`` text, and the ``analysis`` dict.
    """
    day = day or utils.today_str()
    seen_ids: set[str] = set(utils.read_json(config.SEEN_IDS_FILE, default=[]) or [])
    cache_path = _hooks_cache_path(day)
    cached_analyses: dict[str, Any] = utils.read_json(cache_path, default={}) or {}

    records: list[dict[str, Any]] = []
    pending_texts: list[str] = []
    pending_records: list[dict[str, Any]] = []

    for post in outliers:
        post_id = str(post.get("id", ""))
        hook_text = extract_hook(post.get("caption", ""))
        record: dict[str, Any] = {
            "id": post_id,
            "url": post.get("url", ""),
            "account": post.get("account", ""),
            "platform": post.get("platform", ""),
            "outlier_score": post.get("outlier_score", 0),
            "hook": hook_text,
            "analysis": None,
        }

        if post_id in cached_analyses:
            record["analysis"] = cached_analyses[post_id]
            records.append(record)
            continue

        if post_id and post_id in seen_ids:
            logger.info("Skipping already-seen post %s", post_id)
            # Still surface a heuristic analysis so the report has content.
            record["analysis"] = _heuristic_analysis(hook_text)
            records.append(record)
            continue

        if not hook_text:
            continue

        pending_texts.append(hook_text)
        pending_records.append(record)
        records.append(record)

    if pending_texts:
        logger.info("Analysing %d new hooks (batched into one AI call)", len(pending_texts))
        analyses = _analyze_batch(pending_texts)
        for record, analysis in zip(pending_records, analyses):
            record["analysis"] = analysis
            if record["id"]:
                cached_analyses[record["id"]] = analysis
                seen_ids.add(record["id"])

    utils.write_json(cache_path, cached_analyses)
    utils.write_json(config.SEEN_IDS_FILE, sorted(seen_ids))
    logger.info("Hook extraction complete: %d records", len(records))
    return records
