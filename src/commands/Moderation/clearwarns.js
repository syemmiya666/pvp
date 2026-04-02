const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require('discord.js');
const Warning = require('../../models/Warning');
const config = require('../../config/config.json');

module.exports = {
    name: 'clearwarns',
    description: 'Clear all warnings for a user.',
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings for a user.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to clear warnings for.').setRequired(true)),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let targetUser;

        if (isSlash) {
            targetUser = context.options.getUser('user');
        } else {
            const args = context.args || [];
            const mention = args[0];

            if (!mention) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please provide a user to clear warnings for.`)
                    );
                return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
            }

            const userId = mention.replace(/[<@!>]/g, '');
            try {
                targetUser = await client.users.fetch(userId);
            } catch {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Invalid user provided.`)
                    );
                return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
            }
        }

        try {
            const result = await Warning.deleteMany({ guildId: context.guild.id, userId: targetUser.id });

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.checkmark_emoji} **Warnings Cleared**\n> User: <@${targetUser.id}>\n> Amount: \`${result.deletedCount}\``)
                );

            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [responseBlock] });
        } catch (err) {
            console.error('[CLEARWARNS ERROR]', err);
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Failed to clear warnings.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [errorBlock] });
        }
    },
};

