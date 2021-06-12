import path from "path";
import zlib from "zlib";
import fs from "fs";
import url from "url";
import AWS from "aws-sdk";
import stream from "stream";
import { config } from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config();
const uploadStream = ({ Bucket, Key }: AWS.S3.PutObjectRequest) => {
    const s3 = new AWS.S3();
    const pass = new stream.PassThrough();
    return {
        writeStream: pass,
        promise: s3
            .upload({
                Bucket,
                Key,
                Body: pass,
                ACL: "private",
                ContentType: "application/json",
                ContentEncoding: "gzip"
            })
            .promise()
    };
};

async function main() {
    const dataDir = path.join(__dirname, "../data");
    const tweetsJSONFilePath = path.join(dataDir, "tweets-r.json");
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
        throw new Error("S3_BUCKET_NAME should be set!");
    }
    const { writeStream, promise } = uploadStream({
        Bucket: bucket,
        Key: "tweets.json.gz"
    });
    fs.createReadStream(tweetsJSONFilePath)
        .pipe(zlib.createGzip())
        .pipe(writeStream)
        .on("error", (error) => {
            console.error(error);
        });
    await promise;
    console.log("upload success");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
