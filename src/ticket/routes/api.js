const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../../config/config.json');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'zenith-saas-premium-secret';

const path = require('path');

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://cdn.discordapp.com"],
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

app.use('/transcripts', express.static(path.join(__dirname, '../../../transcripts')));


const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
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
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const allowedGuilds = guildsResponse.data.filter(g => {
            if (botClient && !botClient.guilds.cache.has(g.id)) return false;
            
            const perms = BigInt(g.permissions);
            return g.owner || (perms & 0x8n) === 0x8n || (perms & 0x20n) === 0x20n;
        }).map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon
        }));

        const user = userResponse.data;

        const token = jwt.sign({
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            allowedGuilds
        }, JWT_SECRET, { expiresIn: '7d' });

        res.redirect(`/login?token=${token}`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.redirect('/login?error=AuthFailed');
    }
});

const requireGuildAdmin = (getGuildId) => {
    return (req, res, next) => {
        const guildId = getGuildId(req);
        if (!req.user.allowedGuilds || !req.user.allowedGuilds.some(g => g.id === guildId)) {
            return res.status(403).json({ error: 'Forbidden: You lack Administrator permissions for this server.' });
        }
        next();
    };
};

app.get('/api/guilds/:guildId/data', auth, requireGuildAdmin(req => req.params.guildId), async (req, res) => {
    try {
        if (!botClient) return res.status(503).json({ error: 'Bot Client Unavailable' });
        
        const guild = botClient.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Zenith Bot is not in this server.' });

        const roles = guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
        const channels = guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
        const categories = guild.channels.cache.filter(c => c.type === 4).map(c => ({ id: c.id, name: c.name }));

        res.json({ roles, channels, categories });
    } catch (err) {
        console.error('[DATA FETCH ERROR]', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});



app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../../dashboard/dist/index.html'));
});

let botClient = null;
const startAPI = (client, port = 3000) => {
    botClient = client;
    app.listen(port, () => {
        console.log('[API]'.cyan + ` Dashboard API running on port ${port}`.white);
    });
};

module.exports = { startAPI };

