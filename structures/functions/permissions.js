const { PermissionsBitField } = require('discord.js');
const { getGuildSettings } = require('../database/index');

function isAdmin(member) {
    return member.permissions.has(PermissionsBitField.Flags.KickMembers);
}

async function isDJ(member, guildId) {
    const settings = await getGuildSettings(guildId);
    if (!settings.dj_role_id) return false;
    return member.roles.cache.has(settings.dj_role_id);
}

async function isAdminOrDJ(member, guildId) {
    return isAdmin(member) || await isDJ(member, guildId);
}

module.exports = { isAdmin, isDJ, isAdminOrDJ };
