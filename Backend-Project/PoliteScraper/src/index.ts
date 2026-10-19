import * as cheerio from "cheerio"
import { mkdir, readFile, writeFile} from "node:fs/promises";
import { join } from "node:path"; 

//the above tools imimorted are need ed to create acache directory

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

    const response = await fetch(productUrl, {
    headers: { "User-Agent": userAgentidentifier },
    signal: AbortSignal.timeout(10000)
});
   if (response.status !== 200) {
       throw new Error(`Request failed for book ${bookNumber}: ${response.status}`);
   }
   const html = await response.text();

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
2
    try {
        const html = await readFile(cacheFilePath, "utf-8");
        console.log(`CACHE HIT: page ${pageNumber}`);
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

    const response = await fetch(pageUrl, {
        headers: {
            "User-Agent": userAgentidentifier
        },
        signal: AbortSignal.timeout(10000)
    });

    if (response.status !== 200) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const html = await response.text();

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

for(let index = 0; index<uniqueBookLinks.length;index++){
    const productUrl = uniqueBookLinks[index]
    const bookNumber = index+1
    const { html, fetchedAt } = await getBookPageHtml(productUrl, bookNumber);

    const details = extractBookDetails(html, productUrl)

    const sourcePage = sourcePageByBookUrl.get(productUrl) ?? null;
    rawRecords.push({
    ...details,
    source_page: sourcePage,
    fetched_at: fetchedAt
});

}


console.log(`detail_pages=${rawRecords.length}`);
console.log("First complete raw record:");
console.log(rawRecords[0]);

console.log(`detail_pages=${rawRecords.length}`);