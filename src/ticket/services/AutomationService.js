const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const Panel = require('../models/Panel');
const handler = require('../handlers/TicketHandler');

class AutomationService {
    constructor(client) {
        this.client = client;
    }

    start() {
        cron.schedule('0 * * * *', () => {
            this.checkInactiveTickets();
        });

        console.log('[AUTOMATION]'.yellow + ' Ticket automation services started'.white);
    }

    async checkInactiveTickets() {
        const panels = await Panel.find({ autoCloseInactive: true });
        
        for (const panel of panels) {
            const threshold = new Date(Date.now() - (panel.inactiveHours * 60 * 60 * 1000));
            
            const inactiveTickets = await Ticket.find({
                panelId: panel._id,
                status: 'open',
                lastMessageAt: { $lt: threshold }
            });

            for (const ticket of inactiveTickets) {
                const guild = this.client.guilds.cache.get(ticket.guildId);
                const channel = guild?.channels.cache.get(ticket.channelId);
                
                if (channel) {
                    ticket.status = 'closed';
                    ticket.closedAt = Date.now();
                    await ticket.save();
                    
                    await channel.send('🔒 **Auto-Close:** This ticket has been closed due to inactivity.');
                    setTimeout(() => channel.delete().catch(() => {}), 10000);
                }
            }
        }
    }
}

module.exports = AutomationService;

