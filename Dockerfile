# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for node-pty (native module)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for native builds)
RUN npm ci && npm cache clean --force

# Production stage
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install bash and curl first (most important for terminal)
RUN apk add --no-cache bash curl

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

# Install helm  
RUN curl -fsSL https://get.helm.sh/helm-v3.14.0-linux-amd64.tar.gz | tar xz \
    && mv linux-amd64/helm /usr/local/bin/ \
    && rm -rf linux-amd64

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S garden -u 1001 -s /bin/bash

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=garden:nodejs package*.json ./
COPY --chown=garden:nodejs server.js ./
COPY --chown=garden:nodejs tracing.js ./
COPY --chown=garden:nodejs CHANGELOG.md ./
COPY --chown=garden:nodejs config/ ./config/
COPY --chown=garden:nodejs models/ ./models/
COPY --chown=garden:nodejs public/ ./public/
COPY --chown=garden:nodejs routes/ ./routes/
COPY --chown=garden:nodejs views/ ./views/

# Copy kyma cluster kubeconfig
COPY --chown=garden:nodejs kyma-cluster/ ./kyma-cluster/

# Create data directory
RUN mkdir -p /app/data && chown garden:nodejs /app/data

# Switch to non-root user
USER garden

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "server.js"]
