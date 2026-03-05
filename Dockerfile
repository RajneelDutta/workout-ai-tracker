FROM node:22-alpine

RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile
RUN npm install -g node-gyp && cd node_modules/better-sqlite3 && node-gyp rebuild

# Copy source and build
COPY . .
RUN pnpm build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/index.js"]
