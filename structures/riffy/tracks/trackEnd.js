const client = require("../../client")

client.riffy.on('trackEnd', async (player) => {
    if (!player) return;

    if (player.message) await player.message.delete();

    const voiceChannel = client.channels.cache.get(player.voiceChannel);
    if (voiceChannel) {
        const humanCount = voiceChannel.members.filter(m => !m.user.bot).size;
        if (humanCount === 0) {
            const textChannel = client.channels.cache.get(player.textChannel);
            if (textChannel) textChannel.send('📭 No one is left in the voice channel, leaving.');
            player.destroy();
        }
    }
})