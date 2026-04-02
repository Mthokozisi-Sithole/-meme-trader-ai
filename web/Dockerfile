FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
# Install debugging tools (curl, wget, netcat)
RUN apk add --no-cache curl wget netcat-openbsd
ENV NODE_ENV=production
# Bind to all interfaces so Kubernetes Services, port-forward, and Ingress work.
# Next.js standalone server.js reads HOSTNAME; without this it defaults to localhost (127.0.0.1),
# which causes "connection refused" from outside the container.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# INTERNAL_API_URL is read at runtime by next.config.js rewrites
ENV INTERNAL_API_URL=http://api:8000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
