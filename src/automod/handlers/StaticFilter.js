const spamCache = new Map();
const bareDomainRegex = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi;

const normalizeHost = (input) => {
    if (!input) return null;

    const trimmed = String(input).trim().toLowerCase().replace(/[)\],.!?]+$/g, '');
    if (!trimmed) return null;

    try {
        const withScheme = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const hostname = new URL(withScheme).hostname.toLowerCase();
        return hostname.replace(/^www\./, '');
    } catch (error) {
        return null;
    }
};

module.exports = {
    async handle(message, autoMod) {
        if (!autoMod || !autoMod.static) return { isViolation: false };
        const s = autoMod.static;
        const currentContent = message.content || '';
        
        if (s.mentions?.enabled && message.mentions.users.size > s.mentions.limit) {
            return { isViolation: true, reason: `Excessive User Mentions (${message.mentions.users.size} > ${s.mentions.limit})` };
        }

        if (s.attachments?.enabled && message.attachments.size > s.attachments.limit) {
            return { isViolation: true, reason: `Excessive Attachments (${message.attachments.size} > ${s.attachments.limit})` };
        }

        if (s.emojis?.enabled && currentContent) {
            const emojiRegex = /<a?:.+?:\d+>|[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
            const emojiMatches = currentContent.match(emojiRegex);
            const count = emojiMatches ? emojiMatches.length : 0;
            if (count > s.emojis.limit) {
                return { isViolation: true, reason: `Excessive Emojis (${count} > ${s.emojis.limit})` };
            }
        }

        if (s.masslines?.enabled && currentContent) {
            const lineCount = currentContent.split('\n').length;
            if (lineCount > s.masslines.limit) {
                return { isViolation: true, reason: `Too many message lines (${lineCount} > ${s.masslines.limit})` };
            }
        }

        if (s.caps?.enabled && currentContent.length > 10) {
            const lettersOnly = currentContent.replace(/[^a-zA-Z]/g, '');
            if (lettersOnly.length > 5) {
                const upperCount = lettersOnly.replace(/[^A-Z]/g, '').length;
                const percent = (upperCount / lettersOnly.length) * 100;
                if (percent > s.caps.percent) {
                    return { isViolation: true, reason: `Excessive Capitalization (${Math.round(percent)}% > ${s.caps.percent}%)` };
                }
            }
        }

        if (s.invites?.enabled && currentContent) {
            const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
            if (inviteRegex.test(currentContent)) {
                return { isViolation: true, reason: 'Unauthorized Discord Invite Link' };
            }
        }

        if (s.links?.enabled && currentContent) {
            const urls = currentContent.match(bareDomainRegex);
            if (urls) {
                const whitelist = (s.links.whitelist || [])
                    .map(normalizeHost)
                    .filter(Boolean);

                for (const urlStr of urls) {
                    const host = normalizeHost(urlStr);
                    if (!host) continue;

                    const isWhitelisted = whitelist.some(allowedHost =>
                        host === allowedHost || host.endsWith(`.${allowedHost}`)
                    );

                    if (!isWhitelisted) {
                        return { isViolation: true, reason: `Unauthorized External Link (${host})` };
                    }
                }
            }
        }

        if (s.words?.enabled && currentContent && s.words.blacklist?.length > 0) {
            const lowerContent = currentContent.toLowerCase();
            for (const word of s.words.blacklist) {
                if (word.trim() && lowerContent.includes(word.trim().toLowerCase())) {
                    return { isViolation: true, reason: `Blacklisted Word Detected` };
                }
            }
        }

        if (s.spam?.enabled) {
            const now = Date.now();
            const timeWindow = 5000;
            const limit = s.spam.limit || 5;
            
            if (!spamCache.has(message.guild.id)) {
                spamCache.set(message.guild.id, new Map());
            }
            const guildSpam = spamCache.get(message.guild.id);
            
            if (!guildSpam.has(message.author.id)) {
                guildSpam.set(message.author.id, []);
            }
            
            const timestamps = guildSpam.get(message.author.id);
            timestamps.push(now);
            
            while (timestamps.length > 0 && timestamps[0] < now - timeWindow) {
                timestamps.shift();
            }
            
            if (timestamps.length > limit) {
                return { isViolation: true, reason: `Message Spam Detected (${timestamps.length} messages in 5s)` };
            }
        }

        return { isViolation: false };
    }
};

