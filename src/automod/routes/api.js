const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const AutoModConfig = require('../models/AutoModConfig');
const Warning = require('../../models/Warning');
const Case = require('../../models/Case');
const StaticFilter = require('../handlers/StaticFilter');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'zenith-saas-premium-secret';

const normalizeHost = (input) => {
    if (!input) return null;

    const trimmed = String(input).trim().toLowerCase().replace(/[)\],.!?]+$/g, '');
    if (!trimmed) return null;

    try {
        const withScheme = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const hostname = new URL(withScheme).hostname.toLowerCase();
        return hostname.replace(/^www\./, '');
    } catch (error) {
        return trimmed.replace(/^www\./, '');
    }
};

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://cdn.discordapp.com", "https://raw.githubusercontent.com", "https://avatars.githubusercontent.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://discord.com"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());

const reactPath = path.join(__dirname, '../../../dashboard/dist');
app.use(express.static(reactPath));

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const requireGuildAdmin = (getGuildId) => {
    return (req, res, next) => {
        const guildId = getGuildId(req);
        if (!req.user.allowedGuilds || !req.user.allowedGuilds.some(g => g.id === guildId)) {
            return res.status(403).json({ error: 'Forbidden: You lack Administrator permissions for this server.' });
        }
        next();
    };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sanitizeAutoModPayload = (payload = {}) => {
    const config = JSON.parse(JSON.stringify(payload));

    config.enabled = Boolean(config.enabled);

    config.ai = config.ai || {};
    for (const key of ['insults', 'threats', 'identityAttacks', 'offensiveLanguage']) {
        const entry = config.ai[key] || {};
        config.ai[key] = {
            enabled: Boolean(entry.enabled),
            level: ['Low', 'Medium', 'Strict'].includes(entry.level) ? entry.level : 'Medium'
        };
    }

    config.static = config.static || {};
    const numberFields = [
        ['spam', 'limit', 1, 20, 5],
        ['mentions', 'limit', 1, 25, 5],
        ['attachments', 'limit', 1, 20, 4],
        ['emojis', 'limit', 1, 50, 10],
        ['masslines', 'limit', 1, 50, 15],
        ['caps', 'percent', 10, 100, 70],
        ['warns', 'limit', 1, 10, 3]
    ];

    for (const [section, field, min, max, fallback] of numberFields) {
        const entry = config.static[section] || {};
        config.static[section] = {
            enabled: Boolean(entry.enabled),
            [field]: clamp(Number.isFinite(Number(entry[field])) ? Number(entry[field]) : fallback, min, max)
        };
    }

    config.static.words = {
        enabled: Boolean(config.static.words?.enabled),
        blacklist: Array.isArray(config.static.words?.blacklist)
            ? [...new Set(config.static.words.blacklist.map(word => String(word).trim().toLowerCase()).filter(Boolean))]
            : []
    };

    config.static.links = {
        enabled: Boolean(config.static.links?.enabled),
        whitelist: Array.isArray(config.static.links?.whitelist)
            ? [...new Set(config.static.links.whitelist.map(normalizeHost).filter(Boolean))]
            : []
    };

    config.static.invites = {
        enabled: Boolean(config.static.invites?.enabled)
    };

    config.actions = config.actions || {};
    config.actions = {
        reportToModerators: Boolean(config.actions.reportToModerators),
        deleteMessage: Boolean(config.actions.deleteMessage),
        logsChannelId: config.actions.logsChannelId ? String(config.actions.logsChannelId) : null,
        warnUser: Boolean(config.actions.warnUser),
        muteUser: Boolean(config.actions.muteUser),
        muteDuration: clamp(Number.isFinite(Number(config.actions.muteDuration)) ? Number(config.actions.muteDuration) : 10, 1, 1440)
    };

    return config;
};

const buildAutoModRecommendations = (autoModConfig) => {
    const suggestions = [];
    const activeStatic = Object.entries(autoModConfig.static || {}).filter(([, value]) => value?.enabled).length;
    const activeAi = Object.values(autoModConfig.ai || {}).filter(value => value?.enabled).length;

    if (autoModConfig.enabled && !autoModConfig.actions.deleteMessage) {
        suggestions.push({
            level: 'warning',
            title: 'Deletion is disabled',
            description: 'Violations will be detected but left visible unless moderators act manually.'
        });
    }

    if (autoModConfig.actions.reportToModerators && !autoModConfig.actions.logsChannelId) {
        suggestions.push({
            level: 'danger',
            title: 'Missing log channel',
            description: 'Moderator reporting is enabled, but no log channel is configured.'
        });
    }

    if (autoModConfig.enabled && activeStatic === 0 && activeAi === 0) {
        suggestions.push({
            level: 'danger',
            title: 'Protection is effectively off',
            description: 'AutoMod is enabled, but no static or AI filters are turned on.'
        });
    }

    if (autoModConfig.static.links?.enabled && (autoModConfig.static.links.whitelist || []).length === 0) {
        suggestions.push({
            level: 'info',
            title: 'No whitelisted domains',
            description: 'All external links will be blocked until you add trusted domains.'
        });
    }

    if (autoModConfig.actions.muteUser && autoModConfig.actions.muteDuration >= 180) {
        suggestions.push({
            level: 'info',
            title: 'Long mute duration',
            description: 'Timeouts over 3 hours can feel punitive for first-time offenders.'
        });
    }

    if (autoModConfig.static.words?.enabled && (autoModConfig.static.words.blacklist || []).length === 0) {
        suggestions.push({
            level: 'warning',
            title: 'Word blacklist is empty',
            description: 'The custom words filter is enabled but has no blocked phrases yet.'
        });
    }

    if (autoModConfig.static.spam?.enabled && autoModConfig.static.spam.limit <= 2) {
        suggestions.push({
            level: 'info',
            title: 'Very strict spam threshold',
            description: 'A limit this low can catch normal fast-paced chat during active moments.'
        });
    }

    return suggestions;
};

const buildConfigCoverage = (autoModConfig) => {
    const staticEntries = Object.entries(autoModConfig.static || {});
    const aiEntries = Object.entries(autoModConfig.ai || {});

    return {
        staticEnabled: staticEntries.filter(([, value]) => value?.enabled).length,
        staticTotal: staticEntries.length,
        aiEnabled: aiEntries.filter(([, value]) => value?.enabled).length,
        aiTotal: aiEntries.length,
        wordsCount: autoModConfig.static?.words?.blacklist?.length || 0,
        whitelistedDomains: autoModConfig.static?.links?.whitelist?.length || 0,
        automationsEnabled: Object.entries(autoModConfig.actions || {}).filter(([key, value]) => key !== 'logsChannelId' && value === true).length
    };
};

const buildCommandCatalog = () => {
    if (!botClient?.commands) return [];

    return [...botClient.commands.values()]
        .filter((command, index, array) => array.findIndex(item => item.name === command.name) === index)
        .map(command => ({
            name: command.name,
            description: command.description || 'No description provided.',
            category: command.category || 'Other',
            aliases: Array.isArray(command.aliases) ? command.aliases : [],
            cooldown: command.cooldown || 0,
            ownerOnly: Boolean(command.ownerOnly),
            slash: Boolean(command.slashData),
            permissions: Array.isArray(command.permissions) ? command.permissions : [],
            usage: command.usage || null
        }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
};

app.get('/api/auth/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENTID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/login?error=NoCode');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENTID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const { access_token } = tokenResponse.data;
        const [userResponse, guildsResponse] = await Promise.all([
            axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access_token}` } }),
            axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${access_token}` } })
        ]);

        const allowedGuilds = guildsResponse.data.filter(g => {
            if (botClient && !botClient.guilds.cache.has(g.id)) return false;
            const perms = BigInt(g.permissions);
            return g.owner || (perms & 0x8n) === 0x8n || (perms & 0x20n) === 0x20n;
        }).map(g => ({ id: g.id, name: g.name, icon: g.icon }));

        const user = userResponse.data;
        const token = jwt.sign({ userId: user.id, username: user.username, avatar: user.avatar, allowedGuilds }, JWT_SECRET, { expiresIn: '7d' });
        res.redirect(`/login?token=${token}`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.redirect('/login?error=AuthFailed');
    }
});

app.get('/api/guilds/:guildId/data', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        if (!botClient) return res.status(503).json({ error: 'Bot Client Unavailable' });
        const guild = botClient.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Guild Not Found' });

        const channels = guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
        const roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
        const categories = guild.channels.cache.filter(c => c.type === 4).map(c => ({ id: c.id, name: c.name }));

        res.json({ channels, roles, categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/moderation/:guildId/warnings', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const warnings = await Warning.find({ guildId: req.params.guildId }).sort({ timestamp: -1 });
        res.json(warnings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/moderation/:guildId/cases', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const cases = await Case.find({ guildId: req.params.guildId }).sort({ caseId: -1 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/moderation/:guildId/stats', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const now = Date.now();
        const last24hDate = new Date(now - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const [totalCases, totalWarnings, last24h, actionBreakdown, dailyBreakdown, recentActivity, topTargets, topModerators, autoModConfig] = await Promise.all([
            Case.countDocuments({ guildId }),
            Warning.countDocuments({ guildId }),
            Case.countDocuments({ guildId, timestamp: { $gte: last24hDate } }),
            Case.aggregate([
                { $match: { guildId } },
                { $group: { _id: '$action', count: { $sum: 1 } } }
            ]),
            Case.aggregate([
                { $match: { guildId, timestamp: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Case.find({ guildId }).sort({ timestamp: -1 }).limit(8),
            Case.aggregate([
                { $match: { guildId } },
                {
                    $group: {
                        _id: '$targetId',
                        targetTag: { $last: '$targetTag' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            Case.aggregate([
                { $match: { guildId } },
                {
                    $group: {
                        _id: '$moderatorId',
                        moderatorTag: { $last: '$moderatorTag' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            AutoModConfig.findOne({ guildId })
        ]);

        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const found = dailyBreakdown.find(item => item._id === dateStr);
            dailyData.push({ date: dateStr, count: found ? found.count : 0 });
        }

        const actionBreakdownMap = actionBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
        const configCoverage = autoModConfig ? buildConfigCoverage(autoModConfig) : null;
        const activeProtectionLayers = configCoverage
            ? configCoverage.staticEnabled + configCoverage.aiEnabled
            : 0;

        res.json({
            totalCases,
            totalWarnings,
            last24h,
            actionBreakdown: actionBreakdownMap,
            dailyData,
            recentActivity,
            topTargets: topTargets.map(item => ({ userId: item._id, targetTag: item.targetTag, count: item.count })),
            topModerators: topModerators.map(item => ({ moderatorId: item._id, moderatorTag: item.moderatorTag, count: item.count })),
            configCoverage,
            activeProtectionLayers,
            healthScore: clamp(Math.round(100 - (last24h * 5) - Math.max(totalWarnings - totalCases, 0)), 0, 100)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/overview/:guildId/guild-info', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        if (!botClient) return res.status(503).json({ error: 'Bot Client Unavailable' });
        const guild = botClient.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Guild Not Found' });

        const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;

        res.json({
            name: guild.name,
            memberCount: guild.memberCount,
            channelCount: guild.channels.cache.size,
            textChannelCount: textChannels,
            voiceChannelCount: voiceChannels,
            roleCount: guild.roles.cache.size,
            boostLevel: guild.premiumTier,
            boostCount: guild.premiumSubscriptionCount || 0,
            createdAt: guild.createdAt,
            botUptime: process.uptime()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/overview/:guildId/ai-analysis', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const { stats, guildInfo } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: 'GROQ_API_KEY not configured' });
        }

        const { Groq } = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const prompt = `You are analyzing a Discord server's moderation data. Provide a concise, insightful health analysis.

Server: "${guildInfo.name}" (${guildInfo.memberCount} members, ${guildInfo.channelCount} channels)
Bot Uptime: ${Math.floor(guildInfo.botUptime / 3600)}h ${Math.floor((guildInfo.botUptime % 3600) / 60)}m

Moderation Stats:
- Total Cases: ${stats.totalCases}
- Cases in last 24h: ${stats.last24h}
- Total Warnings: ${stats.totalWarnings}
- Health Score: ${stats.healthScore}%
- Action Breakdown: ${JSON.stringify(stats.actionBreakdown)}
- Daily Trend (last 7 days): ${JSON.stringify(stats.dailyData?.map(d => d.count))}
- Protection Layers: ${stats.activeProtectionLayers || 0}
- Top Moderators: ${JSON.stringify(stats.topModerators || [])}

Respond in this exact format (use emojis for visual appeal):
🔍 **Server Health Summary**
[2-3 sentence overview of server health status]

📊 **Key Insights**
• [insight 1 about moderation patterns]
• [insight 2 about trends]
• [insight 3 about risk level]

💡 **Recommendations**
• [actionable recommendation 1]
• [actionable recommendation 2]

⚡ **Risk Level**: [Low/Medium/High] — [1 sentence explanation]`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a professional Discord server analytics AI. Be concise, data-driven, and use markdown formatting. Keep responses under 250 words.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            max_tokens: 500
        });

        res.json({ analysis: completion.choices[0].message.content });
    } catch (err) {
        console.error('[AI ANALYSIS ERROR]', err);
        res.status(500).json({ error: 'AI analysis failed: ' + err.message });
    }
});

app.post('/api/moderation/:guildId/cases/:caseId/reason', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const reason = String(req.body.reason || '').trim();
        const caseData = await Case.findOneAndUpdate(
            { guildId: req.params.guildId, caseId: req.params.caseId },
            { reason: reason || 'No reason provided.' },
            { returnDocument: 'after' }
        );
        res.json(caseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/moderation/:guildId/warnings/:warningId', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        await Warning.findOneAndDelete({ _id: req.params.warningId, guildId: req.params.guildId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/automod/:guildId', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        let config = await AutoModConfig.findOne({ guildId: req.params.guildId });
        if (!config) {
            config = await AutoModConfig.create({ guildId: req.params.guildId });
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/automod/:guildId/config', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const sanitized = sanitizeAutoModPayload(req.body);
        const updated = await AutoModConfig.findOneAndUpdate(
            { guildId: req.params.guildId },
            { $set: sanitized },
            { returnDocument: 'after', upsert: true }
        );

        res.json({
            config: updated,
            recommendations: buildAutoModRecommendations(updated)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/automod/:guildId/simulate', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const simulatedConfig = sanitizeAutoModPayload(req.body.config || {});
        const content = String(req.body.content || '');
        const mentions = clamp(Number(req.body.mentions || 0), 0, 100);
        const attachmentCount = clamp(Number(req.body.attachments || 0), 0, 20);

        const fakeMessage = {
            content,
            guild: { id: req.params.guildId },
            author: { id: `preview-${req.user.userId}` },
            mentions: { users: { size: mentions } },
            attachments: { size: attachmentCount }
        };

        const result = await StaticFilter.handle(fakeMessage, simulatedConfig);
        res.json({
            result,
            recommendations: buildAutoModRecommendations(simulatedConfig),
            coverage: buildConfigCoverage(simulatedConfig)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/meta/commands', auth, (req, res) => {
    try {
        const commands = buildCommandCatalog();
        const summary = commands.reduce((acc, command) => {
            acc.categories[command.category] = (acc.categories[command.category] || 0) + 1;
            if (command.slash) acc.slashCount += 1;
            return acc;
        }, { categories: {}, slashCount: 0 });

        res.json({
            total: commands.length,
            slashCount: summary.slashCount,
            categories: summary.categories,
            commands
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/overview/:guildId/config-insights', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        const autoModConfig = await AutoModConfig.findOne({ guildId: req.params.guildId });
        if (!autoModConfig) {
            return res.json({
                coverage: null,
                recommendations: [{
                    level: 'info',
                    title: 'AutoMod not configured yet',
                    description: 'Enable protection modules to start receiving tuning guidance.'
                }]
            });
        }

        res.json({
            coverage: buildConfigCoverage(autoModConfig),
            recommendations: buildAutoModRecommendations(autoModConfig)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Endpoint not found' });
    res.sendFile(path.join(__dirname, '../../../dashboard/dist/index.html'));
});

let botClient = null;
const startAPI = (client, port = 3000) => {
    botClient = client;
    app.listen(port, () => {
        console.log('[API]'.cyan + ` AutoMod Dashboard API running on mapped port ${port}`.white);
    });
};

module.exports = { startAPI };

