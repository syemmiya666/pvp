const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'roleinfo',
    description: 'Inspect a server role and its metadata.',
    aliases: ['ri'],
    cooldown: 5,
    guildOnly: true,
    slashData: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Inspect a server role and its metadata.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to inspect')
                .setRequired(true)
        ),

    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const guild = context.guild;

        if (!guild) {
            const block = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command only works inside a server.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [block] });
        }

        const role = isSlash
            ? context.options.getRole('role')
            : (context.mentions?.roles?.first() || guild.roles.cache.get(context.args?.[0]));

        if (!role) {
            const block = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} Please mention a valid role or provide its ID.`)
                );
            return context.reply({ flags: MessageFlags.IsComponentsV2, components: [block] });
        }

        const membersWithRole = role.members?.size ?? guild.members.cache.filter(member => member.roles.cache.has(role.id)).size;

        const block = new ContainerBuilder()
            .setAccentColor(parseInt(String(role.hexColor && role.hexColor !== '#000000' ? role.hexColor : config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${config.info_emoji} **Role Info: ${role.name}**`,
                        `> **Role ID:** ${role.id}`,
                        `> **Color:** ${role.hexColor}`,
                        `> **Position:** ${role.position}`,
                        `> **Members:** ${membersWithRole}`,
                        `> **Mentionable:** ${role.mentionable ? 'Yes' : 'No'}`,
                        `> **Hoisted:** ${role.hoist ? 'Yes' : 'No'}`,
                        `> **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:F>`
                    ].join('\n')
                )
            );

        return context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [block]
        });
    }
};

