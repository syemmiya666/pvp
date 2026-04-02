const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require('discord.js');
const config = require('../../config/config.json');
const LoggerService = require('../../services/LoggerService');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server.',
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server.')
        .addStringOption(opt => opt.setName('user_id').setDescription('The ID of the user to unban.').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the unban.')),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const moderator = isSlash ? context.user : context.author;
        let targetUserId, reason;

        if (isSlash) {
            targetUserId = context.options.getString('user_id');
            reason = context.options.getString('reason') || 'No reason provided.';
        } else {
            const args = context.args || [];
            targetUserId = args[0];
            reason = args.slice(1).join(' ') || 'No reason provided.';

            if (!targetUserId) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please provide a user ID to unban.`)
                    );
                return context.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorBlock]
                });
            }
        }

        try {
            const ban = await context.guild.bans.fetch(targetUserId);
            if (!ban) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} That user is not banned.`)
                    );
                return context.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorBlock]
                });
            }

            await context.guild.members.unban(targetUserId, reason);
            
            const caseId = await LoggerService.logCase(client, context.guild, moderator, ban.user, 'UNBAN', reason);

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.check_emoji} **${ban.user.tag}** has been unbanned. \`Case #${caseId}\`\n> **Reason:** ${reason}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[UNBAN ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to unban the user. Make sure the ID is correct and they are banned.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

