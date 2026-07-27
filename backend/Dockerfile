# Build from the PROJECT ROOT so this can reach the sibling web/ folder:
#   docker build -f backend/Dockerfile -t crushai-backend .

FROM node:20-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/. .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY backend/migrations ./migrations
# The compiled server serves web/ as static files from ../../web relative to dist/index.js,
# i.e. a sibling of this WORKDIR — see src/index.ts.
COPY web /web

EXPOSE 4000
CMD ["node", "dist/index.js"]
