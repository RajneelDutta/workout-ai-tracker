FROM node:22-alpine

RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/index.js"]
