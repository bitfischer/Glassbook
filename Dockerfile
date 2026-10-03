FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 DATA_DIR=/data BODY_SIZE_LIMIT=1G
WORKDIR /app
RUN mkdir -p /data && chown node:node /data
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/src/lib/server/image-derivatives.ts ./src/lib/server/image-derivatives.ts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "build"]
