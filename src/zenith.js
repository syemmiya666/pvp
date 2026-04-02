require('dotenv').config({ quiet: true });
require('./console/watermark');

const colors = require('colors');
const { ClusterManager } = require('discord-hybrid-sharding');

const manager = new ClusterManager(`${__dirname}/index.js`, {
    totalShards: 'auto',
    shardsPerClusters: 2,
    totalClusters: 'auto',
    mode: 'process',
    token: process.env.TOKEN,
    restarts: {
        max: 10,
        interval: 60000 * 60,
    },
});

manager.on('clusterCreate', (cluster) => {
    console.log(`[SHARDING]`.magenta + ` Cluster ${cluster.id} launched.`.white);
});

manager.spawn({ timeout: -1 });

