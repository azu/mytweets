# Web frontend

Web frontend for the mytweets.

## Develop

### Setup

1. You need to set `<projectdir>/.env` at first
    - See [Usage](../README.md#Usage) section
2. Run following commands

```bash
$ yarn install
$ yarn run local:cp:env # copy .env from ../.env
```

## Launch Server

Launch server with following command

```bash
$ yarn dev
```

## Deploy

1. Put secrets that are same as `web/.env` to hosting service like Vercel
2. Deploy "web/" directory

:warning: `NEXT_PUBLIC_AUTH_KEY` should be secret, you need to use secure random string
