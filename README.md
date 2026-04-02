# ModBotX - Advanced Discord AI Moderation Bot

<div align="center">
  <img src="https://i.ibb.co/4ZRjZZ5g/image.png" alt="ModBotX Banner" width="900">
  <br>
  <strong>A premium Discord moderation bot with a modern dashboard, hybrid commands, and advanced automod.</strong>
  <br><br>
  <p>
    <a href="https://github.com/aryanshrai3/ModBotX"><img src="https://img.shields.io/github/stars/aryanshrai3/ModBotX?color=ff66b2&logo=github&style=for-the-badge" alt="Stars"></a>
    <a href="https://github.com/aryanshrai3/ModBotX/blob/main/LICENSE"><img src="https://img.shields.io/github/license/aryanshrai3/ModBotX?color=ff66b2&style=for-the-badge" alt="License"></a>
    <img src="https://img.shields.io/badge/Developed%20By-Devrock%20%26%20Foil-ff66b2?style=for-the-badge" alt="Developers">
  </p>
</div>

---

## Overview

**ModBotX** is a feature-rich Discord moderation and utility bot built with **Discord.js v14**, **Components V2**, **MongoDB**, and a responsive **web dashboard**.

It is designed for server owners who want strong moderation tools, polished command UX, practical automation, and a clean browser-based control panel for managing their guilds.

## Features

- Advanced automod with static filters, AI-assisted analysis, link controls, and whitelist support
- Hybrid command system with both slash commands and prefix commands
- Modern Components V2 responses instead of old embed-heavy flows
- Responsive dashboard for moderation analytics, automod settings, docs, and command browsing
- Case logging and moderation history
- Utility and info commands for server management
- Ticket and support system modules
- Multi-guild admin access through Discord OAuth
- Sharded architecture using `discord-hybrid-sharding`

## Command Highlights

- Moderation: `ban`, `kick`, `warn`, `timeout`, `untimeout`, `massban`, `purge`, `lock`, `unlock`, `case`
- Info: `help`, `ping`, `serverinfo`, `userinfo`
- Utility: `avatar`, `botstats`, `roleinfo`
- Owner: `dok`, `nop`

## Dashboard

The dashboard includes:

- Overview analytics
- Moderation activity insights
- Auto Moderation controls
- Command Center
- Docs & Guides
- Mobile-friendly layout for Android and desktop browsers

## Tech Stack

- Node.js
- Discord.js v14
- MongoDB with Mongoose
- Express
- React + Vite
- discord-hybrid-sharding

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- A MongoDB database
- A Discord bot application with the required intents enabled

### Setup

1. Clone the repository

```bash
git clone https://github.com/aryanshrai3/ModBotX.git
cd ModBotX
```

2. Install dependencies

```bash
npm install
cd dashboard
npm install
cd ..
```

3. Create your environment file

Use `example.env` as a base and configure:

- `TOKEN`
- `CLIENTID`
- `CLIENT_SECRET`
- `REDIRECT_URI`
- `MONGO_URI`
- `JWT_SECRET`

4. Update the bot config

Edit:

- `src/config/config.json`

Set your prefix, owner IDs, colors, emojis, and other bot preferences.

5. Build the dashboard

```bash
cd dashboard
npm run build
cd ..
```

6. Start the bot

```bash
npm start
```

## Development

Run the bot and dashboard together:

```bash
npm run dev
```

## Credits

**Developed by Devrock and Foil**

- Devrock: [GitHub](https://github.com/devrock07)
- Foil: [GitHub](https://github.com/aryanshrai03)

## License

This project is licensed under the **ModBotX Custom Credit Protection License**.

- Credits to **Devrock** and **Foil** must remain intact
- Redistribution must include the original license
- Commercial use requires prior written permission from the original developers

See [LICENSE](./LICENSE) for full terms.

---

<div align="center">
  <p>(c) 2026 ModBotX Project • Created by Devrock and Foil</p>
</div>
