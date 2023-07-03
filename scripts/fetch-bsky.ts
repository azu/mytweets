import * as pkg from "@atproto/api";
import { AppBskyFeedGetAuthorFeed } from "@atproto/api";
import firstline from "firstline";
import * as url from "url";
import path from "path";
import type { LineTweet } from "./types/output";
import * as fs from "fs/promises";
import { config } from "dotenv";
import { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

// Issue: https://github.com/bluesky-social/atproto/issues/910
const BskyAgent = (pkg as any).default.BskyAgent as typeof pkg.BskyAgent;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config();

export const convertPostToLineTweet = (post: PostView): LineTweet => {
    const record = post.record as { text?: string };
    if (typeof record.text !== "string") {
        throw new Error("post.record.text is not string");
    }
    return {
        // at://did:plc:niluiwex7fsnjak2wxs4j47y/app.bsky.feed.post/3jz3xglxhzu27@@azu.bsky.social
        id: post.uri,
        text: record.text,
        timestamp: new Date(post.indexedAt).getTime()
    };
};

type Feed = AppBskyFeedGetAuthorFeed.Response["data"]["feed"];
export const collectTweetsUntil = async (timeline: Feed, lastTweet: LineTweet): Promise<LineTweet[]> => {
    const results: LineTweet[] = [];
    try {
        for await (const tweet of timeline) {
            if (lastTweet.id === tweet.id) {
                return results;
            }
            const tweetTimeStamp = new Date(tweet.post.indexedAt).getTime();
            if (lastTweet.timestamp < tweetTimeStamp) {
                results.push(convertPostToLineTweet(tweet.post));
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
    const agent = new BskyAgent({
        service: "https://bsky.social"
    });
    if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_APPPASSWORD) {
        throw new Error("process.env.BLUESKY_IDENTIFIER or process.env.BLUESKY_APPPASSWORD is not defined");
    }
    await agent.login({
        identifier: process.env.BLUESKY_IDENTIFIER,
        password: process.env.BLUESKY_APPPASSWORD
    });

    type FetchAuthorFeedParams = {
        actor: string;
        feed: Feed;
        cursor?: string;
    };
    // collect feed 100 * 10
    const fetchAuthorFeed = async ({ actor, feed, cursor }: FetchAuthorFeedParams): Promise<Feed> => {
        if (feed.length >= 1000) {
            return feed;
        }
        const timeline = await agent.getAuthorFeed({
            actor,
            limit: 100,
            cursor
        });
        if (timeline.success) {
            if (timeline.data.cursor) {
                return fetchAuthorFeed({
                    actor: actor,
                    feed: [...feed, ...timeline.data.feed],
                    cursor: timeline.data.cursor
                });
            } else {
                return [...feed, ...timeline.data.feed];
            }
        } else {
            throw new Error("timeline fetch error:" + JSON.stringify(timeline.data));
        }
    };
    const feed = await fetchAuthorFeed({
        actor: process.env.BLUESKY_IDENTIFIER,
        feed: []
    });
    const tweets = await collectTweetsUntil(feed, lastTweet);
    const sortedTweets = tweets.sort((a, b) => {
        return a.timestamp > b.timestamp ? -1 : 1;
    });
    // console.log(JSON.stringify(sortedTweets, null, 4));
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
