"""Module 1 — Scraper.

Scrapes fitness competitor accounts on Instagram and TikTok via the Apify
platform, with on-disk caching (one file per account per day) so that repeat
runs and ``--dry-run`` never hit the network unnecessarily.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any

import config
from modules import utils

logger = logging.getLogger(__name__)

# Apify client is imported lazily so the tool still works in dry-run / offline
# mode (and in environments where the SDK is not installed).
try:  # pragma: no cover - import guard
    from apify_client import ApifyClient
except ImportError:  # pragma: no cover
    ApifyClient = None  # type: ignore[assignment]


def _safe_int(value: Any) -> int:
    """Coerce a possibly-missing/None numeric value into a non-negative int."""
    try:
        if value is None:
            return 0
        return max(0, int(value))
    except (TypeError, ValueError):
        return 0


# ---------------------------------------------------------------------------
# Normalisation: convert raw Apify items into the canonical post schema.
# ---------------------------------------------------------------------------
def _normalize_instagram(item: dict[str, Any]) -> dict[str, Any]:
    """Map a raw Instagram Apify item into the canonical post schema."""
    raw_type = (item.get("type") or "").lower()
    product_type = (item.get("productType") or "").lower()
    slide_count: int | None = None

    if raw_type == "sidecar":
        post_type = "carousel"
        children = item.get("childPosts") or item.get("images") or []
        slide_count = len(children) if children else _safe_int(
            item.get("childPostsCount")
        )
    elif raw_type == "video" or product_type in {"clips", "reels"}:
        post_type = "reel"
    else:
        post_type = "image"

    return {
        "id": str(item.get("id") or item.get("shortCode") or item.get("url", "")),
        "url": item.get("url", ""),
        "date": item.get("timestamp", ""),
        "views": _safe_int(item.get("videoViewCount") or item.get("videoPlayCount")),
        "likes": _safe_int(item.get("likesCount")),
        "comments": _safe_int(item.get("commentsCount")),
        "caption": item.get("caption") or "",
        "type": post_type,
        "slide_count": slide_count,
    }


def _normalize_tiktok(item: dict[str, Any]) -> dict[str, Any]:
    """Map a raw TikTok Apify item into the canonical post schema."""
    return {
        "id": str(item.get("id") or item.get("webVideoUrl", "")),
        "url": item.get("webVideoUrl") or item.get("url", ""),
        "date": item.get("createTimeISO") or item.get("createTime", ""),
        "views": _safe_int(item.get("playCount")),
        "likes": _safe_int(item.get("diggCount") or item.get("likesCount")),
        "comments": _safe_int(item.get("commentCount")),
        "caption": item.get("text") or item.get("caption") or "",
        "type": "tiktok",
        "slide_count": None,
    }


# ---------------------------------------------------------------------------
# Apify actor invocation with retry logic.
# ---------------------------------------------------------------------------
def _instagram_profile_url(username: str) -> str:
    """Build a full Instagram profile URL from a username/handle."""
    handle = username.strip().lstrip("@").strip("/")
    return f"https://www.instagram.com/{handle}/"


def _build_actor_input(platform: str, username: str) -> tuple[str, dict[str, Any]]:
    """Return the (actor_id, run_input) pair for a platform/username."""
    if platform == "instagram":
        return config.INSTAGRAM_ACTOR, {
            "directUrls": [_instagram_profile_url(username)],
            "resultsType": "posts",
            "resultsLimit": config.POSTS_PER_ACCOUNT,
            "addParentData": False,
        }
    return config.TIKTOK_ACTOR, {
        "profiles": [username.lstrip("@")],
        "resultsPerPage": config.POSTS_PER_ACCOUNT,
        "shouldDownloadVideos": False,
        "shouldDownloadCovers": False,
    }


def _run_actor(platform: str, username: str) -> list[dict[str, Any]]:
    """Invoke the relevant Apify actor and return raw dataset items."""
    if ApifyClient is None:
        raise RuntimeError(
            "apify-client is not installed. Run `pip install -r requirements.txt`."
        )
    if not config.APIFY_API_KEY:
        raise RuntimeError("APIFY_API_KEY is not set. Add it to your .env file.")

    actor_id, run_input = _build_actor_input(platform, username)
    client = ApifyClient(config.APIFY_API_KEY)

    last_error: Exception | None = None
    for attempt in range(1, config.SCRAPE_RETRIES + 1):
        try:
            logger.info(
                "Calling Apify actor %s for %s/%s (attempt %d/%d)",
                actor_id, platform, username, attempt, config.SCRAPE_RETRIES,
            )

            # Start the run, then explicitly wait for it to finish using the
            # run client. The apify-client SDK returns a typed ``Run`` model
            # (pydantic), so its fields are accessed as attributes — NOT via
            # ``.get()`` (the source of the "Run object has no attribute 'get'"
            # error).
            started = client.actor(actor_id).start(run_input=run_input)
            run_client = client.run(started.id)
            run = run_client.wait_for_finish()
            if run is None:
                raise RuntimeError("Apify run could not be retrieved after finishing")

            if run.status != "SUCCEEDED":
                raise RuntimeError(f"Apify run finished with status {run.status!r}")

            dataset_id = run.default_dataset_id
            if not dataset_id:
                raise RuntimeError("Apify run returned no dataset id")

            # ``list_items()`` returns a ``DatasetItemsPage`` whose ``.items``
            # is a plain ``list[dict]`` of the scraped records.
            items = client.dataset(dataset_id).list_items().items
            logger.info("Apify returned %d items for %s/%s", len(items), platform, username)
            return items
        except Exception as exc:  # noqa: BLE001 - retry on any failure
            last_error = exc
            logger.error(
                "Apify call failed for %s/%s (attempt %d/%d): %s",
                platform, username, attempt, config.SCRAPE_RETRIES, exc,
            )
            if attempt < config.SCRAPE_RETRIES:
                time.sleep(config.SCRAPE_RETRY_DELAY_SECONDS)

    logger.error(
        "All %d attempts failed for %s/%s: %s",
        config.SCRAPE_RETRIES, platform, username, last_error,
    )
    return []


def _normalize_items(platform: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalise raw items, skipping any that fail individually."""
    normalizer = _normalize_instagram if platform == "instagram" else _normalize_tiktok
    posts: list[dict[str, Any]] = []
    for item in items:
        try:
            posts.append(normalizer(item))
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to normalise %s item: %s", platform, exc)
    return posts[: config.POSTS_PER_ACCOUNT]


def scrape_account(
    platform: str,
    username: str,
    day: str | None = None,
    dry_run: bool = False,
) -> list[dict[str, Any]]:
    """Scrape a single account, using the daily cache when possible.

    Returns a list of canonical post dicts. On dry-run with no cache, an empty
    list is returned (no network calls are ever made in dry-run mode).
    """
    day = day or utils.today_str()
    cache_path: Path = utils.cache_file_for(day, platform, username)

    cached = utils.read_json(cache_path)
    if cached is not None:
        logger.info("Cache hit for %s/%s (%s) — skipping API call", platform, username, day)
        return cached

    if dry_run:
        logger.info(
            "Dry-run: no cache for %s/%s (%s); skipping Apify call", platform, username, day
        )
        return []

    logger.info("Cache miss for %s/%s (%s) — scraping via Apify", platform, username, day)
    try:
        raw_items = _run_actor(platform, username)
    except Exception as exc:  # noqa: BLE001
        logger.error("Scrape aborted for %s/%s: %s", platform, username, exc)
        return []

    posts = _normalize_items(platform, raw_items)
    if posts:
        utils.write_json(cache_path, posts)
        logger.info("Cached %d posts for %s/%s (%s)", len(posts), platform, username, day)
    return posts


def scrape_all(
    competitors: dict[str, list[str]],
    day: str | None = None,
    dry_run: bool = False,
) -> dict[str, list[dict[str, Any]]]:
    """Scrape every configured account.

    Returns a mapping of ``"{platform}:{username}"`` -> list of posts.
    """
    day = day or utils.today_str()
    results: dict[str, list[dict[str, Any]]] = {}

    for platform in ("instagram", "tiktok"):
        usernames = competitors.get(platform, []) or []
        for username in usernames[: config.MAX_COMPETITORS]:
            key = f"{platform}:{username}"
            posts = scrape_account(platform, username, day=day, dry_run=dry_run)
            results[key] = posts
            logger.info("Collected %d posts for %s", len(posts), key)

    total = sum(len(v) for v in results.values())
    logger.info("Scraping complete: %d posts across %d accounts", total, len(results))
    return results


def prune_old_cache(keep_days: int = config.CACHE_DAYS) -> None:
    """Delete cache day-folders older than ``keep_days``."""
    from datetime import date, timedelta

    cutoff = date.today() - timedelta(days=keep_days)
    try:
        for entry in config.CACHE_DIR.iterdir():
            if not entry.is_dir():
                continue
            parsed = utils.parse_iso_date(entry.name)
            if parsed and parsed.date() < cutoff:
                for child in entry.iterdir():
                    child.unlink(missing_ok=True)
                entry.rmdir()
                logger.info("Pruned old cache directory %s", entry.name)
    except OSError as exc:
        logger.error("Failed to prune cache: %s", exc)
