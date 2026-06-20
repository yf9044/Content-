"""Shared helpers used across fvi modules: dates, JSON I/O, cache paths."""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import config

logger = logging.getLogger(__name__)


def today_str(when: date | None = None) -> str:
    """Return an ISO ``YYYY-MM-DD`` date string (defaults to today)."""
    return (when or date.today()).isoformat()


def yesterday_str() -> str:
    """Return yesterday's ISO ``YYYY-MM-DD`` date string."""
    return (date.today() - timedelta(days=1)).isoformat()


def cache_dir_for(day: str) -> Path:
    """Return (and create) the cache directory for a given day string."""
    directory = config.CACHE_DIR / day
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def cache_file_for(day: str, platform: str, username: str) -> Path:
    """Return the cache file path for a platform/username on a given day."""
    safe_username = username.lstrip("@")
    return cache_dir_for(day) / f"{platform}_{safe_username}.json"


def read_json(path: Path, default: Any = None) -> Any:
    """Safely read JSON from ``path``; return ``default`` on any failure."""
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return default
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("Failed to read JSON from %s: %s", path, exc)
        return default


def write_json(path: Path, data: Any) -> bool:
    """Safely write ``data`` as JSON to ``path``. Returns success flag."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
        return True
    except (TypeError, OSError) as exc:
        logger.error("Failed to write JSON to %s: %s", path, exc)
        return False


def parse_iso_date(value: str) -> datetime | None:
    """Best-effort parse of an ISO-ish datetime string."""
    if not value:
        return None
    cleaned = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(cleaned)
    except ValueError:
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(value[: len(fmt) + 2], fmt)
            except ValueError:
                continue
    return None
