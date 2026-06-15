# Multi-stage build for MLB Deferred Contract Calculator
# Compatible with Raspberry Pi (ARM architecture)

# Build stage
FROM node:24.16.0-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS builder

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
FROM node:24.16.0-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0

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
