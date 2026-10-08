FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend ./backend
RUN mkdir -p data

EXPOSE 5000

CMD ["node", "--no-warnings=ExperimentalWarning", "backend/server.js"]

