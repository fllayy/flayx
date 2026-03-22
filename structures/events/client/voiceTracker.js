const client = require("../../client");
const { recordVoiceTime } = require("../../database/index");

// guildId -> session start timestamp (ms)
const sessionStarts = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member?.id !== client.user?.id) return;

    // Bot joined a VC
    if (!oldState.channelId && newState.channelId) {
        sessionStarts.set(newState.guild.id, Date.now());
    }

    // Bot left a VC (kicked, disconnected, or moved out)
    if (oldState.channelId && !newState.channelId) {
        const start = sessionStarts.get(oldState.guild.id);
        if (start) {
            sessionStarts.delete(oldState.guild.id);
            await recordVoiceTime(oldState.guild.id, Date.now() - start).catch(() => {});
        }

        // Destroy the Riffy player if bot was kicked/disconnected mid-playback
        const player = client.riffy?.players?.get(oldState.guild.id);
        if (player) {
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
        }
    }
});
