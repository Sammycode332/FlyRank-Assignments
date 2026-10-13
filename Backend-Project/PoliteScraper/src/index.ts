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
async function getPageHtml(
    pageUrl: string,
    pageNumber: number
): Promise<string> {
    const cacheFilePath = getCacheFilePath(pageNumber);

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

let currentPageUrl: string | null = CatalogueURL

let cataloguePages= 0;
const allBookLinks: string[] = []
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
    cataloguePages++;
    currentPageUrl = catalogue.nextPageUrl
}
const uniqueBookLinks = [...new Set(allBookLinks)]
console.log(`catalogue_pages=${cataloguePages}`);
console.log(`discovered=${allBookLinks.length}`);
console.log(`unique_urls=${uniqueBookLinks.length}`);