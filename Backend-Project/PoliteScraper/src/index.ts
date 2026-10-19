import * as cheerio from "cheerio"
import { mkdir, readFile, writeFile} from "node:fs/promises";
import { join } from "node:path"; 
import{ z } from "zod";
//the above tools imimorted are need ed to create acache directory

const runStartedAt = new Date();
const runStartedMs = Date.now();

let pagesFetched = 0;
let cacheHits= 0;
let failedPages = 0;
const CatalogueURL: string = "https://books.toscrape.com/"

const CacheDirectory: string= "cache"
const userAgentidentifier: string = "PoliteScraper/1.0 (https://github.com/Sammycode332/FlyRank-Assignments/tree/main/Backend-Project/PoliteScraper)"


function getCacheFilePath(pageNumber: number): string{
    const filename =  `catalogue-page-${pageNumber}.html`
    return join(CacheDirectory,filename)
}
function getBookCacheFilePath(bookNumber: number): string{
    const filename = `book-page-${bookNumber}.html`
    return join(CacheDirectory,filename)
}
function getBookTimeStampFilePath(bookNumber: number): string{
    const filename = `book-page-${bookNumber}.json`;
    return join(CacheDirectory,filename)
}
async function fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await fetch(url, {
                headers: { "User-Agent": userAgentidentifier },
                signal: AbortSignal.timeout(10000)
            });

            if (response.status >= 500 && response.status <= 599) {
                if (attempt === 1) {
                    console.log(`SERVER ERROR ${response.status}. Retrying once...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
            }

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            return response;
        } catch (error) {
            const isTimeout =
                error instanceof Error &&
                (error.name === "TimeoutError" || error.name === "AbortError");

            if (isTimeout && attempt === 1) {
                console.log("Request timed out. Retrying once...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            throw error;
        }
    }

    throw new Error(`Request failed after retry: ${url}`);
}
async function getBookPageHtml(
    productUrl: string,
    bookNumber:number
):Promise<{ html: string; fetchedAt: string}>{
    const cacheFilePath = getBookCacheFilePath(bookNumber);
    const timestampFilePath = getBookTimeStampFilePath(bookNumber);
    try {
    const html = await readFile(cacheFilePath, "utf-8");
    const timestampJson = await readFile(timestampFilePath, "utf-8");
    const timestampData = JSON.parse(timestampJson);

   // Check which URL this cached HTML belongs to
     const cachedUrl = timestampData.product_url;

if (cachedUrl !== productUrl) {
    throw new Error(
        `Cache mismatch for book ${bookNumber}: expected ${productUrl}, found ${cachedUrl}`
    );
}

    console.log(`CACHE HIT: book ${bookNumber}`);
    cacheHits++
    return {
    html,
    fetchedAt: timestampData.fetched_at
};
}
catch(error){
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "ENOENT"
) {
    throw error;
}
    console.log(`CACHE MISS: book ${bookNumber}`);
    await mkdir(CacheDirectory, { recursive: true });
    await new Promise(resolve => setTimeout(resolve, 500));

   const response = await fetchWithRetry(productUrl);
   const html = await response.text();
   pagesFetched++
    await writeFile(cacheFilePath, html, "utf-8");

   const fetchedAt = new Date().toISOString();
   
await writeFile(
    timestampFilePath,
    JSON.stringify(
        {
            product_url: productUrl,
            fetched_at: fetchedAt
        },
        null,
        2
    ),
    "utf-8"
);


console.log(`FETCH: book ${bookNumber}`);

return { html, fetchedAt };
}
}
async function getPageHtml(
    pageUrl: string,
    pageNumber: number
): Promise<string> {
    const cacheFilePath = getCacheFilePath(pageNumber);

    try {
        const html = await readFile(cacheFilePath, "utf-8");
        console.log(`CACHE HIT: page ${pageNumber}`);
        cacheHits++
        return html;
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code !== "ENOENT"
        ) {
            throw error;
        }
    }

    console.log(`CACHE MISS: page ${pageNumber}`);

    await mkdir(CacheDirectory, { recursive: true });

    await new Promise(resolve => setTimeout(resolve, 500)); //ratelimit here 

    const response = await fetchWithRetry(pageUrl);

    const html = await response.text();
    pagesFetched++
    await writeFile(cacheFilePath, html, "utf-8");

    console.log(`FETCH: page ${pageNumber}`);

    return html;
}


function extractCatalogue(html: string, pageUrl: string) {
    const $ = cheerio.load(html);
    const bookLinks: string[] = [];

    $("article.product_pod h3 a").each((index, element) => {
        const href = $(element).attr("href");

        if (href) {
            const absoluteUrl = new URL(href, pageUrl).href;
            bookLinks.push(absoluteUrl);
        }
    });

    const nextHref = $("li.next a").attr("href");

    const nextPageUrl = nextHref
        ? new URL(nextHref, pageUrl).href
        : null;

    return { bookLinks, nextPageUrl };
}

function cleanDescription(text: string): string | null {
    const cleanedText = text
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanedText) {
        return null;
    }

    // Find the repeated opening of the description.
    const normalizedText = cleanedText.toLowerCase();

    for (let length = Math.min(100, Math.floor(cleanedText.length / 2)); length >= 20; length--) {
        const opening = normalizedText.slice(0, length);
        const secondOccurrence = normalizedText.indexOf(opening, length);

        if (secondOccurrence !== -1) {
            return cleanedText.slice(secondOccurrence).trim();
        }
    }

    return cleanedText;
}
function normalizePrice(priceText: string | null): number |null{
    if(!priceText){
        return null
    }
    const numericText = priceText.replace("£", "").trim();
    const price = Number(numericText)

    return Number.isFinite(price)? price: null
}
const BookSchema = z.object({
    title: z.string().min(1),
    product_url: z.string().url().startsWith("https://"),
    price_text: z.string().min(1),
    price_gbp: z.number().finite().nonnegative(),
    availability_text: z.string().min(1),
    rating_text: z.enum([
        "One",
        "Two",
        "Three",
        "Four",
        "Five"
    ]),
    description: z.string().nullable().optional(),
    source_page: z.string().url().startsWith("https://"),
    fetched_at: z.string().datetime()
});
function extractBookDetails(html:string,productUrl:string){
    const $ =cheerio.load(html)
    
    const product = $(".product_main")

    const title = product.find("h1").text().trim() || null;

    const priceText = product.find(".price_color").first().text().trim()|| null;

    const availabilityText =product.find(".availability").text().trim().replace(/\s+/g, " ") || null;

   
  const descriptionElement = $("#product_description + p");

 const ratingText = product.find(".star-rating").attr("class")?.split(" ").at(-1) || null;
    
    const description = descriptionElement.length
    ? cleanDescription(descriptionElement.text())
    : null;
    return {
        title,
        product_url: productUrl,
        price_text: priceText,
        availability_text: availabilityText,
        rating_text: ratingText,
        description
    };
}


let currentPageUrl: string | null = CatalogueURL

let cataloguePages= 0;
const allBookLinks: string[] = []
const sourcePageByBookUrl = new Map<string, string>();
const visitedPageUrls = new Set<string>()

while (currentPageUrl && cataloguePages < 3) {
    if(visitedPageUrls.has(currentPageUrl)){
        break;
    }
    visitedPageUrls.add(currentPageUrl)
    const pageUrl = currentPageUrl
    const pageHtml = await getPageHtml(pageUrl, cataloguePages+1 )
    const catalogue = extractCatalogue(pageHtml, pageUrl);
    allBookLinks.push(...catalogue.bookLinks)
    for (const bookUrl of catalogue.bookLinks) {
    sourcePageByBookUrl.set(bookUrl, pageUrl);
}
    cataloguePages++;
    currentPageUrl = catalogue.nextPageUrl
}
const uniqueBookLinks = [...new Set(allBookLinks)]
console.log(`catalogue_pages=${cataloguePages}`);
console.log(`discovered=${allBookLinks.length}`);
console.log(`unique_urls=${uniqueBookLinks.length}`);

const rawRecords =[]


for (let index = 0; index < uniqueBookLinks.length; index++) {
    const productUrl = uniqueBookLinks[index];
    const bookNumber = index + 1;

    try {
        const { html, fetchedAt } = await getBookPageHtml(
            productUrl,
            bookNumber
        );

        const details = extractBookDetails(html, productUrl);

        const priceGbp = normalizePrice(details.price_text);
        const sourcePage = sourcePageByBookUrl.get(productUrl) ?? null;

        rawRecords.push({
            ...details,
            price_gbp: priceGbp,
            source_page: sourcePage,
            fetched_at: fetchedAt
        });

    } catch (error) {
        failedPages++;

        const message = error instanceof Error
            ? error.message
            : String(error);

        console.error(
            `FAILED PAGE: book ${bookNumber} | ${productUrl} | ${message}`
        );

        continue;
    }
}

const validBooks = [];
const invalidBooks = [];

for(const record of rawRecords){
    const result = BookSchema.safeParse(record)

    if(result.success){
        validBooks.push(result.data)
    }else{
        invalidBooks.push({
            record,
            errors: result.error.issues.map(issue=>({
                field:issue.path.join("."),
                message:issue.message
            }))
        })
    }
}
await mkdir("output",{recursive:true});

await writeFile(
    "output/books.json",
    JSON.stringify(validBooks,null,2),
    "utf-8"
)
await writeFile(
    "errors.json",
    JSON.stringify(invalidBooks,null,2),
    "utf-8"
)

const durationMs = Date.now() - runStartedMs;

const runReport = {
    started_at: runStartedAt.toISOString(),
    duration_ms: durationMs,
    pages_fetched: pagesFetched,
    cache_hits: cacheHits,
    valid_records: validBooks.length,
    invalid_records: invalidBooks.length,
    failed_pages: failedPages
};

await writeFile(
    "output/run-report.json",
    JSON.stringify(runReport, null, 2),
    "utf-8"
);

console.log("Saved run report to output/run-report.json");


console.log(`detail_pages=${rawRecords.length}`);
console.log("First complete raw record:");
console.log(rawRecords[0]);

console.log(`detail_pages=${rawRecords.length}`);
console.log(`valid_books=${validBooks.length}`);
console.log(`invalid_books=${invalidBooks.length}`);
console.log("Saved valid books to output/books.json");
console.log("Saved validation failures to errors.json");