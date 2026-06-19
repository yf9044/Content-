# Fitness Viral Intelligence (fvi)

A local Python CLI that, every day, scrapes 10 fitness competitor accounts on
**Instagram** and **TikTok**, detects viral/outlier posts, extracts hooks and
trends, and generates a daily markdown report packed with ready-to-use content
ideas.

## What it does

```
Load competitors → Scrape (cached) → Detect outliers → Extract hooks (AI)
→ Detect trends → Analyze carousels → Generate ideas (AI) → Build & open report
```

The report (`data/reports/YYYY-MM-DD_report.md`) includes top winning posts,
hooks and reusable templates, emerging trends, a competitor leaderboard, the
best carousel structures, and 30 fresh content ideas (10 reels / 10 TikToks /
10 carousels) plus a single recommended post for the day. It is rendered to
HTML and auto-opened in your browser.

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure your API keys

Copy the template and fill in your keys (never commit `.env`):

```bash
cp .env.example .env
```

```dotenv
APIFY_API_KEY=your_apify_token
OPENAI_API_KEY=your_openai_key
```

- **Apify token:** https://console.apify.com/account/integrations
- **OpenAI key:** https://platform.openai.com/api-keys

### 3. Edit the competitors you track

Edit `data/competitors.json` (up to 10 accounts total):

```json
{
  "instagram": ["username1", "username2"],
  "tiktok": ["@handle1", "@handle2"]
}
```

### 4. Run the daily pipeline

```bash
python main.py
```

### 5. Offline / test run

Runs against cached data only and makes **no** Apify calls:

```bash
python main.py --dry-run
```

Add `--no-browser` to skip auto-opening the report.

## Configuration

All tunables live in `config.py`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `OUTLIER_THRESHOLD` | `2.0` | Posts scoring ≥ 2× the account mean are "winners" |
| `MAX_COMPETITORS` | `10` | Max accounts tracked per platform |
| `POSTS_PER_ACCOUNT` | `20` | Posts fetched per account |
| `CACHE_DAYS` | `7` | How long raw scrape cache is kept |
| `TOP_POSTS_FOR_AI` | `5` | Top posts/hooks summarized for the AI |
| `AI_MODEL` | `gpt-4o-mini` | Cheap, fast model used for every call |
| `MAX_TOKENS` | `1500` | Max tokens per AI response |

## Token / cost optimization

- Raw post data is **never** sent to the AI — only summarized context.
- Only hooks (first 125 chars), not full captions, reach the model.
- `data/seen_ids.json` prevents re-analyzing the same post twice.
- The whole run is capped at **3 OpenAI calls/day** (hooks are batched into one
  call; idea generation is a single call).
- Every run uses `gpt-4o-mini` and logs token usage after each call.

## Project structure

```
fvi/
├── main.py            # Entry point: python main.py
├── config.py          # All constants and settings
├── .env               # API keys (never committed)
├── .env.example       # Template for setup
├── requirements.txt
├── README.md
├── data/
│   ├── competitors.json
│   ├── cache/         # Raw scraped posts per account per day
│   └── reports/       # Daily markdown reports + ideas JSON
└── modules/
    ├── scraper.py     # Apify scraping logic
    ├── outlier.py     # Engagement scoring
    ├── hooks.py       # Hook extraction (AI)
    ├── trends.py      # Trend detection
    ├── carousel.py    # Carousel analysis
    ├── generator.py   # Content idea generation (AI)
    └── reporter.py    # Markdown report builder
```

## Notes

- The tool degrades gracefully: if OpenAI is unavailable (missing key or budget
  reached) it falls back to deterministic heuristics so a report is always
  produced.
- Scraping retries 3 times with a 5s delay before giving up on an account.
- Logging is at `INFO` level throughout; errors are logged, never swallowed.
