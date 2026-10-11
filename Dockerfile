# Stage 1: Build frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY backend ./backend
COPY --from=builder /app/dist ./dist
RUN mkdir -p data

EXPOSE 5000

CMD ["node", "--no-warnings=ExperimentalWarning", "server.js"]
