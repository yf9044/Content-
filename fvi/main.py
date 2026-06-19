"""Fitness Viral Intelligence (fvi) — entry point.

Runs the full daily pipeline:
  1. Load competitors
  2. Scrape all accounts (with caching)
  3. Detect outliers
  4. Extract hooks (AI, deduplicated)
  5. Detect trends
  6. Analyze carousels
  7. Generate content ideas (single AI call)
  8. Build and open the report

Usage:
    python main.py            # full run (scrapes via Apify when cache misses)
    python main.py --dry-run  # offline: cached data only, no Apify calls
"""

from __future__ import annotations

import argparse
import logging

import config
from modules import ai, carousel, generator, hooks, outlier, reporter, scraper, trends
from modules import utils

logger = logging.getLogger("fvi")


def load_competitors() -> dict[str, list[str]]:
    """Load and lightly validate the competitors configuration."""
    data = utils.read_json(config.COMPETITORS_FILE, default=None)
    if not isinstance(data, dict):
        logger.error("competitors.json missing or invalid at %s", config.COMPETITORS_FILE)
        return {"instagram": [], "tiktok": []}
    instagram = [str(u) for u in data.get("instagram", []) if u]
    tiktok = [str(u) for u in data.get("tiktok", []) if u]
    logger.info("Loaded %d Instagram + %d TikTok competitors", len(instagram), len(tiktok))
    return {"instagram": instagram, "tiktok": tiktok}


def run(dry_run: bool = False, open_browser: bool = True) -> None:
    """Execute the full pipeline end to end."""
    day = utils.today_str()
    logger.info("=== Fitness Viral Intelligence run for %s (dry_run=%s) ===", day, dry_run)

    if not dry_run:
        scraper.prune_old_cache()

    # 1. Load competitors
    competitors = load_competitors()

    # 2. Scrape all accounts
    scraped = scraper.scrape_all(competitors, day=day, dry_run=dry_run)

    # 3. Detect outliers
    outliers = outlier.detect_outliers(scraped)
    leaderboard_rows = outlier.leaderboard(scraped)

    # 4. Extract hooks (AI, deduplicated)
    hook_records = hooks.analyze_hooks(outliers, day=day)

    # 5. Detect trends
    trend_data = trends.detect_trends(outliers, day=day)

    # 6. Analyze carousels
    carousel_data = carousel.analyze_carousels(outliers)

    # 7. Generate content ideas (single AI call)
    ideas = generator.generate_ideas(hook_records, trend_data, carousel_data, day=day)

    # 8. Build and open the report
    report_path = reporter.write_report(
        day,
        outliers,
        hook_records,
        trend_data,
        leaderboard_rows,
        carousel_data,
        ideas,
        open_browser=open_browser,
    )

    logger.info("Total OpenAI calls this run: %d", ai.calls_made())
    logger.info("=== Run complete. Report: %s ===", report_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="fvi",
        description="Fitness Viral Intelligence — daily competitor content intelligence.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Use cached data only; skip all Apify calls.",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not auto-open the generated report in a browser.",
    )
    args = parser.parse_args()

    config.configure_logging()

    try:
        run(dry_run=args.dry_run, open_browser=not args.no_browser)
    except Exception as exc:  # noqa: BLE001 - top-level guard, never crash silently
        logger.exception("Pipeline failed: %s", exc)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
