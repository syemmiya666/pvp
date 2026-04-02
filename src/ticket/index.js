const { startAPI } = require('./routes/api');
const AutomationService = require('./services/AutomationService');

module.exports = {
    init: (client) => {
        const automation = new AutomationService(client);
        automation.start();

        startAPI(client, process.env.SERVER_PORT || process.env.PORT || process.env.API_PORT || 3000);

        console.log('[TICKET]'.green + ' Production-grade ticket system initialized'.white);
    }
};

