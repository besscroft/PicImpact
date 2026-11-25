FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/v3/package.json apps/v3/package.json
RUN pnpm install --frozen-lockfile --filter @picimpact/web...

COPY . .
RUN pnpm --filter @picimpact/web build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/web/package.json apps/web/package.json
RUN pnpm install --prod --frozen-lockfile --filter @picimpact/web...
COPY --from=build /app/apps/web/dist apps/web/dist

WORKDIR /app/apps/web
EXPOSE 8787
CMD ["pnpm", "start"]
