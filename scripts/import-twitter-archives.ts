import fs from "fs/promises";
import path from "path";
import * as url from "url";
import { fileURLToPath } from "url";
import { SearchKeywordResponse } from "./types/archieves.js";
import { convertArchieveToLineTweet } from "./utils/converter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// import archives
// 1. import twitter-archives/tweet*.json → data/tweet.json
export async function importArchives(tweetsJsonFilePath: string) {
    const twitterArchivesDir = path.join(__dirname, "../twitter-archives");
    await fs.mkdir(path.dirname(tweetsJsonFilePath), {
        recursive: true
    });
    const dirents = await fs.readdir(twitterArchivesDir, {
        withFileTypes: true
    });
    const filePathsList = dirents
        .filter((dirent) => {
            return dirent.isFile() && dirent.name.startsWith("tweet") && path.extname(dirent.name) === ".js";
        })
        .map((dirent) => {
            return path.join(twitterArchivesDir, dirent.name);
        });
    const fileContentList: SearchKeywordResponse[][] = await Promise.all(
        filePathsList.map(async (filePath) => {
            const content = await fs.readFile(filePath, "utf-8");
            const json = content.replace(/^window.YTD.tweet.part\d+\s=\s*/, "");
            return JSON.parse(json);
        })
    );
    const uniqueIdSet = new Set<string>();
    const results = fileContentList.flatMap((content) => {
        return content.flatMap((item) => {
            if (uniqueIdSet.has(item.tweet.id)) {
                return [];
            }
            uniqueIdSet.add(item.tweet.id);
            return convertArchieveToLineTweet(item.tweet);
        });
    });
    const sortedResults = results.sort((a, b) => {
        return a.timestamp > b.timestamp ? 1 : -1;
    });
    // await fs.writeFile(outputFilePath, sortedResults.map((result) => JSON.stringify(result)).join("\n"), "utf-8");
    // first line is latest
    await fs.writeFile(
        tweetsJsonFilePath,
        sortedResults
            .reverse()
            .map((result) => JSON.stringify(result))
            .join("\n"),
        "utf-8"
    );
}

const selfScriptFilePath = url.fileURLToPath(import.meta.url);
if (process.argv[1] === selfScriptFilePath) {
    const dataDir = path.join(__dirname, "../data");
    const tweetsJsonFilePath = path.join(dataDir, "tweets.json");
    importArchives(tweetsJsonFilePath).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
