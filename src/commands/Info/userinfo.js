const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'userinfo',
    description: 'Show profile and server details for a user.',
    aliases: ['ui', 'whois'],
    cooldown: 5,
    guildOnly: true,
    slashData: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show profile and server details for a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to inspect')
                .setRequired(false)
        ),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const targetUser = isSlash
            ? (context.options.getUser('user') || context.user)
            : (context.mentions?.users?.first() || context.author);

        const guild = context.guild;
        if (!guild) {
            const block = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command only works inside a server.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [block] });
        }

        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        const roles = member
            ? member.roles.cache
                .filter(role => role.id !== guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.name)
                .slice(0, 5)
            : [];

        const infoBlock = new ContainerBuilder()
            .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${config.info_emoji} **${targetUser.tag}**`,
                        `> **User ID:** ${targetUser.id}`,
                        `> **Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                        `> **Joined Server:** ${member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Not in this server'}`,
                        `> **Nickname:** ${member?.nickname || 'None'}`,
                        `> **Top Role:** ${member?.roles.highest?.name || 'None'}`,
                        `> **Key Roles:** ${roles.length ? roles.join(', ') : 'No major roles'}`
                    ].join('\n')
                )
            );

        return context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [infoBlock]
        });
    }
};

