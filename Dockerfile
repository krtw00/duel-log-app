FROM node:24-slim

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app
