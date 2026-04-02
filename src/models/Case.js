const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    caseId: { type: Number, required: true },
    targetId: { type: String, required: true },
    targetTag: { type: String, required: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, required: true },
    action: { type: String, enum: ['WARN', 'MUTE', 'UNMUTE', 'KICK', 'BAN', 'UNBAN', 'MASSBAN', 'PURGE'], required: true },
    reason: { type: String, default: 'No reason provided.' },
    duration: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

CaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

module.exports = mongoose.model('Case', CaseSchema);

