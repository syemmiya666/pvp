require('dotenv').config({ quiet: true });

const { Client, Partials, Collection, GatewayIntentBits, Events } = require('discord.js');
const colors = require('colors');
const mongoose = require('mongoose');
const Dokdo = require('dokdo');
const config = require('./config/config.json');
const { ClusterClient } = require('discord-hybrid-sharding');

if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("[INFO] Connected to MongoDB database".green))
        .catch(err => console.error("[ERROR] MongoDB connection failed:".red, err));
} else {
    console.log("[WARN] MONGO_URI is missing in .env! Database features will be disabled.".yellow);
}

const client = new Client({
    shards: ClusterClient.getInfo().SHARD_LIST,
    shardCount: ClusterClient.getInfo().TOTAL_SHARDS,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
    ],
});

client.dokdo = new Dokdo.Client(client, {
    prefix: config.prefix,
    owners: config.ownerIDs,
    noAutocomplete: true,
});

module.exports = client;

if (!process.env.TOKEN) {
    console.log("[WARN] Token for Discord app is required! Put your token in .env file".yellow + "\n");
    process.exit();
}

client.commands = new Collection();
client.events = new Collection();
client.slash = new Collection();
client.aliases = new Collection();

client.cluster = new ClusterClient(client);

const autoModModule = require('./automod');
client.on('clientReady', () => {
    client.cluster.triggerReady();
    autoModModule.init(client);
});

require(`./handlers/event`)(client);
require(`./handlers/hybrid`)(client);

client.login(process.env.TOKEN)
    .then(() => console.log("[INFO] App logged in successfully".green))
    .catch(err => {
        console.error("[CRUSH] Failed to login:", err);
        process.exit();
    });

client.on('error', (error) => {
    console.error("[CLIENT ERROR]", error);
});

client.on('shardError', (error) => {
    console.error("[SHARD ERROR]", error);
});

process.on('uncaughtException', (err) => {
    console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("[UNHANDLED REJECTION] At:", promise, "reason:", reason);
});


