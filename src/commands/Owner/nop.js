const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require('discord.js');
const Nop = require('../../models/Nop');
const config = require('../../config/config.json');

module.exports = {
    name: 'nop',
    description: 'Manage users who can bypass the bot prefix.',
    ownerOnly: true,
    slashData: new SlashCommandBuilder()
        .setName('nop')
        .setDescription('Manage users who can bypass the bot prefix.')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a user to the No-Prefix list.')
                .addUserOption(opt => opt.setName('user').setDescription('The user to add.').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1d, 1h, 1year). Leave empty for permanent.'))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a user from the No-Prefix list.')
                .addUserOption(opt => opt.setName('user').setDescription('The user to remove.').setRequired(true))
        ),

    
    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        let subcommand, targetUser, durationStr;

        if (isSlash) {
            subcommand = context.options.getSubcommand();
            targetUser = context.options.getUser('user');
            durationStr = context.options.getString('duration');
        } else {
            const args = context.args || [];
            subcommand = args[0]?.toLowerCase();
            const mention = args[1];
            durationStr = args.slice(2).join(' ');

            if (!subcommand || !['add', 'remove'].includes(subcommand)) {
                return context.reply({
                    content: `Usage: \`${config.prefix}nop add <user> [duration]\` or \`${config.prefix}nop remove <user>\``
                });
            }

            const userId = mention?.replace(/[<@!>]/g, '');
            try {
                targetUser = await client.users.fetch(userId);
            } catch {
                return context.reply({ content: 'Invalid user provided.' });
            }
        }

        if (subcommand === 'add') {
            let expiresAt = null;
            if (durationStr) {
                const ms = parseDuration(durationStr);
                if (ms) {
                    expiresAt = new Date(Date.now() + ms);
                }
            }

            await Nop.findOneAndUpdate(
                { userId: targetUser.id },
                { expiresAt },
                { upsert: true, returnDocument: 'after' }
            );

            const timeText = expiresAt ? `until ${expiresAt.toLocaleString()}` : 'permanently';
            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.checkmark_emoji} **${targetUser.tag}** can now use Zenith without a prefix ${timeText}.`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        }

        if (subcommand === 'remove') {
            await Nop.deleteOne({ userId: targetUser.id });

            const responseBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.checkmark_emoji} Removed **${targetUser.tag}** from the No-Prefix list.`)
                );

            return context.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [responseBlock]
            });
        }
    },
};

function parseDuration(str) {
    const regex = /(\d+)\s*(year|y|month|mo|week|w|day|d|hour|h|minute|m|second|s)s?/gi;
    let totalMs = 0;
    let match;
    let found = false;

    while ((match = regex.exec(str)) !== null) {
        found = true;
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 'year': case 'y': totalMs += value * 365 * 24 * 60 * 60 * 1000; break;
            case 'month': case 'mo': totalMs += value * 30 * 24 * 60 * 60 * 1000; break;
            case 'week': case 'w': totalMs += value * 7 * 24 * 60 * 60 * 1000; break;
            case 'day': case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
            case 'hour': case 'h': totalMs += value * 60 * 60 * 1000; break;
            case 'minute': case 'm': totalMs += value * 60 * 1000; break;
            case 'second': case 's': totalMs += value * 1000; break;
        }
    }
    return found ? totalMs : null;
}

