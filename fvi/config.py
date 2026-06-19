"""Central configuration for the Fitness Viral Intelligence (fvi) tool.

All tunable constants, paths, and runtime settings live here so that the rest
of the codebase imports a single source of truth. Secrets are NEVER stored in
this file; they are loaded from a local ``.env`` file via ``python-dotenv``.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"
CACHE_DIR: Path = DATA_DIR / "cache"
REPORTS_DIR: Path = DATA_DIR / "reports"
COMPETITORS_FILE: Path = DATA_DIR / "competitors.json"
SEEN_IDS_FILE: Path = DATA_DIR / "seen_ids.json"

# Ensure the runtime directories always exist.
for _directory in (DATA_DIR, CACHE_DIR, REPORTS_DIR):
    _directory.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Secrets (loaded from .env, never hardcoded)
# ---------------------------------------------------------------------------
load_dotenv(BASE_DIR / ".env")

APIFY_API_KEY: str = os.getenv("APIFY_API_KEY", "").strip()
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()

# ---------------------------------------------------------------------------
# Tunable behaviour
# ---------------------------------------------------------------------------
OUTLIER_THRESHOLD: float = 2.0  # Posts with score >= 2x avg are "winners"
MAX_COMPETITORS: int = 10
POSTS_PER_ACCOUNT: int = 20  # Fetch last 20 posts per account
CACHE_DAYS: int = 7  # Keep cache for 7 days
TOP_POSTS_FOR_AI: int = 5  # Only send top 5 posts per account to AI
AI_MODEL: str = "gpt-4o-mini"  # Cheap and fast
MAX_TOKENS: int = 1500

# ---------------------------------------------------------------------------
# Apify actors
# ---------------------------------------------------------------------------
INSTAGRAM_ACTOR: str = "apify/instagram-scraper"
TIKTOK_ACTOR: str = "clockworks/tiktok-scraper"

# Scrape retry behaviour.
SCRAPE_RETRIES: int = 3
SCRAPE_RETRY_DELAY_SECONDS: int = 5

# Hard cap on the number of OpenAI calls per run (token-cost guard rail).
MAX_AI_CALLS_PER_DAY: int = 3

# ---------------------------------------------------------------------------
# Trend detection
# ---------------------------------------------------------------------------
TREND_CHANGE_THRESHOLD: float = 0.20  # +/- 20% classifies rising/declining

# A small, hardcoded English stopword list used for keyword frequency.
STOPWORDS: frozenset[str] = frozenset(
    {
        "a", "an", "the", "and", "or", "but", "if", "while", "with", "without",
        "to", "of", "in", "on", "for", "at", "by", "from", "up", "down", "out",
        "is", "are", "was", "were", "be", "been", "being", "am", "do", "does",
        "did", "doing", "have", "has", "had", "having", "i", "you", "he", "she",
        "it", "we", "they", "me", "him", "her", "us", "them", "my", "your",
        "his", "its", "our", "their", "this", "that", "these", "those", "as",
        "so", "than", "too", "very", "can", "will", "just", "should", "now",
        "not", "no", "yes", "all", "any", "some", "more", "most", "other",
        "such", "only", "own", "same", "then", "once", "here", "there", "when",
        "where", "why", "how", "what", "which", "who", "whom", "get", "got",
        "go", "going", "into", "about", "over", "after", "before", "again",
        "also", "like", "one", "two", "three", "new", "make", "made", "want",
        "need", "know", "see", "way", "day", "time", "people", "really", "much",
        "every", "your", "you're", "im", "i'm", "dont", "don't", "youre",
        "thats", "that's", "ill", "i'll", "weve", "we've", "us", "via", "amp",
    }
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL: int = logging.INFO
LOG_FORMAT: str = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"


def configure_logging() -> None:
    """Configure root logging once for the whole application."""
    logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
