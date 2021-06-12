import twitter from "twitter-text";
import aws from "aws-sdk";
import type { StatsEvent } from "aws-sdk/clients/s3";

const S3 = new aws.S3({
    apiVersion: "2006-03-01",
    credentials: new aws.Credentials({
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY
    })
});
export type SearchQuery = {
    q: string;
    max?: string;
};
export type SearchResponse = {
    stats: StatsEvent["Details"];
    results: LineTweetResponse[];
};

export type LineTweetResponse = {
    id: string;
    html: string;
    timestamp: number;
};
const escapeLike = (s: string) => {
    return s.split("'").join("''");
};
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(400).json({ message: "invalid request" });
    }
    const query = req.query.q;
    const max = req.query.max ? Number(req.query.max) : 100;
    if (typeof query !== "string") {
        return res.write("No Content");
    }
    const queries = query.split(/\s+/).filter((query) => query.length > 0);
    const WHERE = queries
        .map((query) => {
            return `lower(s.text) like '${escapeLike("%" + query.toLowerCase() + "%")}'`;
        })
        .join(" AND ");
    const LIMIT = 30;
    const S3Query = WHERE
        ? `SELECT * FROM s3object s WHERE ${WHERE} LIMIT ${LIMIT}`
        : `SELECT * FROM s3object s LIMIT ${LIMIT}`;
    console.log("bucket", process.env.S3_BUCKET_NAME);
    console.log(query);
    const result = await S3.selectObjectContent({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: "tweets.json.gz",
        InputSerialization: {
            JSON: {
                Type: "LINES"
            },
            CompressionType: "GZIP"
        },
        OutputSerialization: {
            JSON: {
                RecordDelimiter: "\n"
            }
        },
        ExpressionType: "SQL",
        Expression: S3Query
    }).promise();
    const events = result.Payload;
    let text = "";
    let stats: StatsEvent["Details"] = null;
    for await (const event of events) {
        if (typeof event === "string") {
            text += event;
        } else if ("Records" in event && event.Records) {
            text += event.Records.Payload.toString();
        } else if ("Stats" in event) {
            stats = event.Stats.Details;
        }
    }
    const lineObjects = text
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line));
    const responses: LineTweetResponse[] = lineObjects.map((lineObject) => {
        return {
            id: lineObject.id,
            html: twitter.autoLink(twitter.htmlEscape(lineObject.text)),
            timestamp: lineObject.timestamp
        };
    });
    res.json({
        stats,
        results: responses
    });
}
