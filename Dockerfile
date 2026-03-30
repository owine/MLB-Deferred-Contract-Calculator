# Multi-stage build for MLB Deferred Contract Calculator
# Compatible with Raspberry Pi (ARM architecture)

# Build stage
FROM node:24.14.1-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (API key will be baked in)
RUN npm run build

# Production stage
FROM node:24.14.1-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b

WORKDIR /app

# Install serve globally for serving static files
# renovate: datasource=npm depName=serve
RUN npm install -g serve@14.2.6

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000 (serve's default)
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]
