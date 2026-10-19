# PoliteScraper — Books to Scrape

A TypeScript web-scraping pipeline that collects and validates book data from [Books to Scrape](https://books.toscrape.com/), a practice website designed for scraping exercises.

## Target classification

**Classification:** Sandbox / practice website.

The target is Books to Scrape. At Stage 0, it was selected as a controlled practice target rather than an ordinary commercial bookstore. The scraper is deliberately limited to the first three catalogue pages and their individual book pages.

## Requirements

- Node.js with npm
- Internet access for a fresh run

## Install and run

Clone the repository and enter its directory:

```powershell
git clone https://github.com/Sammycode332/PoliteScraper.git
cd PoliteScraper
npm install
npm run dev
```

The documented run command is `npm run dev`. It executes the TypeScript entry point using `tsx`.

The scraper discovers books from up to three catalogue pages, removes duplicate URLs, fetches or reuses cached HTML, validates extracted records, and writes JSON outputs under `output/`.

Expected outputs:

- `output/books.json` — valid book records
- `output/errors.json` — records that failed validation, with error details
- `output/run-report.json` — summary of the run

The local `cache/` directory is intentionally excluded from Git. A fresh clone therefore starts without cached HTML and needs network access on its first run.

## Record schema

Each valid record in `output/books.json` contains:

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Book title |
| `product_url` | HTTPS URL string | Individual book page |
| `price_text` | string | Displayed price text |
| `price_gbp` | number | Parsed price in pounds sterling |
| `availability_text` | string | Displayed stock availability |
| `rating_text` | string | One of `One`, `Two`, `Three`, `Four`, `Five` |
| `description` | string, null, or omitted | Description when available |
| `source_page` | HTTPS URL string | Catalogue page where the book was discovered |
| `fetched_at` | ISO datetime string | Time associated with the fetched or cached record |

Records are validated with Zod before being included in `books.json`. Invalid records are written to `errors.json` with validation messages.

## Politeness and request handling

- **Identification:** sends the user-agent `PoliteScraper/1.0` with a repository URL.
- **Delay:** waits 500 milliseconds before each uncached catalogue or book-page request.
- **Timeout:** each network request has a 10-second timeout.
- **Retries:** retries once after a timeout or HTTP 5xx response, waiting one second before the retry. HTTP 403 and 404 responses are not retried.
- **Caching:** stores downloaded catalogue and book HTML locally to avoid unnecessary repeat requests. Book cache metadata records the product URL and fetch timestamp.
- **Scope:** visits at most three catalogue pages and processes unique book URLs discovered from them.
- **Failure handling:** failed individual book pages are logged and skipped so other books can still be processed.

Cached pages are reused without a freshness check. Delete the local `cache/` directory if you need to fetch the pages again.

## Sample run report

The following is a real report captured from a run on 19 October 2026. All 63 page reads were cache hits, so this demonstrates successful processing of cached data—not a fresh network scrape.

```json
{
  "started_at": "2026-10-19T18:18:40.626Z",
  "duration_ms": 410,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

The report records the start time, duration in milliseconds, number of network pages fetched, cache hits, valid records, invalid records, and failed pages.

## Limitations

This scraper is purpose-built for the current HTML structure of Books to Scrape. If the site's markup changes, selectors or extraction logic may need updating. Cached pages are not automatically refreshed, and author information is not currently extracted into the record schema.

During the initial classification, `https://books.toscrape.com/robots.txt` returned `404 Not Found`. This observation is not treated as permission to scrape other sites or ignore their rules.

## Why no browser was needed

The required book data is already present in the HTML returned by the server, so a browser would add execution cost without providing useful additional information for this assignment.

## Ethics

Use an official API when one exists. Never bypass logins, paywalls, or blocks. Collect only the data needed for the stated purpose, respect the target site's rules, and check the terms and permissions before adapting this scraper to another website.
