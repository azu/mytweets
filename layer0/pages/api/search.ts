import nc from "next-connect";
import memoize from "micro-memoize";
import regexCombiner from "regex-combiner";
import twitter from "twitter-text";
import split2 from "split2";
import * as fs from "fs";

export type SearchQuery = {
    q: string;
};
export type BookmarkItem = {
    title: string;
    url: string;
    date: string;
    content: string;
    tags: string[];
    relatedLinks?: {
        title: string;
        url: string;
    }[];
};
export type LineTweet = {
    id: string;
    text: string;
    timestamp: number;
};

export type LineTweetResponse = {
    type: "tweet";
    id: string;
    html: string;
    timestamp: number;
};
export type SearchCountResponse = {
    type: "count";
    progress: number;
    total: number;
};
export type SearchResponse = SearchCountResponse | LineTweetResponse;
const stringifyBookmarkItem = (tweet: LineTweet): string => {
    return tweet.text.toLowerCase();
};

const memoriezdRegexCombiner = memoize((searchWord: string[]) => {
    // @ts-ignore
    const pattern = regexCombiner(searchWord);
    return new RegExp(pattern.source, "i");
});
export const matchText = (lineText: string, searchWords: string[]): boolean => {
    const text = lineText;
    const combined = memoriezdRegexCombiner(searchWords);
    return combined.test(text);
};
const handler = nc().get<{
    query: SearchQuery;
}>((req, res) => {
    const query = req.query.q;
    if (typeof query !== "string") {
        throw new Error("invalid ?q=");
    }
    const queries = query.split(/\s+/);
    if (queries.length === 0) {
        return res.end(
            JSON.stringify({
                results: []
            })
        );
    }
    const inputStream = fs.createReadStream("./tweets.json", {
        encoding: "utf-8"
    });
    const searchResults = [];
    let count = 0;
    const send = (response: SearchResponse): void => {
        res.write(JSON.stringify(response) + "\n"); // line by line
    };
    inputStream
        .pipe(split2())
        .on("data", (line) => {
            count++;
            if (count >= 30) {
                inputStream.destroy();
                return;
            }
            const isMatch = matchText(line, queries);
            if (isMatch) {
                try {
                    const item = JSON.parse(line);
                    const responseItem: LineTweetResponse = {
                        type: "tweet",
                        id: item.id,
                        timestamp: item.timestamp,
                        html: twitter.autoLink(twitter.htmlEscape(item.text))
                    };
                    searchResults.push(responseItem);
                    send(responseItem);
                } catch (error) {
                    console.log(line);
                    console.log(error);
                }
            }
            if (count % 1000 === 0) {
                console.log(count);
                send({
                    type: "count",
                    progress: count,
                    total: 0
                });
            }
        })
        .on("end", () => {
            res.end();
        });
});
export default handler;
