import { ArchiveTweet, URL } from "../types/archieves";
import { LineTweet } from "../../src/types";

function replaceRange({
    text,
    start,
    end,
    substitute
}: {
    text: string;
    start: number;
    end: number;
    substitute: string;
}) {
    return text.substring(0, start) + substitute + text.substring(end);
}

const rewriteTextWithUrls = (text: string, urls: URL[] = []): string => {
    if (urls.length === 0) {
        return text;
    }
    let result = text;
    urls.forEach((url) => {
        result = replaceRange({
            text: result,
            start: Number(url.indices[0]),
            end: Number(url.indices[1]),
            substitute: url.expanded_url
        });
    });
    return result;
};
export const convertToLineTweet = (tweet: ArchiveTweet): LineTweet => {
    return {
        id: tweet.id,
        text: rewriteTextWithUrls(tweet.full_text, tweet?.entities?.urls),
        timestamp: new Date(tweet.created_at).getTime()
    };
};
