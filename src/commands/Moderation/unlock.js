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
    name: 'unlock',
    description: 'Unlock a channel to allow users to send messages again.',
    permissions: [PermissionFlagsBits.ManageChannels],
    slashData: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel.')
        .addChannelOption(opt => 
            opt.setName('channel')
                .setDescription('The channel to unlock.')
                .addChannelTypes(ChannelType.GuildText)
        ),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let channel;

        if (isSlash) {
            channel = context.options.getChannel('channel') || context.channel;
        } else {
            const args = context.args || [];
            const mention = args[0];

            if (mention) {
                const channelId = mention.replace(/[<#>]/g, '');
                channel = context.guild.channels.cache.get(channelId);
            }
            
            if (!channel) channel = context.channel;
        }

        if (channel.type !== ChannelType.GuildText) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} I can only unlock text channels.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        try {
            await channel.permissionOverwrites.edit(context.guild.id, {
                SendMessages: true
            });

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${config.checkmark_emoji} **Channel Unlocked!**\n> **Channel:** ${channel}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[UNLOCK ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to unlock the channel. Check my permissions.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

