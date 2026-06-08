FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile=false
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
