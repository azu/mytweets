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
    return (
        s
            .split("'")
            .join("''")
            // workaround: S3 Select can not select < and >
            .replace(/</g, "_")
            .replace(/>/g, "_")
    );
};

export const fetchS3Select = async ({
    query,
    max,
    afterTimestamp
}: {
    query: string;
    max: number;
    afterTimestamp?: number;
}) => {
    const queries = query
        .split(/\s+/)
        .map((query) => query.trim())
        .filter((query) => query.length > 0);
    const WHERE = (() => {
        const queryWhereStatement = queries
            .map((query) => {
                return `lower(s.text) like '${escapeLike("%" + query.toLowerCase() + "%")}'`;
            })
            .join(" AND ");
        const pagingWhereStatement =
            afterTimestamp !== undefined && !Number.isNaN(afterTimestamp) ? `s."timestamp" < ${afterTimestamp}` : "";
        return [queryWhereStatement, pagingWhereStatement].filter((statement) => statement.length > 0).join(" AND ");
    })();
    const LIMIT = max;
    const S3Query = WHERE
        ? `SELECT * FROM s3object s WHERE ${WHERE} LIMIT ${LIMIT}`
        : `SELECT * FROM s3object s LIMIT ${LIMIT}`;
    console.log(S3Query);
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
    // Payload will be split by byte
    // We need to concat these as buffer
    // https://dev.classmethod.jp/articles/python-s3-select-decode-last/
    let buffer = Buffer.alloc(0);
    let stats: StatsEvent["Details"] = null;
    for await (const event of events) {
        if (typeof event === "string") {
            // skip
        } else if (typeof event === "object" && "Records" in event && event.Records && event.Records.Payload) {
            buffer = Buffer.concat([buffer, event.Records.Payload]);
        } else if ("Stats" in event) {
            stats = event.Stats.Details;
        }
    }
    const lineObjects = buffer
        .toString()
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
    return {
        stats,
        responses
    };
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(400).json({ message: "invalid request" });
    }
    const query = req.query.q;
    const max = req.query.max ? Number(req.query.max) : 20;
    const afterTimestamp = req.query.afterTimestamp ? Number(req.query.afterTimestamp) : undefined;
    if (typeof query !== "string") {
        return res.write("?q= should be string");
    }
    if (typeof max !== "number") {
        return res.write("?max= should be number");
    }
    const { stats, responses } = await fetchS3Select({ query, max, afterTimestamp });
    res.json({
        stats,
        results: responses
    });
}
