# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend

COPY backend ./backend
RUN npm --prefix backend run build

COPY db ./db
COPY scripts/apply-schema.mjs ./scripts/apply-schema.mjs

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/db ./db
COPY --from=build /app/scripts/apply-schema.mjs ./scripts/apply-schema.mjs

USER node
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
