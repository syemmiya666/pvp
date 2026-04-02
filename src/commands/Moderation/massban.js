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
    name: 'massban',
    description: 'Ban multiple users at once by their IDs.',
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 10,
    slashData: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('Ban multiple users at once.')
        .addStringOption(opt => opt.setName('ids').setDescription('User IDs separated by space.').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the mass ban.')),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const moderator = isSlash ? context.user : context.author;
        let idsInput, reason;

        if (isSlash) {
            idsInput = context.options.getString('ids');
            reason = context.options.getString('reason') || 'Mass ban by moderator.';
        } else {
            const args = context.args || [];
            idsInput = args.join(' ');
            reason = 'Mass ban by moderator.';
            if (!idsInput) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please provide user IDs to ban.`)
                    );
                return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
            }
        }

        const ids = idsInput.split(/[\s,]+/).filter(id => /^\d{17,19}$/.test(id));
        if (ids.length === 0) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} No valid user IDs provided.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
        }

        if (ids.length > 20) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} You can only mass ban up to 20 users at a time.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
        }

        const loadingBlock = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${config.loading_emoji} **Processing Mass Ban...**\n> Target Count: \`${ids.length}\``)
            );
        
        const statusMsg = await context.reply({ flags: MessageFlags.IsComponentsV2, components: [loadingBlock], fetchReply: true });

        let successCount = 0;
        let failCount = 0;

        for (const id of ids) {
            try {
                await context.guild.members.ban(id, { reason });
                successCount++;
            } catch {
                failCount++;
            }
        }

        const caseId = await LoggerService.logCase(client, context.guild, moderator, { id: 'Multiple Users', tag: `${successCount} Users` }, 'MASSBAN', reason);

        const responseBlock = new ContainerBuilder()
            .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${config.ban_emoji} **Mass Ban Complete** \`Case #${caseId}\`\n> ${config.checkmark_emoji} Successful: \`${successCount}\`\n> ${config.crossmark_emoji} Failed: \`${failCount}\`\n> **Reason:** ${reason}`)
            );

        if (isSlash) {
            await context.editReply({ components: [responseBlock] });
        } else {
            await statusMsg.edit({ components: [responseBlock] });
        }
    },
};

