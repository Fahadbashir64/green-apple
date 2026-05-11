FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY db ./db
COPY scripts ./scripts
COPY src ./src

RUN mkdir -p uploads && chown -R node:node uploads

USER node

EXPOSE 4000

CMD ["node", "src/index.js"]
