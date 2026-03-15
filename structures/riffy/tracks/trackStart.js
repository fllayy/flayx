const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const client = require("../../client");

function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('pause_resume')
            .setLabel('Pause/Resume')
            .setEmoji('⏸')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('autoplay')
            .setLabel('Autoplay')
            .setEmoji('💡')
            .setStyle(ButtonStyle.Primary)
    );
}

const SOURCE_COLORS = {
    youtube:      0xFF0000,
    youtubemusic: 0xFF0000,
    soundcloud:   0xFF5500,
    spotify:      0x1DB954,
    applemusic:   0xFC3C44,
    yandexmusic:  0xFFCC00,
    twitch:       0x9146FF,
    bandcamp:     0x1DA0C3,
    vimeo:        0x1AB7EA,
};

function buildEmbed(player, track) {
    const duration = formatDuration(track.info.length);
    const queueLength = player.queue?.length ?? 0;
    const volume = player.volume ?? 100;
    const autoplay = player.isAutoplay ? 'enabled' : 'disabled';
    const source = (track.info.sourceName ?? '').toLowerCase().replace(/\s/g, '');
    const color = SOURCE_COLORS[source] ?? 0x5865F2;

    return new EmbedBuilder()
        .setTitle('Music Controller | FLAYX')
        .setDescription(
            `**Now Playing:**\n[${track.info.title}](${track.info.uri}) by \`${track.info.author}\`\n\nRequested by ${player._autoplayTriggered ? 'Autoplay' : (track.info.requester?.displayName ?? track.info.requester?.username ?? 'Autoplay')}`
        )
        .setImage('attachment://musicard.png')
        .setFooter({ text: `Queue Length: ${queueLength} | Duration: ${duration} | Volume: ${volume}% | Autoplay: ${autoplay}` })
        .setColor(color);
}

client.riffy.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    try {
        const albumArt = track.info.thumbnail || track.info.artworkUrl;
        const embed = buildEmbed(player, track);
        const row = buildRow();
        player.trackData = track;
        player._autoplayTriggered = false;

        if (albumArt) {
            const { Bloom, initializeFonts } = await import('musicard');
            initializeFonts();
            const musicard = await Bloom({
                albumArt,
                fallbackArt: albumArt,
                trackName: track.info.title ?? 'Unknown',
                artistName: track.info.author ?? 'Unknown',
                timeAdjust: { timeStart: '0:00', timeEnd: formatDuration(track.info.length) },
                progressBar: 0,
                backgroundColor: '#000000'
            });
            const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
            player.message = await channel.send({ embeds: [embed], files: [attachment], components: [row] });
        } else {
            embed.setImage(null);
            player.message = await channel.send({ embeds: [embed], components: [row] });
        }
    } catch (err) {
        console.error('[trackStart] Error:', err);
        player.message = await channel.send({ content: `Now playing: **${track.info.title}** by \`${track.info.author}\`` });
    }
});

module.exports = { buildEmbed, buildRow, formatDuration };
