FROM node:18-slim AS base

ENV TZ="Asia/Shanghai"

WORKDIR /app

COPY .output /app/.output

EXPOSE 3000

CMD ["node", "/app/.output/server/index.mjs"]

MAINTAINER besscroft
