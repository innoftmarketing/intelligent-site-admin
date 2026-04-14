# Multi-stage Dockerfile for the Intelligent Website admin panel.
# Produces a ~150 MB image that runs Next.js in standalone mode.

# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app
# bcrypt has a native addon that needs build tools + python during install.
RUN apk add --no-cache libc6-compat python3 make g++
# Force dev dependencies too, even if NODE_ENV=production leaks in as a
# build arg from the orchestrator (Coolify passes all env vars as build args
# by default). Without --production=false, yarn 1 would skip devDependencies
# and the builder stage would fail with "Cannot find module '@tailwindcss/postcss'".
ENV NODE_ENV=development
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false --network-timeout 600000

# ---------- builder ----------
FROM node:24-alpine AS builder
WORKDIR /app
# Next.js expects NODE_ENV=production here so it compiles the real
# production React (the dev build of React lacks Suspense/useContext
# behavior that the prerender step relies on). The devDependencies are
# already physically present in node_modules from the deps stage, so
# Next's build will pick them up regardless of NODE_ENV.
ENV NODE_ENV=production
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
