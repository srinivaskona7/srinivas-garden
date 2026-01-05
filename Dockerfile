# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Production stage
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S garden -u 1001

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code (excluding tests via .dockerignore)
COPY --chown=garden:nodejs package*.json ./
COPY --chown=garden:nodejs server.js ./
COPY --chown=garden:nodejs CHANGELOG.md ./
COPY --chown=garden:nodejs config/ ./config/
COPY --chown=garden:nodejs models/ ./models/
COPY --chown=garden:nodejs public/ ./public/
COPY --chown=garden:nodejs routes/ ./routes/
COPY --chown=garden:nodejs views/ ./views/

# Create data directory for persistence (owned by garden user)
RUN mkdir -p /app/data && chown garden:nodejs /app/data

# Switch to non-root user
USER garden

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start application
CMD ["node", "server.js"]
