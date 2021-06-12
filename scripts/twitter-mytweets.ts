import { TwitterApi } from "twitter-api-v2";
import firstline from "firstline";
import * as url from "url";
import path from "path";
import type { LineTweet } from "../src/types";
import { TweetUserTimelineV2Paginator } from "twitter-api-v2/dist/paginators";
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

async function main() {
    const outputDir = path.join(__dirname, "../data");
    const tweetsJSONFilePath = path.join(outputDir, "/tweets-r.json");
    const lastTweets = await firstline(tweetsJSONFilePath);
    const lastTweet: LineTweet = JSON.parse(lastTweets);
    console.log("lastTweet", lastTweet);
    const client = new TwitterApi({
        appKey: process.env.TWITTER_APP_KEY!,
        appSecret: process.env.TWITTER_APP_SECRET!,
        accessToken: process.env.TWITTER_ACCESSTOKEN!,
        accessSecret: process.env.TWITTER_ACCESSSECRET!
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
    const restTweets = await fs.readFile(tweetsJSONFilePath, "utf-8");
    await fs.writeFile(
        tweetsJSONFilePath,
        sortedTweets.map((result) => JSON.stringify(result)).join("\n") + restTweets,
        {
            encoding: "utf-8"
        }
    );
    console.log(`Added ${sortedTweets.length} tweets`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
