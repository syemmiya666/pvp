module.exports = {
    name: 'dok',
    description: 'Zenith\'s developer debugging and utility tool (Dokdo).',
    ownerOnly: true,
    aliases: ['d'],

    
    run: async (client, message) => {
        if (message.args && message.args[0] === 'stats') {
            message.args = [];
            message.content = message.content.replace(/stats/i, '').trim();
        }

        try {
            await client.dokdo.run(message);
        } catch (error) {
            console.error('[DOKDO ERROR]', error);
            message.reply('An error occurred while running Dokdo. Check the console for details.');
        }
    },
};

