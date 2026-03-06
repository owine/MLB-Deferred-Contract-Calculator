# MLB Deferred Contract Calculator

A calculator for determining the Competitive Balance Tax (CBT / Luxury Tax) implications of deferred money in MLB contracts, based on Article XXIII of the 2022-2026 Basic Agreement.

Calculates present value of deferred compensation using the Federal Mid-Term Rate, shows year-by-year breakdowns of cash salary vs. CBT hit, and visualizes the financial timeline across playing and payout years. Includes preset scenarios for notable contracts like Shohei Ohtani's $700M deal with the Dodgers.

## Credits

Originally created by [WarrenAdams8](https://github.com/WarrenAdams8/MLB-Deferred-Contract-Calculator-) using Google AI Studio.

## Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Docker Deployment

The Docker image is published to GHCR and builds for both `linux/amd64` and `linux/arm64` (Raspberry Pi compatible).

### Using the pre-built image (recommended)

```bash
docker-compose up -d
```

This pulls `ghcr.io/owine/mlb-deferred-contract-calculator:latest` and serves on port 3000.

### Building locally

Uncomment the `build` section in `docker-compose.yml` and comment out the `image` line, then:

```bash
docker-compose up -d --build
```

Or build directly:

```bash
docker build -t mlb-calculator .
docker run -d --name mlb-calculator --restart unless-stopped -p 3000:3000 mlb-calculator
```

### Reverse Proxy

The container serves on port 3000. Point your reverse proxy (nginx, Caddy, Traefik, etc.) to `http://localhost:3000`.

