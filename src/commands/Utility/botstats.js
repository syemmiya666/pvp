const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'botstats',
    description: 'Show performance and usage stats for the bot.',
    aliases: ['stats', 'aboutbot'],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Show performance and usage stats for the bot.'),

    run: async (client, context) => {
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((count, guild) => count + (guild.memberCount || 0), 0);
        const commands = client.commands.size;
        const uptimeSeconds = Math.floor(process.uptime());
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const memoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        const block = new ContainerBuilder()
            .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${config.info_emoji} **${config.botName || 'Zenith'} Bot Stats**`,
                        `> **Servers:** ${guilds}`,
                        `> **Users Reached:** ${users}`,
                        `> **Commands Loaded:** ${commands}`,
                        `> **Memory Usage:** ${memoryMb} MB`,
                        `> **WebSocket Ping:** ${Math.round(client.ws.ping)}ms`,
                        `> **Uptime:** ${hours}h ${minutes}m`
                    ].join('\n')
                )
            );

        return context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [block]
        });
    }
};

