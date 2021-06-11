import { convertToLineTweet } from "../scripts/utils/converter.js";
import assert from "assert";

describe("convertToLineTweet", function () {
    it("convert archive to line", () => {
        const result = convertToLineTweet({
            retweeted: false,
            source: '<a href="https://github.com/r7kamura/retro-twitter-client" rel="nofollow">Retro twitter client</a>',
            entities: {
                hashtags: [
                    {
                        text: "JavaScript",
                        indices: ["71", "82"]
                    },
                    {
                        text: "JSer",
                        indices: ["83", "88"]
                    }
                ],
                symbols: [],
                user_mentions: [],
                urls: [
                    {
                        url: "https://t.co/CXy3hOXJ8q",
                        expanded_url: "http://JSer.info",
                        display_url: "JSer.info",
                        indices: ["22", "45"]
                    },
                    {
                        url: "https://t.co/rMdfD14nYH",
                        expanded_url: "https://jser.info/",
                        display_url: "jser.info",
                        indices: ["47", "70"]
                    }
                ]
            },
            display_text_range: ["0", "88"],
            favorite_count: "2",
            id_str: "783296194701172736",
            truncated: false,
            retweet_count: "0",
            id: "783296194701172736",
            possibly_sensitive: false,
            created_at: "Tue Oct 04 13:22:20 +0000 2016",
            favorited: false,
            full_text:
                '週一更新のJavaScript情報サイト "https://t.co/CXy3hOXJ8q" https://t.co/rMdfD14nYH #JavaScript #JSer',
            lang: "ja"
        });
        assert.deepStrictEqual(result, {
            id: "783296194701172736",
            text: '週一更新のJavaScript情報サイト "http://JSer.info" https:/https://jser.info/cript #JSer',
            timestamp: 1475587340000
        });
    });
});
