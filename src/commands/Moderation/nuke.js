const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    ChannelType
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'nuke',
    description: 'Clear all messages in a channel by cloning and deleting it.',
    permissions: [PermissionFlagsBits.ManageChannels],
    slashData: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Clear all messages in a channel by cloning and deleting it.'),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;

        try {
            const channel = context.channel;
            const position = channel.position;
            const topic = channel.topic;
            const parent = channel.parent;
            const permissions = channel.permissionOverwrites.cache;

            const clonedChannel = await channel.clone();
            await clonedChannel.setPosition(position);
            await clonedChannel.setTopic(topic);
            if (parent) await clonedChannel.setParent(parent);

            await channel.delete();

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.nuke_emoji || '💥'} **Channel Nuked!**\n> All messages have been cleared.`)
                );

            await clonedChannel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });

        } catch (err) {
            console.error('[NUKE ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to nuke the channel.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

