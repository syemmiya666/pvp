const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
require('dotenv').config({ quiet: true });

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '../commands');
    const slash = [];
    let loadedCount = 0;
    let skippedCount = 0;

    client.commands.clear();
    client.aliases.clear();
    client.slash.clear();

    if (!fs.existsSync(commandsPath)) {
        console.log(`[WARN]`.yellow + ` commands folder not found!`);
        return;
    }

    const categories = fs.readdirSync(commandsPath);

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (!fs.lstatSync(categoryPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const command = require(path.join(categoryPath, file));

                if (!command.name || !command.run) {
                    console.log(`[SKIP]`.red + ` ${file} is missing name or run function.`);
                    skippedCount++;
                    continue;
                }

                const commandName = command.name.toLowerCase();
                command.category = category;
                client.commands.set(commandName, command);

                if (command.cooldown) {
                    if (!client.cooldowns) client.cooldowns = new Map();
                    client.cooldowns.set(commandName, new Map());
                }

                if (Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        client.aliases.set(alias.toLowerCase(), commandName);
                    });
                }

                if (command.slashData) {
                    const data = command.slashData.toJSON();
                    client.slash.set(data.name, command);
                    slash.push(data);
                }

                loadedCount++;
            } catch (error) {
                console.error(`[ERROR]`.red + ` Failed to load command ${file}:`, error);
                skippedCount++;
            }
        }
    }

    if (slash.length > 0) {
        if (!process.env.TOKEN || !process.env.CLIENTID) {
            console.log(`[ERROR]`.red + ` TOKEN or CLIENTID missing in .env. Skipping slash registration.`);
        } else if (client.cluster.id === 0) {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            try {
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENTID),
                    { body: slash }
                );
                console.log(`[SUCCESS]`.magenta + ` Registered ${slash.length} Slash Commands.`);
            } catch (err) {
                console.error(`[ERROR]`.red + ` Failed to register Slash Commands:`, err);
            }
        }
    }

    const boxWidth = 40;
    const line = "━".repeat(boxWidth);
    console.log(`┏${line}┓`.cyan);
    console.log(`┃ ${"ZENITH COMMAND LOADER".center(boxWidth - 2)} ┃`.cyan);
    console.log(`┣${line}┫`.cyan);
    console.log(`┃ ${`Loaded: ${loadedCount}`.padEnd(boxWidth - 2)} ┃`.cyan);
    console.log(`┃ ${`Skipped: ${skippedCount}`.padEnd(boxWidth - 2)} ┃`.cyan);
    console.log(`┗${line}╝`.cyan);
};

String.prototype.center = function (width) {
    const left = Math.floor((width - this.length) / 2);
    const right = width - this.length - left;
    return " ".repeat(left) + this + " ".repeat(right);
};

