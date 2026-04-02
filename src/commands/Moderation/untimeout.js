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
    name: 'untimeout',
    aliases: ['unmute'],
    description: 'Remove timeout from a user in the server.',
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user in the server.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to untimeout.').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the untimeout.')),

    
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
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Usage: \`${config.prefix}untimeout <user> [reason]\``)
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
        if (!member) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} That user is not in the server.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        if (!member.isCommunicationDisabled()) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} That user is not currently timed out.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        try {
            await member.timeout(null, reason);
            
            const caseId = await LoggerService.logCase(client, context.guild, moderator, targetUser, 'UNMUTE', reason);

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.check_emoji} **${targetUser.tag}**'s timeout has been removed. \`Case #${caseId}\`\n> **Reason:** ${reason}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[UNTIMEOUT ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to untimeout the user.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

