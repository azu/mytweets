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
    const s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        credentials: new AWS.Credentials({
            accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!
        })
    });
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

export async function uploadTweets(tweetsJsonFilePath: string) {
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
        throw new Error("S3_BUCKET_NAME should be set!");
    }
    const { writeStream, promise } = uploadStream({
        Bucket: bucket,
        Key: "tweets.json.gz"
    });
    // just upload if .gz exists
    const tweetsJsonFilePathGzip = tweetsJsonFilePath + ".gz";
    if (fs.existsSync(tweetsJsonFilePathGzip)) {
        console.log("update gzip file");
        fs.createReadStream(tweetsJsonFilePathGzip)
            .pipe(writeStream)
            .on("error", (error) => {
                console.error(error);
            });
        return await promise;
    }
    console.log("update file with compressing");
    fs.createReadStream(tweetsJsonFilePath)
        .pipe(zlib.createGzip())
        .pipe(writeStream)
        .on("error", (error) => {
            console.error(error);
        });
    return await promise;
}

const selfScriptFilePath = url.fileURLToPath(import.meta.url);
if (process.argv[1] === selfScriptFilePath) {
    const dataDir = path.join(__dirname, "../data");
    const tweetsJsonFilePath = path.join(dataDir, "tweets.json");
    uploadTweets(tweetsJsonFilePath).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
