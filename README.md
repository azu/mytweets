# mytweets

Search My all tweets.

## Features

- Imports Archive of your data
- Fetch the latest tweets via Twitter API
- Full text search on to all your tweets

## Usage

## Setups

This application require following tokens:

- Twitter API token
- S3 Access keys
- S3 buckets for saving tweets.json

### Twitter

### S3

- Fill `S3_AWS_ACCESS_KEY_ID`, `S3_AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`.
   - require GET,PUT,List permissions for S3
   - `S3_BUCKET_NAME` is any name

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

1. Get API_KEY, API_KEY_SECRETE, ACCESS_KEY, ACCESS_KEY_SECRETS
2. `cp .env.example .env`, and fill it
3. Run following command:

```
yarn install
yarn fetch-tweets  # Fetch diffs via Twitter API
yarn upload-tweets # upload to S3
```

### Deploy Website

Require [The Serverless Application Framework | Serverless.com](https://www.serverless.com/).

```
npm install --global serverless
cd web/
yarn install
sls deploy
```

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
