const { startAPI } = require('./routes/api');

module.exports = {
    init: (client) => {
        startAPI(client, process.env.SERVER_PORT || process.env.PORT || process.env.API_PORT || 3000);

        console.log('[AUTOMOD]'.green + ' Advanced AI Auto-Moderation engine initialized'.white);
    }
};

