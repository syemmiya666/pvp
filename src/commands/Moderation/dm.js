const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'dm',
    description: 'Send a direct message to a user.',
    permissions: [PermissionFlagsBits.Administrator],
    slashData: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('DM a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(opt => opt.setName('user').setDescription('The user to DM.').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('The message to send.').setRequired(true)),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let targetUser, dmMessage;

        if (isSlash) {
            targetUser = context.options.getUser('user');
            dmMessage = context.options.getString('message');
        } else {
            const args = context.args || [];
            const mention = args[0];
            dmMessage = args.slice(1).join(' ');

            if (!mention || !dmMessage) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Usage: \`${config.prefix}dm <@user> <message>\``)
                    );
                return context.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorBlock]
                });
            }

            const userId = mention.replace(/[<@!>]/g, '');
            try {
                targetUser = await client.users.fetch(userId);
            } catch {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Invalid user provided.`)
                    );
                return context.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorBlock]
                });
            }
        }

        try {
            await targetUser.send({
                content: `📧 **New message from ${context.guild.name}**\n> ${dmMessage}`
            });

            const successBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.checkmark_emoji} **DM Sent!**\n> **To:** ${targetUser.tag}\n> **Message:** ${dmMessage}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [successBlock]
            });
        } catch (err) {
            console.error('[DM ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to send DM. The user might have their DMs closed.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

