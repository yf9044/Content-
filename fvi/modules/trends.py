"""Module 4 — Trend detection.

Builds a keyword-frequency profile from today's outlier captions, persists it,
and compares it against yesterday's profile to classify each keyword as
rising, declining, or stable.
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from typing import Any

import config
from modules import utils

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"[a-zA-Z']+")


def _trend_cache_path(day: str):
    return utils.cache_dir_for(day) / "keyword_frequency.json"


def extract_keywords(captions: list[str]) -> Counter:
    """Return a word-frequency Counter across captions, minus stopwords."""
    counter: Counter = Counter()
    for caption in captions:
        for raw in _WORD_RE.findall((caption or "").lower()):
            word = raw.strip("'")
            if len(word) < 3 or word in config.STOPWORDS:
                continue
            counter[word] += 1
    return counter


def _classify(today_freq: int, yesterday_freq: int) -> str:
    """Classify keyword movement using the +/- threshold."""
    threshold = config.TREND_CHANGE_THRESHOLD
    if yesterday_freq == 0:
        return "rising" if today_freq > 0 else "stable"
    change = (today_freq - yesterday_freq) / yesterday_freq
    if change > threshold:
        return "rising"
    if change < -threshold:
        return "declining"
    return "stable"


def detect_trends(
    outliers: list[dict[str, Any]],
    day: str | None = None,
) -> dict[str, Any]:
    """Detect keyword trends from outlier captions.

    Returns a dict with ``top_keywords`` (list of (word, count)) and
    ``classified`` (list of dicts with word/today/yesterday/status).
    """
    day = day or utils.today_str()
    yesterday = utils.yesterday_str()

    captions = [o.get("caption", "") for o in outliers]
    today_counter = extract_keywords(captions)

    # Persist today's profile for tomorrow's comparison.
    today_path = _trend_cache_path(day)
    utils.write_json(today_path, dict(today_counter))

    yesterday_freq: dict[str, int] = utils.read_json(
        _trend_cache_path(yesterday), default={}
    ) or {}

    classified: list[dict[str, Any]] = []
    for word, count in today_counter.most_common():
        prev = int(yesterday_freq.get(word, 0))
        classified.append(
            {
                "keyword": word,
                "today": count,
                "yesterday": prev,
                "status": _classify(count, prev),
            }
        )

    rising = [c for c in classified if c["status"] == "rising"]
    logger.info(
        "Trend detection: %d keywords (%d rising) vs %s",
        len(classified), len(rising), yesterday,
    )

    return {
        "top_keywords": today_counter.most_common(15),
        "classified": classified,
        "rising": rising,
    }
