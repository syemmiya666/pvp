const mongoose = require('mongoose');

const TicketConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    categoryId: { type: String, required: true },
    staffRoleId: { type: String, required: true },
    logsChannelId: { type: String, default: null },
    ticketCount: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('TicketConfig', TicketConfigSchema);

