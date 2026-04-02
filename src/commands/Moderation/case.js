const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const Case = require('../../models/Case');
const config = require('../../config/config.json');

module.exports = {
    name: 'case',
    description: 'View or update a moderation case.',
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 3,
    slashData: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Manage moderation cases.')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View details of a specific case.')
                .addIntegerOption(opt => opt.setName('id').setDescription('The Case ID.').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('reason')
                .setDescription('Update the reason for a case.')
                .addIntegerOption(opt => opt.setName('id').setDescription('The Case ID.').setRequired(true))
                .addStringOption(opt => opt.setName('new_reason').setDescription('The new reason.').setRequired(true))
        ),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let subcommand, caseId, newReason;

        if (isSlash) {
            subcommand = context.options.getSubcommand();
            caseId = context.options.getInteger('id');
            newReason = context.options.getString('new_reason');
        } else {
            const args = context.args || [];
            subcommand = args[0]?.toLowerCase();
            caseId = parseInt(args[1]);
            newReason = args.slice(2).join(' ');

            if (!subcommand || isNaN(caseId)) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Usage: \`${config.prefix}case view <id>\` or \`reason <id> <new reason>\``)
                    );
                return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
            }
        }

        const caseData = await Case.findOne({ guildId: context.guild.id, caseId });
        if (!caseData) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Case \`#${caseId}\` not found.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
        }

        if (subcommand === 'view') {
            const caseLines = [
                `${config.category_emojis?.Moderation || config.info_emoji} **Moderation Case #${caseId}**`,
                `> **Action:** ${caseData.action}`,
                `> **Target:** <@${caseData.targetId}> (${caseData.targetTag})`,
                `> **Moderator:** <@${caseData.moderatorId}> (${caseData.moderatorTag})`,
                `> **Reason:** ${caseData.reason || 'No reason provided.'}`,
                `> **Date:** <t:${Math.floor(caseData.timestamp.getTime() / 1000)}:F>`
            ];

            if (caseData.duration) {
                caseLines.push(`> **Duration:** ${caseData.duration} minutes`);
            }

            const responseBlock = new ContainerBuilder()
                .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(caseLines.join('\n'))
                );

            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [responseBlock] });
        }

        if (subcommand === 'reason') {
            if (!newReason) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please provide a new reason.`)
                    );
                return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
            }

            caseData.reason = newReason;
            await caseData.save();

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.checkmark_emoji} Reason for Case \`#${caseId}\` updated successfully.`)
                );

            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [responseBlock] });
        }
    },
};

