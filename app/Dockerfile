# syntax=docker/dockerfile:1.4

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --frozen-lockfile

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:26-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build step (TypeScript, webpack, etc. — skip if plain JS)
RUN npm run build --if-present

# ─── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:26-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 jaroskastore_group \
  && adduser --system --uid 1001 jaroskastore_user

# Set production environment
ENV NODE_ENV=production

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev

# Copy build artifacts
COPY --from=builder /app/src ./src
# Migrations run on startup (src/utils/migrate.js)
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/database.json ./database.json

# Set ownership
RUN chown -R jaroskastore_user:jaroskastore_group /app

# Switch to non-root user
USER jaroskastore_user

# Expose port (documentation only — not a binding)
EXPOSE 3000

# Health check — the orchestrator uses this
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Signal-aware startup
CMD ["node", "--enable-source-maps", "src/app.js"]