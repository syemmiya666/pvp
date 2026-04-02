const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const Case = require('../models/Case');
const Counter = require('../models/Counter');
const AutoModConfig = require('../automod/models/AutoModConfig');
const config = require('../config/config.json');

class LoggerService {
    static async getNextCaseId(guildId) {
        const counter = await Counter.findOneAndUpdate(
            { guildId, type: 'case' },
            { $inc: { count: 1 } },
            { returnDocument: 'after', upsert: true }
        );
        return counter.count;
    }

    static async logCase(client, guild, moderator, target, action, reason, duration = null) {
        const caseId = await this.getNextCaseId(guild.id);
        
        const newCase = new Case({
            guildId: guild.id,
            caseId,
            targetId: target.id,
            targetTag: target.tag || target.user?.tag || target.id,
            moderatorId: moderator.id,
            moderatorTag: moderator.tag || moderator.user?.tag || moderator.id,
            action: action.toUpperCase(),
            reason,
            duration,
        });
        await newCase.save();

        const autoMod = await AutoModConfig.findOne({ guildId: guild.id });
        const logChannelId = autoMod?.actions?.logsChannelId;
        if (!logChannelId) return caseId;

        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel) return caseId;

        const actionColors = {
            WARN: '#f1c40f',
            MUTE: '#e67e22',
            UNMUTE: '#2ecc71',
            KICK: '#e67e22',
            BAN: '#e74c3c',
            UNBAN: '#2ecc71',
            MASSBAN: '#c0392b',
            PURGE: '#3498db'
        };

        const lines = [
            `📁 **Case #${caseId} | ${action.toUpperCase()}**`,
            `> **Target:** <@${target.id}> (${target.tag || target.user?.tag || target.id})`,
            `> **Moderator:** <@${moderator.id}> (${moderator.tag || moderator.user?.tag || moderator.id})`,
            `> **Reason:** ${reason || 'No reason provided.'}`,
            `> **Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ];

        if (duration) {
            lines.push(`> **Duration:** ${duration} minutes`);
        }

        const logBlock = new ContainerBuilder()
            .setAccentColor(parseInt(String(actionColors[action.toUpperCase()] || config.color || '#2f3136').replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(lines.join('\n'))
            );

        await logChannel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [logBlock]
        }).catch(() => null);

        return caseId;
    }
}

module.exports = LoggerService;

