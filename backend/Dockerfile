FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --production

COPY . ./
RUN mkdir -p data

EXPOSE 5000

CMD ["node", "server.js"]
