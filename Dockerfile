# Multi-stage build for MLB Deferred Contract Calculator
# Compatible with Raspberry Pi (ARM architecture)

# Build stage
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS builder

WORKDIR /app

# Enable pnpm via Corepack (bundled with Node). The version must match
# package.json "packageManager" exactly, otherwise Corepack would try to
# auto-fetch the pinned version at runtime.
# renovate: datasource=npm depName=pnpm
ARG PNPM_VERSION=11.15.1
RUN corepack enable && corepack prepare pnpm@$PNPM_VERSION --activate

# Copy manifests, lockfile, and policy files first so the install layer stays
# cached when only source changes. .npmrc (engine-strict, ignore-scripts) and
# pnpm-workspace.yaml (preferFrozenLockfile, allowBuilds) apply the same
# supply-chain posture inside the image build.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install dependencies from the frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

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
