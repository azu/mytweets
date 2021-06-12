import type { ArchivesURL, ArchiveTweet } from "../types/archieves";
import type { LineTweet } from "../types/output";
import type { API_URL, TweetAPIResponse } from "../types/twitter-api";

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

const rewriteTextWithUrls = (text: string, urls: ArchivesURL[] = []): string => {
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

export const convertArchieveToLineTweet = (tweet: ArchiveTweet): LineTweet => {
    return {
        id: tweet.id,
        text: rewriteTextWithUrls(tweet.full_text, tweet?.entities?.urls),
        timestamp: new Date(tweet.created_at).getTime()
    };
};

const rewriteTextWithAPIUrls = (text: string, urls: API_URL[] = []): string => {
    if (urls.length === 0) {
        return text;
    }
    let result = text;
    urls.forEach((url) => {
        result = replaceRange({
            text: result,
            start: Number(url.start),
            end: Number(url.end),
            substitute: url.expanded_url
        });
    });
    return result;
};

export const convertAPIToLineTweet = (tweet: TweetAPIResponse): LineTweet => {
    return {
        id: tweet.id,
        text: rewriteTextWithAPIUrls(tweet.text, tweet?.entities?.urls),
        timestamp: new Date(tweet.created_at!).getTime()
    };
};
