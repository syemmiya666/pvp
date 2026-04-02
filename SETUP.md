# ModBotX Setup Guide

This guide explains how to set up **ModBotX** with:

- the **dashboard frontend** hosted on **Vercel**
- the **bot + API backend** hosted on a **Pterodactyl-based Node.js host**

This is written for the common setup where:

- the hosting provider gives everyone the **same main IP**
- each user gets a **different port**
- your Node.js app must listen on the port provided by the panel

If you follow this step by step, you should be able to get the bot and dashboard online properly.

---

## Architecture

ModBotX is split into 2 parts:

### 1. Frontend

This is the React dashboard inside:

`dashboard/`

You will host this on **Vercel**.

### 2. Backend

This is the Discord bot and Express API inside:

`src/`

You will host this on your **Pterodactyl-based Node.js hosting**.

The backend does these jobs:

- logs in the Discord bot
- connects to MongoDB
- handles OAuth login
- serves API endpoints
- stores moderation data
- powers the dashboard data

The frontend talks to this backend using your hosted backend URL.

---

## What You Need Before Starting

Prepare these first:

- a **Discord bot application**
- a **MongoDB URI**
- a **Vercel account**
- a **Pterodactyl-based Node.js hosting panel**
- your source code uploaded to **GitHub**

You should also know:

- your Vercel frontend URL
- your backend host IP or domain
- the backend port assigned by your Pterodactyl host

---

## Step 1: Create the Discord Bot

Go to the [Discord Developer Portal](https://discord.com/developers/applications).

Create a new application, then create a bot inside it.

### Enable the correct intents

In the bot settings, enable:

- `SERVER MEMBERS INTENT`
- `MESSAGE CONTENT INTENT`
- `PRESENCE INTENT` only if you want it and your setup needs it

### Copy the important values

You will need:

- **Bot Token**
- **Application ID** which is your `CLIENTID`
- **Client Secret**

### Add a redirect URL

Inside the OAuth2 settings, add your backend callback URL.

Example:

```txt
http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT/api/auth/callback
```

If your host gives you a subdomain instead of a raw IP, use that instead.

Example:

```txt
https://bot.examplehost.com/api/auth/callback
```

### Invite the bot

Invite the bot to your Discord server with the required permissions.

At minimum, the bot should have permissions for:

- View Channels
- Send Messages
- Manage Messages
- Moderate Members
- Kick Members
- Ban Members
- Manage Channels
- Manage Roles
- Read Message History

If you plan to use everything, give it full moderation-related permissions.

---

## Step 2: Create Your MongoDB Database

Create a MongoDB database using MongoDB Atlas or another MongoDB provider.

Then copy your connection string.

You will use it for:

`MONGO_URI`

Make sure the database allows connections from your bot host.

If using Atlas for quick setup, allowing all IPs with `0.0.0.0/0` is the easiest option, but not the most restrictive. Use your preferred security level.

---

## Step 3: Prepare the Backend Environment

Your backend runs on the Pterodactyl-based host.

Upload the bot project there, or connect the panel to your GitHub repo if your host supports that.

### Important note about ports

Pterodactyl-style hosts usually give you:

- one shared machine IP
- one unique port for your server

That means your app must **not hardcode port 3000 only**.

This project already supports dynamic ports like:

- `SERVER_PORT`
- `PORT`
- `API_PORT`

So your host can assign the correct runtime port.

---

## Step 4: Create the Backend `.env`

On your backend host, create your environment variables.

Use `example.env` as a base.

Set values like these:

```env
TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENTID=YOUR_DISCORD_APPLICATION_ID
CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
REDIRECT_URI=http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT/api/auth/callback
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_RANDOM_LONG_SECRET
SERVER_PORT=YOUR_ASSIGNED_PANEL_PORT
```

### What each value means

- `TOKEN`: your bot token
- `CLIENTID`: Discord application ID
- `CLIENT_SECRET`: Discord OAuth2 secret
- `REDIRECT_URI`: the exact Discord OAuth callback URL
- `MONGO_URI`: your MongoDB connection string
- `JWT_SECRET`: secret used for dashboard login tokens
- `SERVER_PORT`: the port your panel assigned to your app

If your hosting panel automatically injects `PORT`, you can use that too. The app already supports both styles.

### Important

The value of `REDIRECT_URI` must exactly match the redirect URI you added in the Discord Developer Portal.

If one uses `http` and the other uses `https`, or one uses a different port, Discord OAuth will fail.

---

## Step 5: Configure `src/config/config.json`

Open:

`src/config/config.json`

Set the important fields:

- bot prefix
- owner IDs
- embed color / theme color
- emoji values
- any channel-specific settings you want

### Important owner setup

Add your Discord user ID to:

```json
"ownerIDs": ["YOUR_USER_ID"]
```

If both developers should remain owners in your public version, include both IDs as needed.

---

## Step 6: Build the Frontend for Vercel

The dashboard is a separate Vite app inside:

`dashboard/`

Before deploying, make sure the frontend knows where your backend API lives.

### Check the frontend API base URL logic

If your dashboard already uses relative API paths and you are proxying correctly, keep that.

If not, you may need to define a Vite environment variable such as:

```env
VITE_API_BASE_URL=http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT
```

If the project does not yet use that variable everywhere, update the API calls before public deployment.

If you want, I can do that wiring for you in another pass.

---

## Step 7: Deploy the Frontend to Vercel

Push your code to GitHub first.

Then:

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. When Vercel asks for the project root, set it to:

```txt
dashboard
```

4. Vercel should detect it as a Vite project automatically
5. Add any frontend environment variables if needed
6. Deploy

After deployment, you will get a frontend URL like:

```txt
https://modbotx.vercel.app
```

---

## Step 8: Deploy the Backend to Pterodactyl Hosting

Upload the full project to your Pterodactyl-based host.

### Install dependencies

In the server startup/install step, make sure dependencies are installed:

```bash
npm install
cd dashboard && npm install && npm run build
```

Then return to the project root and start the bot.

### Startup command

Use:

```bash
npm start
```

or:

```bash
node src/zenith.js
```

### Important

The dashboard build is needed because the backend can serve dashboard assets in some flows, and the repository expects the dashboard app to exist in built form when needed.

Even if Vercel is hosting your main frontend, building the dashboard on the backend is still safe and avoids missing-file issues in routes that expect the build directory.

---

## Step 9: Set the Correct OAuth Callback

Your backend handles login at:

```txt
/api/auth/login
```

and Discord returns to:

```txt
/api/auth/callback
```

So your callback should be:

```txt
http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT/api/auth/callback
```

or:

```txt
https://YOUR_BACKEND_DOMAIN/api/auth/callback
```

This URL must be added in the Discord Developer Portal exactly.

---

## Step 10: Make Frontend and Backend Work Together

This is the most important deployment concept.

### The frontend lives on Vercel

Example:

```txt
https://modbotx.vercel.app
```

### The backend lives on your bot host

Example:

```txt
http://123.45.67.89:2012
```

The frontend must send API requests to that backend URL.

If your frontend currently calls paths like:

```txt
/api/overview/...
```

then those requests will go to Vercel unless you add a rewrite/proxy setup.

You generally have 2 options:

### Option A: Use full backend URLs in the frontend

Example:

```txt
http://123.45.67.89:2012/api/overview/...
```

This is the simplest conceptually.

### Option B: Use a Vercel rewrite

You can configure Vercel so `/api/*` requests are forwarded to your backend.

That makes the frontend cleaner because it can keep calling `/api/...`.

Example `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT/api/:path*"
    }
  ]
}
```

If your backend uses HTTPS, use `https://` in the destination.

### Recommended

For public deployment, using a **domain or reverse proxy** for your backend is cleaner than exposing a raw IP and port.

But if your host only gives you IP + port, that still works.

---

## Step 11: Vercel Environment Variables

If your frontend is configured to use an environment variable for the API base URL, add it in Vercel.

Example:

```env
VITE_API_BASE_URL=http://YOUR_BACKEND_IP:YOUR_BACKEND_PORT
```

Then redeploy the frontend.

---

## Step 12: First Login Test

Once both frontend and backend are live:

1. Open your Vercel dashboard URL
2. Click login
3. Login through Discord
4. Make sure Discord redirects back successfully
5. Select a server
6. Open Overview, Moderation, Auto Moderation, Command Center, and Docs

If these all work, your deployment is basically correct.

---

## Common Problems and Fixes

### 1. OAuth says invalid redirect

Cause:

- `REDIRECT_URI` does not exactly match Discord Developer Portal settings

Fix:

- make them identical
- check protocol, domain/IP, path, and port

### 2. Dashboard loads but API data fails

Cause:

- frontend is calling the wrong backend URL
- Vercel rewrite is missing
- backend is offline

Fix:

- confirm your backend URL works in browser
- confirm frontend requests go to the backend
- check console/network tab

### 3. Bot runs but dashboard login fails

Cause:

- wrong `CLIENTID`
- wrong `CLIENT_SECRET`
- wrong `REDIRECT_URI`
- backend route not reachable publicly

Fix:

- recheck all 4 values

### 4. Bot host gives one IP for everyone

That is normal on many panels.

What matters is your assigned port.

Your app should be reachable like:

```txt
http://MAIN_SHARED_IP:YOUR_ASSIGNED_PORT
```

That is why your callback and API base URL must include the correct port.

### 5. Vercel is HTTPS but backend is HTTP

This can still work, but some browsers and setups may complain depending on how requests are handled.

If possible, use:

- a reverse proxy
- a custom domain
- HTTPS for the backend

This makes the setup cleaner and safer.

### 6. MongoDB fails to connect

Cause:

- invalid URI
- IP not allowed
- temporary provider issue

Fix:

- test the URI
- allow your host IP or allow public IP access in Atlas

### 7. Command Center or docs open but some data fails

Cause:

- frontend fallback content may show, but live backend metadata is unreachable

Fix:

- verify the backend API works
- verify `/api/meta/commands` works if used

---

## Recommended Production Setup

If you want the cleanest setup:

- frontend on Vercel
- backend on Pterodactyl host
- MongoDB Atlas
- custom backend domain or reverse proxy
- HTTPS enabled on backend domain
- Vercel rewrites for `/api/*`

This gives the nicest public deployment feel.

---

## Quick Deployment Checklist

- Discord bot created
- intents enabled
- bot invited to your server
- MongoDB ready
- backend `.env` configured
- `src/config/config.json` configured
- frontend deployed to Vercel
- backend deployed to Pterodactyl
- correct `REDIRECT_URI` set
- correct backend URL connected to frontend
- login tested
- commands tested
- dashboard tested

---

## Final Notes

ModBotX depends on both the frontend and backend being configured correctly.

If the dashboard opens but cannot fetch data, the issue is usually not Vercel itself. It is usually one of these:

- wrong backend URL
- wrong OAuth callback
- wrong port
- backend not publicly reachable

If you want, I can next make deployment even easier by adding:

- a `vercel.json`
- cleaner frontend API base URL support
- example production `.env` templates
- a backend health-check route
