const commandCatalog = [
  { name: 'help', description: 'Browse command categories with short command explanations.', category: 'Info', aliases: ['h', 'commands'], cooldown: 5, ownerOnly: false, slash: true },
  { name: 'ping', description: "Check Zenith's network latency and heartbeat.", category: 'Info', aliases: ['latency', 'p'], cooldown: 0, ownerOnly: false, slash: true },
  { name: 'serverinfo', description: 'Show a quick snapshot of the current server.', category: 'Info', aliases: ['guildinfo', 'si'], cooldown: 5, ownerOnly: false, slash: true },
  { name: 'userinfo', description: 'Show profile and server details for a user.', category: 'Info', aliases: ['ui', 'whois'], cooldown: 5, ownerOnly: false, slash: true },
  { name: 'ban', description: 'Ban a user from the server.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'case', description: 'View or update a moderation case.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'clearwarns', description: 'Clear a user\'s warnings.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'dm', description: 'Send a direct message to a user.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'kick', description: 'Kick a user from the server.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'lock', description: 'Lock the current channel.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'massban', description: 'Ban multiple user IDs at once.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'nuke', description: 'Clone and reset the current channel.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'purge', description: 'Bulk delete recent messages.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'timeout', description: 'Temporarily timeout a member.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'unban', description: 'Unban a user by ID.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'unlock', description: 'Unlock the current channel.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'untimeout', description: 'Remove a timeout from a member.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'warn', description: 'Add or list warnings for a user.', category: 'Moderation', aliases: [], cooldown: 3, ownerOnly: false, slash: true },
  { name: 'dok', description: 'Run owner-only Dokdo utilities.', category: 'Owner', aliases: [], cooldown: 0, ownerOnly: true, slash: false },
  { name: 'nop', description: 'Manage no-prefix access for users.', category: 'Owner', aliases: [], cooldown: 0, ownerOnly: true, slash: true },
  { name: 'avatar', description: 'Show a user avatar in full quality.', category: 'Utility', aliases: ['av', 'pfp'], cooldown: 4, ownerOnly: false, slash: true },
  { name: 'botstats', description: 'Show performance and usage stats for the bot.', category: 'Utility', aliases: ['stats', 'aboutbot'], cooldown: 5, ownerOnly: false, slash: true },
  { name: 'roleinfo', description: 'Inspect a server role and its metadata.', category: 'Utility', aliases: ['ri'], cooldown: 5, ownerOnly: false, slash: true }
];

export default commandCatalog;

