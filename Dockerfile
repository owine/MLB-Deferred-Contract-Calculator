# Multi-stage build for MLB Contract Calculator
# Compatible with Raspberry Pi (ARM architecture)

# Build stage
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS builder

WORKDIR /app

# Install pnpm from npm. Node 25+ no longer bundles Corepack, so npm (still
# bundled) is the dependency-free way to get it. The version must match
# package.json "packageManager" exactly, otherwise pnpm would try to switch
# to the pinned version at runtime. The shared Renovate preset tracks the
# PNPM_VERSION build arg in lockstep with packageManager (toolchain-versions).
# --ignore-scripts: .npmrc (ignore-scripts=true) is not copied in yet, so set
# it explicitly. pnpm supports script-less installs (its placeholder bins run
# through Node), which is also how Corepack ran it.
# renovate: datasource=npm depName=pnpm
ARG PNPM_VERSION=12.16.1
RUN npm install -g pnpm@$PNPM_VERSION --ignore-scripts

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
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94

WORKDIR /app

# Install serve globally for serving static files. --ignore-scripts goes AFTER
# pkg@VERSION: the shared preset's regex needs `-g` immediately followed by
# the pkg@VERSION token, so a flag in between silently un-tracks the line.
# renovate: datasource=npm depName=serve
RUN npm install -g serve@14.2.6 --ignore-scripts

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000 (serve's default)
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]
