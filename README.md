# job-search-dashboard

A lightweight, static job-search dashboard built on the Adzuna API. It gives you a filter sidebar, result cards, age-cohort relevance presets, and a query inspector so you can see exactly what is being sent to the API and why listings are kept or suppressed.

Built to fix the common problem of broad job APIs surfacing irrelevant or age-inappropriate listings (e.g. senior/licensed roles or commission-only "opportunities" shown to 15-18 year olds).

## Features

- Keyword, exclude-words, location, distance, salary, contract type/time filters
- Age-cohort presets: General, Teen (15-18), Early career
- Client-side suppression of cohort-mismatched titles and junk/commission-only listings
- "Max days old" freshness filter and sort by relevance / date / salary
- Result cards with company, location, salary, and reason tags
- Query inspector showing the (redacted) outgoing request and why items were suppressed
- Pagination

## Setup

1. Get your Adzuna credentials at https://developer.adzuna.com/admin/access_details
2. Copy `config.example.js` to `config.js`
3. Put your `app_id` and `app_key` into `config.js` (this file is gitignored and never committed)
4. Serve the folder locally, e.g. `python3 -m http.server 8000`, then open http://localhost:8000

Note: the Adzuna API requires the app_id/app_key as request parameters. Because this is a static client-side app the key is visible in the browser network tab, so keep the repo private if that is a concern, or proxy requests through a small backend.

## Files

- `index.html` - layout and filter sidebar
- `styles.css` - styling
- `filters.js` - cohort presets and post-query relevance/suppression logic
- `app.js` - API requests, rendering, paging, query inspector
- `config.example.js` - credential template (copy to `config.js`)

## Tuning filters

Edit `COHORT_PRESETS` and `JUNK_PATTERNS` in `filters.js` to adjust which titles/phrases are suppressed per cohort. The query inspector lists suppressed examples with reasons to help you tune the rules.
