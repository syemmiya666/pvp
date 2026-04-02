const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    AttachmentBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const config = require('../../config/config.json');

const fallbackCategoryEmojis = {
    Info: '<:info:1488844542840148090>',
    Moderation: '<:mod:1488844345284104212>',
    Owner: '<:owner:1488844310542815283>',
    Utility: '<:utility:1488844280121397428>',
    Other: '<:folder:1488844226488696862>'
};

const commandHints = {
    help: 'Open this menu and browse every command category.',
    ping: 'Check bot and API latency in one quick glance.',
    serverinfo: 'See server size, channels, boosts, and ownership details.',
    userinfo: 'Inspect a member account, join date, nickname, and top role.',
    avatar: 'View a user avatar in full quality with a direct image link.',
    botstats: 'See uptime, memory use, ping, and network-wide bot numbers.',
    roleinfo: 'Inspect a role color, position, and member count.',
    ban: 'Ban a user from the server and log the moderation case.',
    case: 'View case details or update the reason on a logged case.',
    clearwarns: 'Remove all saved warnings for a specific member.',
    dm: 'Send a direct message to a user through the bot.',
    kick: 'Kick a member from the server with a tracked case log.',
    lock: 'Lock the current text channel to pause conversation.',
    massban: 'Ban multiple user IDs at once for cleanup waves.',
    nuke: 'Clone and reset a channel to wipe its messages fast.',
    purge: 'Bulk delete a batch of recent messages.',
    timeout: 'Temporarily mute a member for a chosen duration.',
    unban: 'Unban a previously banned user by ID.',
    unlock: 'Reopen a locked text channel.',
    untimeout: 'Remove an active timeout from a member.',
    warn: 'Add, list, or manage moderation warnings.',
    dok: 'Run owner-only Dokdo utilities.',
    nop: 'Manage no-prefix access for selected users.'
};

const prettifyText = (value) => {
    if (!value) return 'Other';

    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
};

const getCommandSummary = (command) => {
    const hint = commandHints[command.name];
    if (hint) return hint;
    if (command.description) return prettifyText(command.description);
    return 'No description has been set for this command yet.';
};

const formatCategoryOverview = (commands, prefix) => {
    const lines = commands
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(command => {
            const slash = command.slashData ? ` • \`/${command.name}\`` : '';
            return `• ${prefix}\`${command.name}\`${slash}\n  ${getCommandSummary(command)}`;
        });

    return lines.length ? lines.join('\n\n') : 'No commands are available in this category right now.';
};

const clonePagePayload = (page) => ({
    components: page.components,
    files: page.files
});

module.exports = {
    name: 'help',
    description: 'Browse command categories with short command explanations.',
    aliases: ['h', 'commands'],
    cooldown: 5,
    slashData: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Browse command categories with short command explanations.'),

    run: async (client, context) => {
        const isSlash = context.isChatInputCommand?.() || false;
        const user = isSlash ? context.user : context.author;
        const ownerIDs = config.ownerIDs || [];
        const isOwner = ownerIDs.includes(user.id);
        const prefix = config.prefix || 'z!';
        const accentColorInt = parseInt(String(config.color || '#2f3136').replace('#', ''), 16);
        const botAvatar = client.user.displayAvatarURL({ extension: 'png', size: 256 });

        const loadingBlock = new ContainerBuilder()
            .setAccentColor(accentColorInt)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${config.loading_emoji} **Building the help menu...**\n${config.verify_emoji || config.checkmark_emoji} Gathering commands, categories, and examples for you.`)
            );

        const loadingMsg = await context.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [loadingBlock],
            fetchReply: true
        });

        const categories = {};
        client.commands.forEach(command => {
            const category = command.category || 'Other';
            if ((category === 'Owner' || command.ownerOnly) && !isOwner) return;
            if (!categories[category]) categories[category] = [];
            if (!categories[category].some(existing => existing.name === command.name)) {
                categories[category].push(command);
            }
        });

        const totalCommands = Object.values(categories).reduce((count, list) => count + list.length, 0);

        const generateBanner = async (title, subtitle) => {
            const canvas = createCanvas(800, 250);
            const ctx = canvas.getContext('2d');

            const bgGradient = ctx.createLinearGradient(0, 0, 800, 250);
            bgGradient.addColorStop(0, '#04060d');
            bgGradient.addColorStop(1, '#131926');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, 800, 250);

            ctx.strokeStyle = config.color || '#5865F2';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.08;
            for (let i = 0; i < 800; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 250);
                ctx.stroke();
            }
            for (let i = 0; i < 250; i += 40) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(800, i);
                ctx.stroke();
            }

            ctx.globalAlpha = 0.18;
            ctx.fillStyle = config.color || '#5865F2';
            ctx.beginPath();
            ctx.moveTo(540, 250);
            ctx.lineTo(800, 250);
            ctx.lineTo(800, 0);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.85;
            ctx.lineWidth = 3;
            ctx.strokeStyle = config.color || '#5865F2';
            ctx.beginPath();
            ctx.moveTo(20, 40);
            ctx.lineTo(20, 20);
            ctx.lineTo(40, 20);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(760, 230);
            ctx.lineTo(780, 230);
            ctx.lineTo(780, 210);
            ctx.stroke();

            const avatar = await loadImage(botAvatar);
            ctx.shadowBlur = 20;
            ctx.shadowColor = config.color || '#5865F2';
            ctx.save();
            ctx.beginPath();
            ctx.arc(120, 125, 75, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 45, 50, 150, 150);
            ctx.restore();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(120, 125, 75, 0, Math.PI * 2, true);
            ctx.stroke();
            ctx.strokeStyle = config.color || '#5865F2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(120, 125, 82, 0, Math.PI * 2, true);
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = config.color || '#5865F2';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('>> HELP SYSTEM READY', 230, 75);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 54px sans-serif';
            ctx.fillText(title, 230, 130);

            ctx.fillStyle = config.color || '#5865F2';
            ctx.fillRect(230, 145, 220, 6);

            ctx.fillStyle = '#a0aec0';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(subtitle, 230, 185);

            ctx.font = '14px monospace';
            ctx.fillStyle = config.color || '#5865F2';
            ctx.fillText(`[ COMMANDS_INDEXED: ${String(totalCommands).padStart(3, '0')} ]`, 230, 215);

            return canvas.toBuffer('image/png');
        };

        const buildSelectMenu = (selectedCategory = null) => {
            const configuredEmojis = config.category_emojis || {};
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder(`${config.info_emoji} Jump to a command category...`)
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Home')
                        .setDescription('See the main overview again')
                        .setEmoji(config.info_emoji)
                        .setValue('help_home')
                        .setDefault(!selectedCategory)
                );

            Object.keys(categories).sort((a, b) => a.localeCompare(b)).forEach(categoryName => {
                const emoji = configuredEmojis[categoryName] || fallbackCategoryEmojis[categoryName] || config.info_emoji;
                const commands = categories[categoryName] || [];
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(categoryName)
                        .setDescription(`${commands.length} command${commands.length === 1 ? '' : 's'} to explore`)
                        .setEmoji(emoji)
                        .setValue(`help_cat_${categoryName.toLowerCase()}`)
                        .setDefault(categoryName.toLowerCase() === selectedCategory?.toLowerCase())
                );
            });

            return new ActionRowBuilder().addComponents(selectMenu);
        };

        const createHomePage = async () => {
            const buffer = await generateBanner('ZENITH HELP', 'Pick a category below');
            const attachment = new AttachmentBuilder(buffer, { name: 'help_main.png' });
            const gallery = new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL('attachment://help_main.png')
            );

            const categoryLines = Object.keys(categories)
                .sort((a, b) => a.localeCompare(b))
                .map(categoryName => {
                    const emoji = (config.category_emojis || {})[categoryName] || fallbackCategoryEmojis[categoryName] || config.info_emoji;
                    const commands = categories[categoryName] || [];
                    return `${emoji} **${categoryName}** â€” ${commands.length} command${commands.length === 1 ? '' : 's'}`;
                })
                .join('\n');

            const container = new ContainerBuilder()
                .setAccentColor(accentColorInt)
                .addMediaGalleryComponents(gallery)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.info_emoji} **${config.botName || 'Zenith'} Command Center**`),
                    new TextDisplayBuilder().setContent(`Use the menu below to browse commands by category.\n${config.verify_emoji || config.checkmark_emoji} Prefix commands use \`${prefix}\` and many also support slash versions.`),
                    new TextDisplayBuilder().setContent(`${config.category_emojis?.Other || fallbackCategoryEmojis.Other} **Categories**\n${categoryLines || 'No categories available.'}`),
                    new TextDisplayBuilder().setContent(`${config.welcome_emoji || config.info_emoji} **Quick tip:** pick a category to see what each command actually does, not just its name.`)
                )
                .addActionRowComponents(buildSelectMenu());

            return { components: [container], files: [attachment] };
        };

        const createCategoryPage = async (categoryName) => {
            const matchedCategory = Object.keys(categories).find(name => name.toLowerCase() === categoryName.toLowerCase()) || categoryName;
            const commands = categories[matchedCategory] || [];
            const emoji = (config.category_emojis || {})[matchedCategory] || fallbackCategoryEmojis[matchedCategory] || config.info_emoji;
            const buffer = await generateBanner(matchedCategory.toUpperCase(), 'Commands and quick explanations');
            const attachment = new AttachmentBuilder(buffer, { name: `help_${matchedCategory}.png` });
            const gallery = new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(`attachment://help_${matchedCategory}.png`)
            );

            const container = new ContainerBuilder()
                .setAccentColor(accentColorInt)
                .addMediaGalleryComponents(gallery)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emoji} **${matchedCategory} Commands**`),
                    new TextDisplayBuilder().setContent(`Hereâ€™s what each command in **${matchedCategory}** is for:`),
                    new TextDisplayBuilder().setContent(formatCategoryOverview(commands, prefix)),
                    new TextDisplayBuilder().setContent(`${config.loading_emoji} Need another section? Use the menu below to jump around.`)
                )
                .addActionRowComponents(buildSelectMenu(matchedCategory));

            return { components: [container], files: [attachment] };
        };

        const pageCache = new Map();
        const getPage = async (key) => {
            if (!pageCache.has(key)) {
                pageCache.set(key, key === 'home' ? createHomePage() : createCategoryPage(key));
            }
            return pageCache.get(key);
        };

        const initialPage = await getPage('home');
        await loadingMsg.edit({
            ...clonePagePayload(initialPage),
            flags: MessageFlags.IsComponentsV2
        });

        for (const categoryName of Object.keys(categories)) {
            void getPage(categoryName.toLowerCase()).catch(error => {
                console.error(`[HELP_CACHE_ERROR] Failed to build ${categoryName}:`, error);
                pageCache.delete(categoryName.toLowerCase());
            });
        }

        const collector = loadingMsg.createMessageComponentCollector({
            filter: interaction => interaction.user.id === user.id && interaction.customId === 'help_select',
            time: 90000,
            componentType: ComponentType.StringSelect
        });

        collector.on('collect', async interaction => {
            try {
                const loadingState = new ContainerBuilder()
                    .setAccentColor(accentColorInt)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.loading_emoji} **Opening that help page...**\n${config.verify_emoji || config.checkmark_emoji} One sec while I load the next section.`)
                    );

                await interaction.update({
                    components: [loadingState],
                    files: [],
                    flags: MessageFlags.IsComponentsV2
                });

                const value = interaction.values[0];
                const pageKey = value === 'help_home' ? 'home' : value.replace('help_cat_', '');
                const nextPage = await getPage(pageKey);

                await loadingMsg.edit({
                    ...clonePagePayload(nextPage),
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
                console.error('[HELP_INTERACTION_ERROR]', error);
            }
        });

        collector.on('end', async () => {
            try {
                const timeoutBlock = new ContainerBuilder()
                    .setAccentColor(accentColorInt)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.warn_emoji} **Help session expired**`),
                        new TextDisplayBuilder().setContent(`Run \`${prefix}help\` again any time if you want to reopen the menu.`)
                    );

                await loadingMsg.edit({
                    components: [timeoutBlock],
                    files: [],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
            }
        });
    }
};

