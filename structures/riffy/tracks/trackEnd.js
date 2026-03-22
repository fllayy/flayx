const client = require("../../client");
const { getLocale } = require("../../functions/i18n");

client.riffy.on('trackEnd', async (player) => {
    if (!player) return;

    if (player.message) await player.message.delete().catch(() => {});

    const voiceChannel = client.channels.cache.get(player.voiceChannel);
    if (voiceChannel) {
        const humanCount = voiceChannel.members.filter(m => !m.user.bot).size;
        if (humanCount === 0) {
            const t = await getLocale(player.guildId);
            const textChannel = client.channels.cache.get(player.textChannel);
            if (textChannel) textChannel.send(t.trackEndAlone).catch(() => {});
            player.destroy();
        }
    }
});
