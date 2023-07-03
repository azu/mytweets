import path from "path";
import fs from "fs";
import url from "url";
import AWS_S3, { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { Writable } from "stream";
// @ts-expect-error
import { DecompressionStream } from "node:stream/web";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config();
const downloadStream = async ({ Bucket, Key }: AWS_S3.PutObjectCommandInput) => {
    const s3 = new S3({
        apiVersion: "2006-03-01",
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!
        }
    });
    const readStream = await s3.send(
        new GetObjectCommand({
            Bucket,
            Key
        })
    );
    return readStream;
};

export async function downloadTweets(tweetsJsonFilePath: string) {
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
        throw new Error("S3_BUCKET_NAME should be set!");
    }
    const readStream = await downloadStream({
        Bucket: bucket,
        Key: "tweets.json.gz"
    });
    if (!readStream) {
        throw new Error("tweets.json.gz not found!");
    }
    const writeStream = fs.createWriteStream(tweetsJsonFilePath);
    const ds = new DecompressionStream("gzip");
    await readStream.Body?.transformToWebStream().pipeThrough(ds).pipeTo(Writable.toWeb(writeStream));
}

const selfScriptFilePath = url.fileURLToPath(import.meta.url);
if (process.argv[1] === selfScriptFilePath) {
    const dataDir = path.join(__dirname, "../data");
    const tweetsJsonFilePath = path.join(dataDir, "tweets.json");
    downloadTweets(tweetsJsonFilePath).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
