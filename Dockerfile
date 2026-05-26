# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Use the correct pnpm version
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

# Copy package files first (leverage Docker cache)
COPY package*.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build app
RUN pnpm build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only build artifacts and package files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate
RUN pnpm install --prod --frozen-lockfile

# Expose port
EXPOSE 3000

# Start app
CMD ["pnpm", "start"]
