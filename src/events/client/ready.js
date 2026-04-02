const { ActivityType, Events } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        // Only log once for the entire application, or show cluster info
        const clusterId = client.cluster?.id ?? 0;
        const tag = client.user.tag;
        
        const boxTitle = `BOT READY`;
        const boxMessage = `Logged in as ${tag}`;
        const clusterMessage = `Cluster: ${clusterId}`;
        const maxLength = Math.max(boxTitle.length, boxMessage.length, clusterMessage.length) + 4;
        
        // Clean ASCII box
        console.log(`+${'-'.repeat(maxLength - 2)}+`);
        console.log(`| ${boxTitle.padEnd(maxLength - 4)} |`);
        console.log(`| ${'-'.repeat(maxLength - 4)} |`);
        console.log(`| ${boxMessage.padEnd(maxLength - 4)} |`);
        console.log(`| ${clusterMessage.padEnd(maxLength - 4)} |`);
        console.log(`+${'-'.repeat(maxLength - 2)}+`);

        client.user.setPresence({
            status: 'online',
            activities: [{
                name: 'Zenith',
                type: ActivityType.Custom,
            }],
        });
    },
};

