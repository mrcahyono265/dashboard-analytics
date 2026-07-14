# ── Stage 1: Build ──────────────────────────────────────────
FROM oven/bun:1.2 AS build

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .

# Generate Prisma client + build
RUN bun run db:generate
RUN bun build src/index.ts --outdir dist --target node

# ── Stage 2: Runtime ────────────────────────────────────────
FROM oven/bun:1.2-slim AS runtime

WORKDIR /app

# Install prisma CLI for migrations in entrypoint
RUN npm install -g prisma

# Copy built artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Regenerate Prisma client in runtime (needs schema + prisma client)
RUN npx prisma generate || true

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

USER bun

ENTRYPOINT ["./entrypoint.sh"]
CMD ["bun", "run", "dist/index.js"]
