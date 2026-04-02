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
    name: 'purge',
    description: 'Delete multiple messages from a channel.',
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages from a channel.')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of messages to delete (max 100).').setRequired(true).setMinValue(1).setMaxValue(100)),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const moderator = isSlash ? context.user : context.author;
        let amount;

        if (isSlash) {
            amount = context.options.getInteger('amount');
        } else {
            const args = context.args || [];
            amount = parseInt(args[0]);

            if (isNaN(amount) || amount < 1 || amount > 100) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Usage: \`${config.prefix}purge <1-100>\``)
                    );
                return context.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorBlock]
                });
            }
        }

        try {
            const deleted = await context.channel.bulkDelete(amount, true);
            
            const caseId = await LoggerService.logCase(client, context.guild, moderator, { id: context.channel.id, tag: `#${context.channel.name}` }, 'PURGE', `Deleted ${deleted.size} messages.`);

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.check_emoji} Successfully deleted **${deleted.size}** messages. \`Case #${caseId}\``)
                );

            const msg = await context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });

            setTimeout(() => {
                if (isSlash) {
                    context.deleteReply().catch(() => {});
                } else {
                    msg.delete().catch(() => {});
                }
            }, 5000);

        } catch (err) {
            console.error('[PURGE ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to purge messages. Make sure they are not older than 14 days.`)
                );
            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }
    },
};

