const { Pool } = require('pg');
const { logger } = require('../functions/logger');

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'flayx',
    user: process.env.POSTGRES_USER || 'flayx',
    password: process.env.POSTGRES_PASSWORD || 'flayx_password',
});

// Versioned migrations — add new entries at the end only
const MIGRATIONS = [
    {
        version: 1,
        sql: `
            ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS voice_time_ms BIGINT DEFAULT 0;
        `,
    },
    {
        version: 2,
        sql: `
            ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
            ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS announce_channel VARCHAR(20) DEFAULT NULL;
            ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS auto_leave_delay INTEGER DEFAULT 0;
        `,
    },
];

/** Run all pending versioned migrations against the database. */
async function runMigrations() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    INTEGER   PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT NOW()
        )
    `);

    for (const migration of MIGRATIONS) {
        const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [migration.version]);
        if (rows.length === 0) {
            await pool.query(migration.sql);
            await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
            logger(`Migration v${migration.version} applied`, 'info');
        }
    }
}

/** Create the guild_settings table if it doesn't exist and run all migrations. */
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id      VARCHAR(20) PRIMARY KEY,
                volume        INTEGER     DEFAULT 100,
                dj_role_id    VARCHAR(20) DEFAULT NULL,
                voice_time_ms BIGINT      DEFAULT 0,
                created_at    TIMESTAMP   DEFAULT NOW(),
                updated_at    TIMESTAMP   DEFAULT NOW()
            )
        `);
        await runMigrations();
        logger('Database initialized successfully', 'info');
    } catch (error) {
        logger('Failed to initialize database', 'error');
        console.error(error);
    }
}

/**
 * Fetch settings for a guild. Returns defaults if the guild has no row yet.
 * @param {string} guildId
 * @returns {Promise<object>}
 */
async function getGuildSettings(guildId) {
    const result = await pool.query(
        'SELECT * FROM guild_settings WHERE guild_id = $1',
        [guildId]
    );
    if (result.rows.length === 0) {
        return { guild_id: guildId, volume: 100, dj_role_id: null, voice_time_ms: 0, language: 'en', announce_channel: null };
    }
    return result.rows[0];
}

/**
 * Add ms milliseconds to the guild's cumulative voice time counter.
 * @param {string} guildId
 * @param {number} ms
 */
async function recordVoiceTime(guildId, ms) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, voice_time_ms)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET voice_time_ms = guild_settings.voice_time_ms + $2, updated_at = NOW()
    `, [guildId, ms]);
}

/** @param {string} guildId @param {number} volume 1-100 */
async function setGuildVolume(guildId, volume) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, volume)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET volume = $2, updated_at = NOW()
    `, [guildId, volume]);
}

/** @param {string} guildId @param {string} roleId */
async function setGuildDjRole(guildId, roleId) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, dj_role_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET dj_role_id = $2, updated_at = NOW()
    `, [guildId, roleId]);
}

/** @param {string} guildId @param {'fr'|'en'} language */
async function setGuildLanguage(guildId, language) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, language)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET language = $2, updated_at = NOW()
    `, [guildId, language]);
}

/** @param {string} guildId @param {string|null} channelId - pass null to clear */
async function setGuildAnnounceChannel(guildId, channelId) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, announce_channel)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET announce_channel = $2, updated_at = NOW()
    `, [guildId, channelId]);
}

/**
 * Returns pg pool connection counts and a round-trip latency measurement.
 * @returns {Promise<{ total: number, idle: number, waiting: number, latencyMs: number }>}
 */
async function getDatabaseStats() {
    const start = Date.now();
    try {
        await pool.query('SELECT 1');
        return {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
            latencyMs: Date.now() - start,
        };
    } catch {
        return {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
            latencyMs: -1,
        };
    }
}

module.exports = {
    initDatabase,
    getGuildSettings,
    setGuildVolume,
    setGuildDjRole,
    setGuildLanguage,
    setGuildAnnounceChannel,
    recordVoiceTime,
    getDatabaseStats,
};
