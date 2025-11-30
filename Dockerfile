# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --only=production

# Frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci

# Build the frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy backend
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Build backend
RUN cd backend && npm run build

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start the backend server
CMD ["node", "backend/dist/server.js"]
