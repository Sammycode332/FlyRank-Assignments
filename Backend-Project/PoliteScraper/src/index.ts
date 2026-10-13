import { mkdir, readFile, writeFile,access } from "node:fs/promises";
import { join } from "node:path"; 

//the above tools imimorted are need ed to create acache directory

const CatalogueURL: string = "https://books.toscrape.com/"

const CacheDirectory: string= "cache"
const CacheFilename:string= "catalogue-page-1.html"
const userAgentidentifier: string = "PoliteScraper/1.0 (https://github.com/Sammycode332/FlyRank-Assignments/tree/main/Backend-Project/PoliteScraper)"

const cacheFilePath: string = join(CacheDirectory,CacheFilename)

try{
    //await access(cacheFilePath);
    const html = await readFile(cacheFilePath, "utf-8");
    console.log("CACHE HIT");
    console.log(`HTML size: ${new TextEncoder().encode(html).byteLength} bytes`);
     
} catch(error){
    if(
        typeof error === "object" && 
        error !== null &&
        "code" in error &&
        error.code !== "ENOENT"
    ){
        throw error
    }
    console.log("CACHE MISS")
    await mkdir(CacheDirectory, { recursive: true });
    const response = await fetch(CatalogueURL,{
    headers:{
        "User-Agent": userAgentidentifier
    },
    signal:AbortSignal.timeout(10000)
})
    if(response.status !== 200){
    throw new Error(`Request failed: ${response.status}`);
}
    const html = await response.text();

    await writeFile(cacheFilePath,html,"utf-8")

    console.log("FETCH")
    console.log(
        `HTML size: ${new TextEncoder().encode(html).byteLength} bytes`
    )
}



