const { Pool } = require('pg');
const { logger } = require('../functions/logger');

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'flayx',
    user: process.env.POSTGRES_USER || 'flayx',
    password: process.env.POSTGRES_PASSWORD || 'flayx_password',
});

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
        // Migration: add column if table already existed without it
        await pool.query(`
            ALTER TABLE guild_settings
            ADD COLUMN IF NOT EXISTS voice_time_ms BIGINT DEFAULT 0
        `);
        logger('Database initialized successfully', 'info');
    } catch (error) {
        logger('Failed to initialize database', 'error');
        console.log(error);
    }
}

async function getGuildSettings(guildId) {
    const result = await pool.query(
        'SELECT * FROM guild_settings WHERE guild_id = $1',
        [guildId]
    );
    if (result.rows.length === 0) {
        return { guild_id: guildId, volume: 100, dj_role_id: null, voice_time_ms: 0 };
    }
    return result.rows[0];
}

async function recordVoiceTime(guildId, ms) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, voice_time_ms)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET voice_time_ms = guild_settings.voice_time_ms + $2, updated_at = NOW()
    `, [guildId, ms]);
}

async function setGuildVolume(guildId, volume) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, volume)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET volume = $2, updated_at = NOW()
    `, [guildId, volume]);
}

async function setGuildDjRole(guildId, roleId) {
    await pool.query(`
        INSERT INTO guild_settings (guild_id, dj_role_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE
        SET dj_role_id = $2, updated_at = NOW()
    `, [guildId, roleId]);
}

module.exports = { initDatabase, getGuildSettings, setGuildVolume, setGuildDjRole, recordVoiceTime };
