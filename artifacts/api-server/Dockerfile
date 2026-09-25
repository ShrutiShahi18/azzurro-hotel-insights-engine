FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY lib/db/package.json lib/db/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/api-spec/package.json lib/api-spec/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json

RUN pnpm install --frozen-lockfile --prod=false --filter @workspace/api-server...

COPY artifacts/api-server artifacts/api-server
COPY lib lib

RUN pnpm --filter @workspace/api-server build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["/bin/sh", "-c", "pnpm --filter @workspace/db push && exec node --enable-source-maps artifacts/api-server/dist/index.mjs"]