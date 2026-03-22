const client = require("../../client");
const { getLocale } = require("../../functions/i18n");

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    const t = await getLocale(player.guildId);

    if (player.message) await player.message.delete().catch(() => {});

    if (player.isAutoplay) {
        player._autoplayTriggered = true;
        player.autoplay(player);
    } else {
        player.destroy();
        if (channel) channel.send(t.queueEndMsg).catch(() => {});
    }
});
