FROM node:20.18 AS base

RUN npm i -g pnpm

FROM base AS dependencies 

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

FROM base AS build

WORKDIR /usr/src/app

COPY . .
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

RUN pnpm build
RUN pnpm prune --prod

FROM node:20-alpine3.21 AS deploy

USER 1000

WORKDIR /usr/src

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json

ENV CLOUDFLARE_ACCOUNT_ID="string"
ENV CLOUDFLARE_ACCESS_KEY_ID="string"
ENV CLOUDFLARE_SECRET_ACCESS_KEY="string"
ENV CLOUDFLARE_BUCKET="string"
ENV CLOUDFLARE_PUBLIC_URL="http://localhost"
ENV DATABASE_URL="postgresql://docker:docker@localhost:5432/upload"

EXPOSE 3333

CMD ["node", "dist/infra/http/server.js"]