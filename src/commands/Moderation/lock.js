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
    name: 'lock',
    description: 'Lock a channel to prevent users from sending messages.',
    permissions: [PermissionFlagsBits.ManageChannels],
    slashData: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel.')
        .addChannelOption(opt => 
            opt.setName('channel')
                .setDescription('The channel to lock.')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(opt => 
            opt.setName('reason')
                .setDescription('Reason for the lock.')
        ),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let channel, reason;

        if (isSlash) {
            channel = context.options.getChannel('channel') || context.channel;
            reason = context.options.getString('reason') || 'No reason provided.';
        } else {
            const args = context.args || [];
            const mention = args[0];
            reason = args.slice(1).join(' ') || 'No reason provided.';

            if (mention) {
                const channelId = mention.replace(/[<#>]/g, '');
                channel = context.guild.channels.cache.get(channelId);
            }
            
            if (!channel) channel = context.channel;
        }

        if (channel.type !== ChannelType.GuildText) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} I can only lock text channels.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        try {
            await channel.permissionOverwrites.edit(context.guild.id, {
                SendMessages: false
            });

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${config.mute_emoji} **Channel Locked!**\n> **Channel:** ${channel}\n> **Reason:** ${reason}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[LOCK ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to lock the channel. Check my permissions.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

