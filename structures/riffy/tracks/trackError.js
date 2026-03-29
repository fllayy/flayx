const client = require("../../client");
const { getLocale } = require("../../functions/i18n");
const { logger } = require("../../functions/logger");

client.riffy.on('trackError', async (player, track, payload) => {
    logger(`[trackError] Guild ${player.guildId} — ${payload?.message ?? payload}`, "error");

    const t = await getLocale(player.guildId);
    const textChannel = client.channels.cache.get(player.textChannel);
    if (textChannel) textChannel.send(t.trackErrorMsg(track.info.title)).catch(() => {});

    player.stop();
});
