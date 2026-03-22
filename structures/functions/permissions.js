const { PermissionsBitField } = require('discord.js');
const { getGuildSettings } = require('../database/index');

/**
 * Returns true if the member has KickMembers permission (used as the admin gate).
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
    return member.permissions.has(PermissionsBitField.Flags.KickMembers);
}

/**
 * Returns true if the member has the DJ role configured for the guild.
 * @param {import('discord.js').GuildMember} member
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
async function isDJ(member, guildId) {
    const settings = await getGuildSettings(guildId);
    if (!settings.dj_role_id) return false;
    return member.roles.cache.has(settings.dj_role_id);
}

/**
 * Returns true if the member is an admin OR has the DJ role.
 * @param {import('discord.js').GuildMember} member
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
async function isAdminOrDJ(member, guildId) {
    return isAdmin(member) || await isDJ(member, guildId);
}

module.exports = { isAdmin, isDJ, isAdminOrDJ };
