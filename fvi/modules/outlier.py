"""Module 2 — Outlier detection.

Scores every post by engagement, compares it to its account's mean, and keeps
only the statistical "winners" (outlier_score >= OUTLIER_THRESHOLD).
"""

from __future__ import annotations

import logging
from typing import Any

import config

logger = logging.getLogger(__name__)


def engagement_score(post: dict[str, Any]) -> float:
    """Engagement score = likes + comments + (views * 0.01)."""
    likes = float(post.get("likes", 0) or 0)
    comments = float(post.get("comments", 0) or 0)
    views = float(post.get("views", 0) or 0)
    return likes + comments + (views * 0.01)


def account_mean(posts: list[dict[str, Any]]) -> float:
    """Mean engagement across an account's posts (0.0 if empty)."""
    if not posts:
        return 0.0
    total = sum(engagement_score(p) for p in posts)
    return total / len(posts)


def detect_outliers(
    scraped: dict[str, list[dict[str, Any]]],
    threshold: float = config.OUTLIER_THRESHOLD,
) -> list[dict[str, Any]]:
    """Detect outlier posts across all accounts.

    Each returned post is the original dict enriched with ``engagement``,
    ``outlier_score``, ``account`` and ``platform`` keys. The result is sorted
    by ``outlier_score`` descending.
    """
    outliers: list[dict[str, Any]] = []

    for account_key, posts in scraped.items():
        if not posts:
            continue
        platform, _, username = account_key.partition(":")
        mean = account_mean(posts)
        if mean <= 0:
            logger.info("Account %s has zero mean engagement — skipping", account_key)
            continue

        for post in posts:
            score = engagement_score(post)
            outlier_score = score / mean
            if outlier_score >= threshold:
                enriched = dict(post)
                enriched["engagement"] = round(score, 2)
                enriched["outlier_score"] = round(outlier_score, 2)
                enriched["account"] = username
                enriched["platform"] = platform
                outliers.append(enriched)

        logger.info(
            "Account %s: mean=%.1f, %d outliers found (threshold %.1fx)",
            account_key, mean, sum(
                1 for o in outliers if o.get("account") == username
                and o.get("platform") == platform
            ), threshold,
        )

    outliers.sort(key=lambda p: p["outlier_score"], reverse=True)
    logger.info("Detected %d outlier posts in total", len(outliers))
    return outliers


def leaderboard(scraped: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    """Rank competitors by average engagement (descending)."""
    rows: list[dict[str, Any]] = []
    for account_key, posts in scraped.items():
        if not posts:
            continue
        platform, _, username = account_key.partition(":")
        rows.append(
            {
                "account": username,
                "platform": platform,
                "avg_engagement": round(account_mean(posts), 2),
                "post_count": len(posts),
            }
        )
    rows.sort(key=lambda r: r["avg_engagement"], reverse=True)
    return rows
