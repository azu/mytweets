import { TwitterApi } from "twitter-api-v2";
import firstline from "firstline";
import * as url from "url";
import path from "path";
import type { LineTweet } from "./types/output";
import { TweetUserTimelineV2Paginator } from "twitter-api-v2";
import { convertAPIToLineTweet } from "./utils/converter.js";
import * as fs from "fs/promises";
import { config } from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config();

export const collectTweetsUntil = async (
    timeline: TweetUserTimelineV2Paginator,
    lastTweet: LineTweet
): Promise<LineTweet[]> => {
    const results: LineTweet[] = [];
    try {
        for await (const tweet of timeline) {
            if (lastTweet.id === tweet.id) {
                return results;
            }
            const tweetTimeStamp = new Date(tweet.created_at!).getTime();
            if (lastTweet.timestamp < tweetTimeStamp) {
                results.push(convertAPIToLineTweet(tweet));
            } else {
                return results;
            }
        }
    } catch (error) {
        console.log("collect error", error);
    }
    return results;
};

/**
 *
 * @param tweetsJsonFilePath merge filePath
 */
export async function fetchTweets(tweetsJsonFilePath: string) {
    await fs.mkdir(path.dirname(tweetsJsonFilePath), {
        recursive: true
    });
    const lastTweets = await firstline(tweetsJsonFilePath);
    const lastTweet: LineTweet = JSON.parse(lastTweets);
    console.log("lastTweet", lastTweet);
    const client = new TwitterApi({
        appKey: process.env.TWITTER_APP_KEY!,
        appSecret: process.env.TWITTER_APP_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessSecret: process.env.TWITTER_ACCESS_SECRET!
    }).readOnly;
    const currentUser = await client.currentUser();
    const timeline = await client.v2.userTimeline(String(currentUser.id), {
        max_results: 100,
        "tweet.fields": ["created_at", "entities"]
    });
    const tweets = await collectTweetsUntil(timeline, lastTweet);
    const sortedTweets = tweets.sort((a, b) => {
        return a.timestamp > b.timestamp ? -1 : 1;
    });
    try {
        const restTweets = await fs.readFile(tweetsJsonFilePath, "utf-8");
        const newLines =
            sortedTweets.length > 0 ? sortedTweets.map((result) => JSON.stringify(result)).join("\n") + "\n" : "";
        await fs.writeFile(tweetsJsonFilePath, newLines + restTweets, {
            encoding: "utf-8"
        });
        console.log(`Added ${sortedTweets.length} tweets`);
    } catch (error) {
        await fs.writeFile(tweetsJsonFilePath, sortedTweets.map((result) => JSON.stringify(result)).join("\n"), {
            encoding: "utf-8"
        });
        console.log("Can not append. Instead of it, create new tweeets.json", error);
    }
}

const selfScriptFilePath = url.fileURLToPath(import.meta.url);
if (process.argv[1] === selfScriptFilePath) {
    const dataDir = path.join(__dirname, "../data");
    const tweetsJsonFilePath = path.join(dataDir, "tweets.json");
    fetchTweets(tweetsJsonFilePath).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
