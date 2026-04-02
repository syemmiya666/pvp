const {
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = client.slash.get(interaction.commandName);
                if (!command) return;

                const ownerIDs = config.ownerIDs || [];
                const isOwner = ownerIDs.includes(interaction.user.id);

                if (command.ownerOnly && !isOwner) {
                    const errorBlock = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command is restricted to bot owners only.`)
                        );
                    return interaction.reply({
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: [errorBlock]
                    });
                }

                if (command.guildOnly && !interaction.guild) {
                    const accentColor = parseInt(config.color.replace('#', ''), 16);
                    const dmBlock = new ContainerBuilder()
                        .setAccentColor(accentColor)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command can only be used in a server.`)
                        );

                    return interaction.reply({
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: [dmBlock],
                    });
                }

                if (command.permissions && !interaction.member.permissions.has(command.permissions)) {
                    const errorBlock = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${config.crossmark_emoji} You do not have the required permissions to use this command.`)
                        );
                    return interaction.reply({
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: [errorBlock]
                    });
                }

                if (command.cooldown) {
                    const now = Date.now();
                    const commandCooldowns = client.cooldowns.get(interaction.commandName);
                    const cooldownAmount = (command.cooldown || 3) * 1000;

                    if (commandCooldowns.has(interaction.user.id)) {
                        const expirationTime = commandCooldowns.get(interaction.user.id) + cooldownAmount;
                        if (now < expirationTime) {
                            const timeLeft = (expirationTime - now) / 1000;
                            const cooldownBlock = new ContainerBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`${config.warn_emoji} **Slow down!** Please wait \`${timeLeft.toFixed(1)}s\` before using the \`${interaction.commandName}\` command again.`)
                                );
                            return interaction.reply({
                                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                                components: [cooldownBlock]
                            });
                        }
                    }

                    commandCooldowns.set(interaction.user.id, now);
                    setTimeout(() => commandCooldowns.delete(interaction.user.id), cooldownAmount);
                }

                await command.run(client, interaction);
            }
        } catch (err) {
            console.error('[INTERACTION ERROR]', err);

            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('An unexpected error occurred while handling this interaction.')
                    );

                interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [errorBlock],
                }).catch(console.error);
            }
        }
    },
};

