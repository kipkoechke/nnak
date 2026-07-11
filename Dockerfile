# ──────────────────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc compat for native modules (e.g. sharp)
RUN apk add --no-cache libc6-compat

# Enable corepack so pnpm version from packageManager field is used
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────────────────
# Stage 2: Build the application
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args injected at build time (optional; for NEXT_PUBLIC_ vars)
ARG NEXT_PUBLIC_NNAK_API_URL
ENV NEXT_PUBLIC_NNAK_API_URL=${NEXT_PUBLIC_NNAK_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ──────────────────────────────────────────────────────────
# Stage 3: Minimal production image
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Dedicated non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what Next.js standalone output needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Use node for the healthcheck — accepts any non-5xx (including 301/302 redirects
# from Next.js middleware), no wget dependency needed.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))" || exit 1

CMD ["node", "server.js"]
