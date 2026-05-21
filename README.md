# SketchBoard

SketchBoard is a collaborative whiteboard app built as a PNPM/Turborepo monorepo. It has a Next.js frontend, an Express REST API, a Socket.IO realtime server, and a PostgreSQL database accessed through Prisma.

## Project Structure

- `apps/web` - Next.js app for landing, auth, room creation/joining, and the drawing canvas.
- `apps/server` - Express REST API for signup, login, room creation, and loading room shapes.
- `apps/ws-server` - Socket.IO server for realtime drawing events and shape persistence.
- `packages/db` - Prisma schema, migrations, generated client, and shared Prisma client.
- `packages/ui` - Shared UI components and styles.

Default local ports:

- Web: `http://localhost:3000`
- REST API: `http://localhost:3001`
- Websocket server: `http://localhost:8081`

## Prerequisites

- Node.js `20` or newer
- PNPM `9.15.9` or compatible
- PostgreSQL database URL
- A long random `JWT_SECRET`

Install dependencies from the repository root:

```bash
pnpm install
```

## Environment Setup

Create real `.env` files from the examples:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
cp apps/ws-server/.env.example apps/ws-server/.env
cp packages/db/.env.example packages/db/.env
```

Use the same `DATABASE_URL` anywhere it is required. Use the same `JWT_SECRET` in `apps/server/.env` and `apps/ws-server/.env`.

Expected local values:

```env
# apps/web/.env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_WS_BACKEND_URL="http://localhost:8081"
```

```env
# apps/server/.env
PORT=3001
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
```

```env
# apps/ws-server/.env
PORT=8081
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="replace-with-the-same-secret-used-by-the-rest-api"
```

```env
# packages/db/.env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

Do not commit real `.env` files or database credentials.

## Database Setup

From the repository root:

```bash
pnpm --filter @workspace/db gen
pnpm --filter @workspace/db mig
pnpm --filter @workspace/db build
```

`gen` creates the Prisma client. `mig` applies migrations. `build` compiles the shared database package used by the REST and websocket services.

## Running Locally

Run every app through Turbo:

```bash
pnpm dev
```

Or run services separately:

```bash
pnpm --filter web dev
pnpm --filter server dev
pnpm --filter ws-server dev
```

Open the frontend at `http://localhost:3000`.

## API And Realtime Flow

- Signup: `POST http://localhost:3001/api/v1/users/signup`
- Login: `POST http://localhost:3001/api/v1/users/login`
- Create room: `POST http://localhost:3001/api/v1/rooms/create`
- Load room shapes: `GET http://localhost:3001/api/v1/rooms/data/shapes/:id`
- Realtime drawing: Socket.IO connects to `http://localhost:8081?token=<jwt>`

The frontend stores the auth token in a cookie and sends it to the REST API in the `Authorization` header for protected room requests. The canvas connects to the websocket server with the same token.

## Troubleshooting

### `Cannot POST /api/v1/users/signup`

This usually means the websocket server is running on the REST API port. The REST API must own `3001`; the websocket server must own `8081`.

Check ports on Windows:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001,8081 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Then check the process:

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = <PID>" |
  Select-Object ProcessId,CommandLine
```

If the wrong service is on `3001`, stop the running Node processes and restart with the env values above.

### `Missing required environment variable: JWT_SECRET`

Add the same `JWT_SECRET` to both `apps/server/.env` and `apps/ws-server/.env`.

### Websocket does not connect

Confirm:

- `apps/ws-server/.env` has `PORT=8081`.
- `apps/web/.env` has `NEXT_PUBLIC_WS_BACKEND_URL="http://localhost:8081"`.
- The REST and websocket services use the same `JWT_SECRET`.

## Build

Build all packages/apps:

```bash
pnpm build
```

Build a single service:

```bash
pnpm --filter @workspace/db build
pnpm --filter server build
pnpm --filter ws-server build
pnpm --filter web build
```

## AWS EC2 Deployment Guide

This guide deploys all three services on one Ubuntu EC2 instance with PM2.

### 1. Create EC2 Instance

- Use Ubuntu 22.04 or newer.
- Open inbound ports in the security group:
  - `22` for SSH from your IP only.
  - `3000` for the Next.js app, or proxy it through `80/443`.
  - `3001` for the REST API, or proxy it through `80/443`.
  - `8081` for Socket.IO, or proxy it through `80/443`.

For production, put Nginx in front of these services and serve only `80/443` publicly.

### 2. Install Runtime

SSH into the instance:

```bash
ssh ubuntu@YOUR_EC2_PUBLIC_IP
```

Install Node.js 20, PNPM, Git, and PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo corepack enable
sudo corepack prepare pnpm@9.15.9 --activate
sudo npm install -g pm2
```

### 3. Deploy Code

Clone the repository and install dependencies:

```bash
git clone YOUR_REPOSITORY_URL sketchboard
cd sketchboard
pnpm install --frozen-lockfile
```

Create `.env` files from the examples and fill in production values:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
cp apps/ws-server/.env.example apps/ws-server/.env
cp packages/db/.env.example packages/db/.env
```

Production URL example:

```env
# apps/web/.env
NEXT_PUBLIC_BACKEND_URL="http://YOUR_EC2_PUBLIC_IP:3001"
NEXT_PUBLIC_WS_BACKEND_URL="http://YOUR_EC2_PUBLIC_IP:8081"
```

Use your production PostgreSQL URL in `apps/server/.env`, `apps/ws-server/.env`, and `packages/db/.env`. Use the same production `JWT_SECRET` in `apps/server/.env` and `apps/ws-server/.env`.

### 4. Prepare Database And Build

```bash
pnpm --filter @workspace/db gen
pnpm --filter @workspace/db mig
pnpm build
```

### 5. Start With PM2

Start each app from its package directory so it loads the correct `.env` file:

```bash
pm2 start "pnpm start" --name sketchboard-web --cwd apps/web
pm2 start "node ./dist/index.js" --name sketchboard-api --cwd apps/server
pm2 start "node ./dist/index.js" --name sketchboard-ws --cwd apps/ws-server
pm2 save
pm2 startup
```

After running `pm2 startup`, PM2 prints one command. Run that command with `sudo` to enable restart on boot.

Check status and logs:

```bash
pm2 status
pm2 logs sketchboard-web
pm2 logs sketchboard-api
pm2 logs sketchboard-ws
```

### 6. Optional Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Use Nginx to route your domain to:

- Frontend: `http://127.0.0.1:3000`
- REST API: `http://127.0.0.1:3001`
- Websocket: `http://127.0.0.1:8081`

When using a domain and HTTPS, update `apps/web/.env` before building:

```env
NEXT_PUBLIC_BACKEND_URL="https://api.your-domain.com"
NEXT_PUBLIC_WS_BACKEND_URL="https://ws.your-domain.com"
```

Then rebuild and restart:

```bash
pnpm --filter web build
pm2 restart sketchboard-web
```
