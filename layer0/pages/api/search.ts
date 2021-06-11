import nc from "next-connect";
import memoize from "micro-memoize";
import regexCombiner from "regex-combiner";
import twitter from "twitter-text";
import split2 from "split2";
import * as fs from "fs";
import getConfig from "next/config";
import path from "path";
const { serverRuntimeConfig } = getConfig();

export type SearchQuery = {
    q: string;
    max?: string;
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
const memoriezdRegexCombiner = memoize((searchWord: string[]) => {
    // @ts-ignore
    const pattern = regexCombiner(searchWord);
    return new RegExp(pattern.source, "i");
});
export const matchText = (lineText: string, searchWords: string[]): boolean => {
    const text = lineText;
    const combined = memoriezdRegexCombiner(searchWords);
    return combined.test(text.toLowerCase());
};
const handler = nc().get<{
    query: SearchQuery;
}>((req, res) => {
    const query = req.query.q;
    const max = req.query.max ? Number(req.query.max) : 100;
    if (typeof query !== "string") {
        throw new Error("invalid ?q=");
    }
    const queries = query.split(/\s+/);
    const emptyQuery = queries.filter((query) => query.length > 0).length === 0;
    if (queries.length === 0) {
        return res.end(
            JSON.stringify({
                results: []
            })
        );
    }
    const stats = require("../../tweets-stats.json");
    const inputStream = fs.createReadStream(new URL("../../tweets.json", import.meta.url), {
        encoding: "utf-8"
    });
    let count = 0;
    const searchResults = [];
    const send = (response: SearchResponse): void => {
        res.write(JSON.stringify(response) + "\n"); // line by line
    };
    inputStream
        .pipe(split2())
        .on("data", (line) => {
            count++;
            if (searchResults.length >= max) {
                send({
                    type: "count",
                    progress: count,
                    total: stats.total
                });
                return inputStream.close();
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
                send({
                    type: "count",
                    progress: count,
                    total: stats.total
                });
            }
        })
        .on("end", () => {
            send({
                type: "count",
                progress: count,
                total: count
            });
            res.end();
        });
});
export default handler;
