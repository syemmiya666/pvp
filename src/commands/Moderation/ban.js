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
    name: 'ban',
    description: 'Ban a member from the server.',
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to ban.').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban.')),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const moderator = isSlash ? context.user : context.author;
        let targetUser, reason;

        if (isSlash) {
            targetUser = context.options.getUser('user');
            reason = context.options.getString('reason') || 'No reason provided.';
        } else {
            const args = context.args || [];
            const mention = args[0];
            reason = args.slice(1).join(' ') || 'No reason provided.';

            if (!mention) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please provide a user to ban.`)
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

        const member = context.guild.members.cache.get(targetUser.id);
        if (member && !member.bannable) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} I cannot ban this user. They might have a higher role than me.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        try {
            await context.guild.members.ban(targetUser.id, { reason });
            
            const caseId = await LoggerService.logCase(client, context.guild, moderator, targetUser, 'BAN', reason);

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.ban_emoji} **${targetUser.tag}** has been banned. \`Case #${caseId}\`\n> **Reason:** ${reason}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[BAN ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to ban the user.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

