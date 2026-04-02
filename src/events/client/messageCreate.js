const config = require('../../config/config.json');
const Nop = require('../../models/Nop');
const Tesseract = require('tesseract.js');
const {
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    SeparatorBuilder
} = require('discord.js');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAutoModLogBlock = (title, colorHex, lines) => new ContainerBuilder()
    .setAccentColor(parseInt(colorHex.replace('#', ''), 16))
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent([title, ...lines].join('\n'))
    );

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        if (!message || !message.guild) return;
        if (message.author?.bot) return;

        if (message.guild && message.content && !message.member.permissions.has('Administrator')) {
            const AutoModConfig = require('../../automod/models/AutoModConfig');
            const autoMod = await AutoModConfig.findOne({ guildId: message.guild.id, enabled: true });

            if (autoMod) {
                const StaticFilter = require('../../automod/handlers/StaticFilter');
                const staticCheck = await StaticFilter.handle(message, autoMod);

                if (staticCheck.isViolation) {
                    if (autoMod.actions.deleteMessage) {
                        await message.delete().catch(() => {});
                    }

                    if (autoMod.actions.warnUser) {
                        const Warning = require('../../models/Warning');
                        const warning = new Warning({
                            guildId: message.guild.id,
                            userId: message.author.id,
                            reason: `[AutoMod] ${staticCheck.reason}`,
                            moderatorId: client.user.id
                        });
                        await warning.save();
                    }

                    if (autoMod.actions.muteUser && message.member.moderatable) {
                        const durationMs = (autoMod.actions.muteDuration || 10) * 60 * 1000;
                        await message.member.timeout(durationMs, `[AutoMod] ${staticCheck.reason}`).catch(() => {});
                    }

                    const LoggerService = require('../../services/LoggerService');
                    await LoggerService.logCase(
                        client,
                        message.guild,
                        client.user,
                        message.author,
                        autoMod.actions.muteUser ? 'MUTE' : (autoMod.actions.warnUser ? 'WARN' : 'PURGE'),
                        `[AutoMod] ${staticCheck.reason}`,
                        autoMod.actions.muteUser ? autoMod.actions.muteDuration : null
                    );

                    if (autoMod.actions.reportToModerators && autoMod.actions.logsChannelId) {
                        const logChannel = message.guild.channels.cache.get(autoMod.actions.logsChannelId);
                        if (logChannel) {
                            const actionTaken = [
                                autoMod.actions.deleteMessage ? 'Delete' : null,
                                autoMod.actions.warnUser ? 'Warn' : null,
                                autoMod.actions.muteUser ? 'Mute' : null
                            ].filter(Boolean).join(' + ') || 'Logged only';

                            const logBlock = buildAutoModLogBlock('🛡️ **Static Auto-Moderation Alert**', '#ff9900', [
                                `> **User:** <@${message.author.id}> (${message.author.id})`,
                                `> **Channel:** <#${message.channel.id}>`,
                                `> **Reason:** ${staticCheck.reason}`,
                                `> **Action Taken:** ${actionTaken}`,
                                `> **Message:** ${(message.content || 'Attachment/Embed').substring(0, 900)}`,
                                `> **Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                            ]);

                            await logChannel.send({
                                flags: MessageFlags.IsComponentsV2,
                                components: [logBlock]
                            }).catch(() => {});
                        }
                    }

                    const warningMsg = await message.channel.send(`<@${message.author.id}>, your message was removed by Auto-Moderation for: **${staticCheck.reason}**.`);
                    setTimeout(() => warningMsg.delete().catch(() => null), 5000);
                    return;
                }

                const needsScan = autoMod.ai.insults.enabled || autoMod.ai.threats.enabled || autoMod.ai.identityAttacks.enabled || autoMod.ai.offensiveLanguage.enabled;
                if (needsScan) {
                    try {
                        const { Groq } = require('groq-sdk');
                        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

                        const prompt = `Analyze this message for Discord community safety. Return strictly valid JSON. Format: {"insults": boolean, "threats": boolean, "identityAttacks": boolean, "offensiveLanguage": boolean, "reason": "short explanation"}. Message: "${message.content}"`;

                        const completion = await groq.chat.completions.create({
                            messages: [
                                { role: 'system', content: 'You are a precise JSON-only Discord Auto-Moderation AI. You strictly return JSON objects without markdown wrappers.' },
                                { role: 'user', content: prompt }
                            ],
                            model: 'llama-3.1-8b-instant',
                            temperature: 0.1,
                            response_format: { type: 'json_object' }
                        });

                        const result = JSON.parse(completion.choices[0].message.content);
                        let isViolation = false;
                        let violationReason = '';

                        if (autoMod.ai.insults.enabled && result.insults) { isViolation = true; violationReason = 'Insults'; }
                        if (autoMod.ai.threats.enabled && result.threats) { isViolation = true; violationReason = 'Threats'; }
                        if (autoMod.ai.identityAttacks.enabled && result.identityAttacks) { isViolation = true; violationReason = 'Identity Attacks'; }
                        if (autoMod.ai.offensiveLanguage.enabled && result.offensiveLanguage) { isViolation = true; violationReason = 'Offensive Language'; }

                        if (isViolation) {
                            if (autoMod.actions.deleteMessage) {
                                await message.delete().catch(() => {});
                            }

                            if (autoMod.actions.reportToModerators && autoMod.actions.logsChannelId) {
                                const logChannel = message.guild.channels.cache.get(autoMod.actions.logsChannelId);
                                if (logChannel) {
                                    const logBlock = buildAutoModLogBlock('ðŸ¤– **AI Auto-Moderation Alert**', '#ff3333', [
                                        `> **User:** <@${message.author.id}> (${message.author.id})`,
                                        `> **Channel:** <#${message.channel.id}>`,
                                        `> **Reason:** ${result.reason || violationReason}`,
                                        `> **Original Message:** ${(message.content || 'No message content').substring(0, 900)}`,
                                        `> **Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                                    ]);

                                    await logChannel.send({
                                        flags: MessageFlags.IsComponentsV2,
                                        components: [logBlock]
                                    }).catch(() => {});
                                }
                            }

                            const warningMsg = await message.channel.send(`<@${message.author.id}>, your message was removed by AI Auto-Moderation for: **${violationReason}**.`);
                            setTimeout(() => warningMsg.delete().catch(() => null), 5000);
                            return;
                        }
                    } catch (e) {
                        console.error('[AI AUTOMOD ERROR]', e);
                    }
                }
            }
        }

        if (!message.content) return;

        const ownerIDs = config.ownerIDs || [];
        const isOwner = ownerIDs.includes(message.author.id);

        let isNop = false;
        if (!isOwner) {
            const nopData = await Nop.findOne({ userId: message.author.id });
            if (nopData) {
                if (!nopData.expiresAt || nopData.expiresAt > new Date()) {
                    isNop = true;
                } else {
                    await Nop.deleteOne({ userId: message.author.id });
                }
            }
        }

        const prefix = typeof config.prefix === 'string' ? config.prefix.trim() : 'z!';
        const botName = typeof config.botName === 'string' && config.botName.trim().length > 0
            ? config.botName.trim().toLowerCase()
            : 'zenith';
        const mentionRegex = client.user
            ? new RegExp(`^<@!?${escapeRegex(client.user.id)}>(?:\\s+|$)`)
            : null;

        let content = message.content.trim();
        let triggerMatched = false;

        if (isOwner || isNop) {
            const firstWord = content.split(/\s+/)[0].toLowerCase();
            if (client.commands.has(firstWord) || client.aliases.has(firstWord)) {
                triggerMatched = true;
            }
        }

        if (!triggerMatched && mentionRegex) {
            const mentionMatch = content.match(mentionRegex);
            if (mentionMatch) {
                triggerMatched = true;
                content = content.slice(mentionMatch[0].length).trim();
            }
        }

        if (!triggerMatched && prefix && content.startsWith(prefix)) {
            triggerMatched = true;
            content = content.slice(prefix.length).trim();
        }

        if (!triggerMatched && botName) {
            const botNameRegex = new RegExp(`^${escapeRegex(botName)}(?:\\s+|$)`, 'i');
            const nameMatch = content.match(botNameRegex);
            if (nameMatch) {
                triggerMatched = true;
                content = content.slice(nameMatch[0].length).trim();
            }
        }

        if (!triggerMatched) return;

        const args = content.split(/\s+/).filter(Boolean);
        if (args.length === 0) return;

        const input = args.shift().toLowerCase();
        const resolvedName = client.commands.has(input) ? input : client.aliases.get(input);
        if (!resolvedName) return;

        const command = client.commands.get(resolvedName);
        if (!command || typeof command.run !== 'function') return;

        if (command.ownerOnly && !isOwner) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command is restricted to bot owners only.`)
                );
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${config.crossmark_emoji} You do not have the required permissions to use this command.`)
                );
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorBlock]
            });
        }

        if (command.cooldown) {
            const now = Date.now();
            const commandCooldowns = client.cooldowns.get(resolvedName);
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (commandCooldowns.has(message.author.id)) {
                const expirationTime = commandCooldowns.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    const cooldownBlock = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${config.warn_emoji} **Slow down!** Please wait \`${timeLeft.toFixed(1)}s\` before using the \`${resolvedName}\` command again.`)
                        );
                    return message.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [cooldownBlock]
                    });
                }
            }

            commandCooldowns.set(message.author.id, now);
            setTimeout(() => commandCooldowns.delete(message.author.id), cooldownAmount);
        }

        message.args = args;

        try {
            await command.run(client, message);
        } catch (error) {
            console.error(`[MESSAGE COMMAND ERROR] ${resolvedName}:`, error);
            const errorText = new TextDisplayBuilder()
                .setContent('âš ï¸ **Command Error**\nAn unexpected error occurred while running that command.');

            const sep = new SeparatorBuilder();
            const container = new ContainerBuilder()
                .setAccentColor(parseInt(String(config.color || '#2f3136').replace('#', ''), 16))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(errorText)
                .addSeparatorComponents(sep);

            await message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            }).catch(() => null);
        }
    }
};

