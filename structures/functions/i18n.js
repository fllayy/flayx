const { getGuildSettings } = require('../database/index');
const en = require('../../locales/en');
const fr = require('../../locales/fr');

const LOCALES = { fr, en };

/**
 * Derive the locale from an already-fetched settings object (no DB call).
 * @param {object} settings
 * @returns {object}
 */
function getLocaleFromSettings(settings) {
    return LOCALES[settings?.language] ?? LOCALES.en;
}

/**
 * Returns the locale object for a given guild (issues one DB call).
 * Use `getLocaleFromSettings` instead when you already have the settings row.
 * @param {string|null} guildId
 * @returns {Promise<object>}
 */
async function getLocale(guildId) {
    if (!guildId) return LOCALES.en;
    try {
        const settings = await getGuildSettings(guildId);
        return LOCALES[settings.language] ?? LOCALES.en;
    } catch {
        return LOCALES.en;
    }
}

module.exports = { getLocale, getLocaleFromSettings, LOCALES };
