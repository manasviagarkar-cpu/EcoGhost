# Multi-stage production build configuration

# Stage 1: Build the React client via Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY shared/ ./shared/
COPY client/ ./client/
RUN npm run build --prefix client

# Stage 2: Set up the production Express runtime
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm ci --prefix server --only=production
COPY shared/ ./shared/
COPY server/ ./server/
COPY --from=builder /app/client/dist ./server/public

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/server.js"]
