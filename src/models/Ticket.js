const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    ticketId: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    type: { type: String, default: 'General' },
    claimedBy: { type: String, default: null },
    panelId: { type: String },
    transcriptPath: { type: String },
    aiSummary: { type: String },
    closedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);

