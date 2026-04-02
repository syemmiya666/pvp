const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    date: { type: Date, required: true },
    
    totalTickets: { type: Number, default: 0 },
    closedTickets: { type: Number, default: 0 },
    claimedTickets: { type: Number, default: 0 },
    
    totalAiReplies: { type: Number, default: 0 },
    totalAiAutoResolved: { type: Number, default: 0 },
    
    totalResponseTime: { type: Number, default: 0 },
    totalResolutionTime: { type: Number, default: 0 },
    
    commonIssues: [{
        tag: String,
        count: { type: Number, default: 0 }
    }],
    
    staffPerformance: [{
        userId: String,
        claims: { type: Number, default: 0 },
        resolutions: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
    }]
});

AnalyticsSchema.index({ guildId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TicketAnalytics', AnalyticsSchema);

