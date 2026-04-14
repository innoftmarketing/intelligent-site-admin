# Multi-stage Dockerfile for the Intelligent Website admin panel.
# Produces a ~150 MB image that runs Next.js in standalone mode.

# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app
# bcrypt has a native addon that needs build tools + python during install.
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# ---------- builder ----------
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---------- runner ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone server and its static assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# The standalone output ships with its own minimal Node.js entrypoint.
CMD ["node", "server.js"]
