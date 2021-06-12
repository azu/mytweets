import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SearchKeywordResponse } from "./types/archieves.js";
import { convertArchieveToLineTweet } from "./utils/converter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const rootDir = path.join(__dirname, "../twitter-archives");
    const outputDir = path.join(__dirname, "../data");
    const outputFilePath = path.join(outputDir, "/tweets.json");
    const outputRFilePath = path.join(outputDir, "/tweets-r.json");
    const outputStatFilePath = path.join(outputDir, "/tweets-stats.json");
    const dirents = await fs.readdir(rootDir, {
        withFileTypes: true
    });
    const filePathsList = dirents
        .filter((dirent) => {
            return dirent.isFile() && dirent.name.startsWith("tweet") && path.extname(dirent.name) === ".js";
        })
        .map((dirent) => {
            return path.join(rootDir, dirent.name);
        });
    const fileContentList: SearchKeywordResponse[][] = await Promise.all(
        filePathsList.map(async (filePath) => {
            const content = await fs.readFile(filePath, "utf-8");
            const json = content.replace(/^window.YTD.tweet.part\d+\s=\s*/, "");
            return JSON.parse(json);
        })
    );
    const results = fileContentList.flatMap((content) => {
        return content.flatMap((item) => {
            return convertArchieveToLineTweet(item.tweet);
        });
    });
    const sortedResults = results.sort((a, b) => {
        return a.timestamp > b.timestamp ? 1 : -1;
    });
    await fs.writeFile(outputFilePath, sortedResults.map((result) => JSON.stringify(result)).join("\n"), "utf-8");
    // first line is latest
    await fs.writeFile(
        outputRFilePath,
        sortedResults
            .reverse()
            .map((result) => JSON.stringify(result))
            .join("\n"),
        "utf-8"
    );
    await fs.writeFile(
        outputStatFilePath,
        JSON.stringify({
            total: sortedResults.length
        }),
        "utf-8"
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
