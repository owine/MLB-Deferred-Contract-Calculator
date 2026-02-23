<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vvtFq5IcwAl5avbWgMxwn1yun0Cwt0c1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Docker Deployment (Raspberry Pi)

**Prerequisites:** Docker and Docker Compose installed on your Raspberry Pi

### Building and Running with Docker Compose

1. Clone this repository to your Raspberry Pi
2. Build and start the container:
   ```bash
   docker-compose up -d
   ```
3. The app will be available at `http://localhost:3000`
4. Point your reverse proxy to `localhost:3000`

### Building and Running with Docker

If you prefer to use Docker directly:

1. Build the image:
   ```bash
   docker build -t mlb-calculator .
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name mlb-calculator \
     --restart unless-stopped \
     -p 3000:3000 \
     mlb-calculator
   ```

### Stopping the Container

With Docker Compose:
```bash
docker-compose down
```

With Docker:
```bash
docker stop mlb-calculator
docker rm mlb-calculator
```

### Updating the Application

1. Pull the latest changes
2. Rebuild and restart:
   ```bash
   docker-compose up -d --build
   ```

### Reverse Proxy Configuration

The container serves the application on port 3000. Configure your reverse proxy (nginx, Caddy, Traefik, etc.) to forward requests to `http://localhost:3000`.

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
