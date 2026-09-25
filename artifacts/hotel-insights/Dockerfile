FROM node:22-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile --prod=false

ENV NODE_ENV=production
ENV PORT=5173
ENV BASE_PATH=/

RUN pnpm --filter @workspace/hotel-insights build


FROM nginx:alpine

COPY --from=build /app/artifacts/hotel-insights/dist/public /usr/share/nginx/html
COPY artifacts/hotel-insights/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]