import { S3, SelectObjectContentCommand } from "@aws-sdk/client-s3";
import type { StatsEvent } from "@aws-sdk/client-s3";

const htmlEscape = (text: string) => {
    // @ts-expect-error
    return text.replace(/[&"'><]/g, (match: string) => {
        return {
            "&": "&amp;",
            '"': "&quot;",
            ">": "&gt;",
            "<": "&lt;",
            "'": "&#39;"
        }[match];
    });
};
const autoLink = (text: string) => {
    return text.replace(/(https?:\/\/\S+)/g, "<a href='$1'>$1</a>");
};
export const runtime = "edge"; // 'nodejs' is the default
const assertEnv = () => {
    // if does not exist, throw error
    const envs = ["S3_BUCKET_NAME", "S3_AWS_REGION", "S3_AWS_ACCESS_KEY_ID", "S3_AWS_SECRET_ACCESS_KEY"];
    envs.forEach((env) => {
        if (!process.env[env]) {
            throw new Error(`process.env.${env} is not defined`);
        }
    });
};
const s3 = new S3({
    apiVersion: "2006-03-01",
    region: process.env.S3_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!
    }
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

export type FetchS3SelectResult = { results: LineTweetResponse[]; stats: StatsEvent["Details"] };
export const fetchS3Select = async ({
    query,
    max,
    afterTimestamp
}: {
    query: string;
    max: number;
    afterTimestamp?: number;
}): Promise<FetchS3SelectResult> => {
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
    const command = new SelectObjectContentCommand({
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
    });
    const result = await s3.send(command).catch((error) => {
        console.error(error);
        console.error("s3 error details", error.$response);
        throw error;
    });
    // error handling for S3 Select
    if (!result.Payload) {
        throw new Error("No Payload");
    }
    const events = result.Payload;
    // Payload will be split by byte
    // We need to concat these as buffer
    // https://dev.classmethod.jp/articles/python-s3-select-decode-last/
    let buffer = Buffer.alloc(0);
    let stats: StatsEvent["Details"] | undefined;
    const results: LineTweetResponse[] = [];
    for await (const event of events) {
        if (typeof event === "string") {
            // skip
        } else if (typeof event === "object" && "Records" in event && event.Records && event.Records.Payload) {
            buffer = Buffer.concat([buffer, event.Records.Payload]);
        } else if ("Stats" in event) {
            stats = event.Stats?.Details;
        }
    }
    const lineObjects = buffer
        .toString()
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => {
            const json = JSON.parse(line);
            return {
                id: json.id,
                html: autoLink(htmlEscape(json.text)),
                timestamp: json.timestamp
            };
        });
    results.push(...lineObjects);
    return { results, stats };
};
