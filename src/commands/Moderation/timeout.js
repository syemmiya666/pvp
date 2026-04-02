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
    name: 'timeout',
    aliases: ['mute'],
    description: 'Mute a user in the server for a specified duration.',
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Mute a user in the server.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to timeout.').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes.').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the timeout.')),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const moderator = isSlash ? context.user : context.author;
        let targetUser, duration, reason;

        if (isSlash) {
            targetUser = context.options.getUser('user');
            duration = context.options.getInteger('duration');
            reason = context.options.getString('reason') || 'No reason provided.';
        } else {
            const args = context.args || [];
            const mention = args[0];
            duration = parseInt(args[1]);
            reason = args.slice(2).join(' ') || 'No reason provided.';

            if (!mention || isNaN(duration)) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Usage: \`${config.prefix}timeout <user> <duration_minutes> [reason]\``)
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

        if (!member.moderatable) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} I cannot timeout this user.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        try {
            const ms = duration * 60 * 1000;
            await member.timeout(ms, reason);
            
            const caseId = await LoggerService.logCase(client, context.guild, moderator, targetUser, 'MUTE', reason, duration);

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.mute_emoji} **${targetUser.tag}** has been timed out for **${duration} minutes**. \`Case #${caseId}\`\n> **Reason:** ${reason}`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        } catch (err) {
            console.error('[TIMEOUT ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to timeout the user.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

