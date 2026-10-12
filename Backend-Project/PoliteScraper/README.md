# Books to Scrape Pipeline

## Target Classification

**Target website:** [Books to Scrape](https://books.toscrape.com/)

**Purpose:** Books to Scrape is a fictional online bookstore provided as a practice environment for people learning web scraping. It is suitable for this assignment because it allows us to practise collecting structured information from web pages without targeting an ordinary commercial bookstore.

**Approach:** The scraper will retrieve the catalogue pages, extract links to individual books, and collect the relevant information from each book's page.

## Scope

This project is limited to the first three catalogue pages of Books to Scrape and the 60 individual book pages linked from those catalogues.

The scraper will not navigate beyond the specified catalogue pages to discover additional books.

## Data to Collect

The scraper will aim to collect the following information from each book page:

- **Title:** The book's title.
- **Price:** The listed price of the book.
- **Availability:** Whether the book is in stock or unavailable.
- **Rating:** The book's displayed star rating.
- **Product URL:** The URL of the individual book page.
- **Author:** The author, if available on the page.
- **Description:** The book's description, if available on the page.

The extracted information will be validated and converted into clean, structured JSON records.

## Robots.txt Observation

The URL `https://books.toscrape.com/robots.txt` returned a `404 Not Found` response when checked.

No robots.txt file was found at that URL. This observation will be documented rather than interpreted as unrestricted permission to scrape. The project's scope remains limited to the designated practice website and assignment requirements.

## Responsible Scraping

The scraper will identify itself appropriately, use a reasonable delay between requests, and avoid sending unnecessary or excessive requests to the website.

Each page will be treated as untrusted input. Extracted data will be checked before it is stored, and errors on individual pages should not cause the entire pipeline to crash.

The scraper will also produce a short report at the end of each run, summarising what happened during collection.

I will not reuse this code on another site without checking its rules and terms first.
