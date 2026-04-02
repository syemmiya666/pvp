const mongoose = require('mongoose');

const autoModConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    ai: {
        insults: {
            enabled: { type: Boolean, default: true },
            level: { type: String, enum: ['Low', 'Medium', 'Strict'], default: 'Medium' }
        },
        threats: {
            enabled: { type: Boolean, default: true },
            level: { type: String, enum: ['Low', 'Medium', 'Strict'], default: 'Medium' }
        },
        identityAttacks: {
            enabled: { type: Boolean, default: true },
            level: { type: String, enum: ['Low', 'Medium', 'Strict'], default: 'Medium' }
        },
        offensiveLanguage: {
            enabled: { type: Boolean, default: true },
            level: { type: String, enum: ['Low', 'Medium', 'Strict'], default: 'Medium' }
        }
    },
    static: {
        spam: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 5 } },
        mentions: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 5 } },
        attachments: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 4 } },
        emojis: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 10 } },
        masslines: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 15 } },
        caps: { enabled: { type: Boolean, default: false }, percent: { type: Number, default: 70 } },
        words: { enabled: { type: Boolean, default: false }, blacklist: { type: [String], default: [] } },
        links: { enabled: { type: Boolean, default: false }, whitelist: { type: [String], default: [] } },
        invites: { enabled: { type: Boolean, default: false } },
        warns: { enabled: { type: Boolean, default: false }, limit: { type: Number, default: 3 } }
    },
    actions: {
        reportToModerators: { type: Boolean, default: false },
        deleteMessage: { type: Boolean, default: true },
        logsChannelId: { type: String, default: null },
        warnUser: { type: Boolean, default: true },
        muteUser: { type: Boolean, default: false },
        muteDuration: { type: Number, default: 10 },
    }
}, { timestamps: true });

module.exports = mongoose.model('AutoModConfig', autoModConfigSchema);

