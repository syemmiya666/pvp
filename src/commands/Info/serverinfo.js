const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'serverinfo',
    description: 'Show a quick snapshot of the current server.',
    aliases: ['guildinfo', 'si'],
    cooldown: 5,
    guildOnly: true,
    slashData: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show a quick snapshot of the current server.'),

    
    run: async (client, context) => {
        const guild = context.guild;
        if (!guild) {
            const block = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command only works inside a server.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [block] });
        }

        const owner = await guild.fetchOwner().catch(() => null);
        const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
        const boosts = guild.premiumSubscriptionCount || 0;

        const infoBlock = new ContainerBuilder()
            .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${config.info_emoji} **${guild.name}**`,
                        `> **Owner:** ${owner ? owner.user.tag : 'Unknown'}`,
                        `> **Members:** ${guild.memberCount}`,
                        `> **Roles:** ${guild.roles.cache.size}`,
                        `> **Text Channels:** ${textChannels}`,
                        `> **Voice Channels:** ${voiceChannels}`,
                        `> **Boost Tier:** ${guild.premiumTier} (${boosts} boosts)`,
                        `> **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
                    ].join('\n')
                )
            );

        return context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [infoBlock]
        });
    }
};

