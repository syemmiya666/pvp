const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ThumbnailBuilder,
    SectionBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'ping',
    description: 'Check Zenith\'s network latency and heartbeat.',
    aliases: ['latency', 'p'],
    slashData: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Zenith\'s network latency and heartbeat.'),

    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;

        const loadingContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${config.loading_emoji} **Calculating latency...**`)
            );

        const response = isSlash
            ? await context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [loadingContainer],
                withResponse: true
            }).then(result => result.resource.message)
            : await context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [loadingContainer]
            });

        const latency = response.createdTimestamp - context.createdTimestamp;
        const apiPing = Math.round(client.ws.ping);
        const separator = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small);

        const thumbnail = new ThumbnailBuilder({
            media: { url: client.user.displayAvatarURL({ extension: 'png', size: 256 }) }
        });

        const statsSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${config.info_emoji} **${config.botName || 'Zenith'} Network Status**`),
                new TextDisplayBuilder().setContent(`> ${config.checkmark_emoji} **Bot Latency:** \`${latency}ms\``),
                new TextDisplayBuilder().setContent(`> ${config.verify_emoji || config.info_emoji} **API Heartbeat:** \`${apiPing}ms\``)
            )
            .setThumbnailAccessory(thumbnail);

        const footer = new TextDisplayBuilder()
            .setContent(`*Service Node: Cluster ${client.cluster.id} | Shard: ${context.guild?.shardId ?? 0} | Total Clusters: ${client.cluster.count}*`);

        const resultContainer = new ContainerBuilder()
            .addSectionComponents(statsSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(footer);

        if (isSlash) {
            await context.editReply({ components: [resultContainer] });
        } else {
            await response.edit({ components: [resultContainer] });
        }
    }
};

