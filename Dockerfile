FROM node:20.18 AS base

RUN npm i -g pnpm

FROM base AS dependencies 

WORKDIR /usr/src

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

FROM base AS build

WORKDIR /usr/src

COPY . .
COPY --from=dependencies /usr/src/node_modules ./node_modules

RUN pnpm build
RUN pnpm prune --prod

FROM gcr.io/distroless/nodejs22-debian13 AS deploy

USER 1000

WORKDIR /usr/src

COPY --from=build /usr/src/dist ./dist
COPY --from=build /usr/src/node_modules ./node_modules
COPY --from=build /usr/src/package.json ./package.json

EXPOSE 3333

CMD ["dist/infra/http/server.js"]
