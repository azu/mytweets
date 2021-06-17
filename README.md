# mytweets

Search My all tweets.

![Img](./docs/img.png)

## Features

- Allow importing Archive of [your twitter archive data](https://help.twitter.com/managing-your-account/accessing-your-twitter-data)
   - It means that this app support to search your all twitter history
- Fetch the latest tweets via Twitter API and merge with your history
   - Also, it can be automated
- Support Full text search on to all your tweets
   - [S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html) based full text search
   - You can create private search engine for you

## Usage

1. Click [Use this template](https://github.com/azu/mytweets/generate) and forked repository
   - You can select Public or Private
2. git clone the forked repository

```shell
git clone https://github.com/you/mytweets
cd mytweets
```

This application require following tokens:

- Twitter API token
- S3 Access keys
- S3 buckets for saving tweets.json

You need to put these to `.env` file.

```shell
cp .env.example .env
```

### Twitter

1. Create [Twitter V2 API Client](https://developer.twitter.com/en/portal/dashboard)
2. Get API key, API Key Secret, Acceess Token, Access Token Secret
3. Put these to `.env` file

```
S3_AWS_ACCESS_KEY_ID="x"
S3_AWS_SECRET_ACCESS_KEY="x"
S3_BUCKET_NAME="x"
TWITTER_APP_KEY="YOUR_TWITTER_API_KEY"
TWITTER_APP_SECRET="YOUR_TWITTER_API_KEY_SECRET"
TWITTER_ACCESS_TOKEN="YOUR_TWITTER_ACCESS_TOKEN"
TWITTER_ACCESS_SECRET="YOUR_TWITTER_ACCESS_TOKEN_SECRET"
```

### S3

1. Create S3 bucket for saving your tweets.
2. Create API key on [AWS IAM](https://console.aws.amazon.com/iam/home?region=us-east-1#/users)
    - This API key require GET,PUT,List permissions for S3

Example Permission policies:

:memo: `YOUR_S3_BUCKET_NAME` is the bucket name of Step 1

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "mytweets",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::YOUR_S3_BUCKET_NAME/*"
        }
    ]
}
```

3. Put the API token and S3 bucket name to `.env` file

```shell
S3_AWS_ACCESS_KEY_ID="x"
S3_AWS_SECRET_ACCESS_KEY="x"
S3_BUCKET_NAME="x"
TWITTER_APP_KEY="YOUR_TWITTER_API_KEY"
TWITTER_APP_SECRET="YOUR_TWITTER_API_KEY_SECRET"
TWITTER_ACCESS_TOKEN="YOUR_TWITTER_ACCESS_TOKEN"
TWITTER_ACCESS_SECRET="YOUR_TWITTER_ACCESS_TOKEN_SECRET"
```

### Import from Twitter archive

1. Request [your Twitter archive](https://help.twitter.com/en/managing-your-account/how-to-download-your-twitter-archive)
2. Download Twitter archive file like `twitter-*.zip`
3. Copy `tweeet*.js` to `twitter-archives/`

```
twitter-archives/
├── tweet.js
├── tweet-part1.js
└── tweet-part2.js
```

4. Run import commands:
   
```
yarn install
yarn import-twitter-archives # Concvert twitter-archives
yarn fetch-tweets  # Fetch diffs via Twitter API
yarn upload-tweets # upload to S3
```

### Fetch the latest tweets and merge

> Require: `TWITTER_*` and `S3_*` env in `.env` file

Fetch the latest tweets from your Twitter account using Twitter API.

`yarn fetch-tweets` command fetch tweets and merge it into `tweets.json`.
`yarn upload-tweets` upload the `tweets.json` to your S3 bucket.

```
yarn install
yarn fetch-tweets  # Fetch diffs via Twitter API
yarn upload-tweets # upload to S3
```

### Deploy Website

> Require: `serverless` command and AWS Credentials

If you do not have `serverless` command, please see following document and setup.

- [Serverless Framework - AWS Lambda Guide - Installing The Serverless Framework](https://www.serverless.com/framework/docs/providers/aws/guide/installation/)
- [Serverless Framework - AWS Lambda Guide - Credentials](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

Run following command that deploy your website to Cloudfront and S3.

```
npm install --global serverless
# deploy
cd web/
yarn install
sls deploy
# after it, cloudfront url shown
```

## Tips

### Schedule Updating

You can automate `yarn fetch-tweets` and `yarn upload-tweets` using CI like GitHub Action.

This template repository includes [.github/workflows/update.yml](.github/workflows/update.yml) that update your `tweets.json` daily.

1. Visit your fork repository's setting `https://github.com/owner/mytweets/settings/secrets/actions`
2. Put following env to Action's secrets
    - `S3_AWS_ACCESS_KEY_ID`
    - `S3_AWS_SECRET_ACCESS_KEY`
    - `S3_BUCKET_NAME`
    - `TWITTER_APP_KEY`
    - `TWITTER_APP_SECRET`
    - `TWITTER_ACCESS_TOKEN`
    - `TWITTER_ACCESS_SECRET`

These value is same to `.env`.

![secrets options](img/secrets.png)

### Private Page

You can implement Basic Auth using [CloudFront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html).

- [CloudFront + S3 + CloudFront Functions で BASIC 認証をかける](https://zenn.dev/mallowlabs/articles/cloudfront-functions-basic-auth)

## Changelog

See [Releases page](https://github.com/azu/mytweets/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/mytweets/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- azu: [GitHub](https://github.com/azu), [Twitter](https://twitter.com/azu_re)

## License

MIT © azu
