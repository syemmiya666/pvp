const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'avatar',
    description: 'Show a user avatar in full quality.',
    aliases: ['av', 'pfp'],
    cooldown: 4,
    slashData: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Show a user avatar in full quality.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to view')
                .setRequired(false)
        ),

    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const targetUser = isSlash
            ? (context.options.getUser('user') || context.user)
            : (context.mentions?.users?.first() || context.author);

        const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 4096 });

        const block = new ContainerBuilder()
            .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${config.info_emoji} **Avatar for ${targetUser.tag}**`,
                        `> **Direct Link:** ${avatarUrl}`,
                        `> **Tip:** Open the link to download the full-resolution avatar.`
                    ].join('\n')
                )
            );

        return context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [block]
        });
    }
};

