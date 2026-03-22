const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const client = require("../../client");
const { getLocale } = require("../../functions/i18n");
const { BLURPLE, SOURCE_COLORS } = require("../../constants/colors");
const en = require("../../../locales/en");

// Lazy-loaded musicard module — imported once and reused across tracks
let musicardModule = null;
async function getMusicardModule() {
    if (!musicardModule) {
        musicardModule = await import('musicard');
        musicardModule.initializeFonts();
    }
    return musicardModule;
}

/**
 * Format a duration in milliseconds to a `m:ss` string.
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Build the player control button row (Skip / Pause-Resume / Stop / Autoplay). */
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

/**
 * Build a fully-disabled row, replacing the autoplay button with an action-result indicator.
 * @param {string} label - Label for the result button (e.g. 'Skipped')
 * @param {import('discord.js').ButtonStyle} style - Style for the result button
 */
function buildDisabledRow(label, style) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('pause_resume').setLabel('Pause/Resume').setEmoji('⏸').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger).setDisabled(true),
        new ButtonBuilder().setCustomId('autoplay').setLabel(label).setStyle(style).setDisabled(true),
    );
}


/**
 * Build the Now Playing embed for a track.
 * @param {object} player - Riffy player instance
 * @param {object} track  - Riffy track object
 * @param {object} t      - Locale object (defaults to French)
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEmbed(player, track, t = en) {
    const duration = formatDuration(track.info.length);
    const queueLength = player.queue?.length ?? 0;
    const volume = player.volume ?? 100;
    const autoplay = player.isAutoplay ? t.trackAutoplayOn : t.trackAutoplayOff;
    const source = (track.info.sourceName ?? '').toLowerCase().replace(/\s/g, '');
    const color = SOURCE_COLORS[source] ?? BLURPLE;
    const loopMode = player.loop ?? 'none';
    const loopIcon = t.trackLoopIcons[loopMode];
    const loopText = loopIcon ? ` | Loop: ${loopIcon}` : '';
    const requester = player._autoplayTriggered
        ? t.trackRequesterAuto
        : (track.info.requester?.displayName ?? track.info.requester?.username ?? t.trackRequesterAuto);

    return new EmbedBuilder()
        .setTitle(t.trackEmbedTitle)
        .setDescription(t.trackNowPlaying(track.info.title, track.info.uri, track.info.author, requester))
        .setImage('attachment://musicard.png')
        .setFooter({ text: t.trackFooter(queueLength, duration, volume, autoplay, loopText) })
        .setColor(color);
}

client.riffy.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    const t = await getLocale(player.guildId);

    try {
        const albumArt = track.info.thumbnail || track.info.artworkUrl;
        const embed = buildEmbed(player, track, t);
        const row = buildRow();
        player.trackData = track;
        player._autoplayTriggered = false;

        if (albumArt) {
            const { Bloom } = await getMusicardModule();
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

        // Seek to timestamp if set by /play (YouTube ?t= support)
        if (player._seekOnStart) {
            player.seekTo(player._seekOnStart);
            player._seekOnStart = null;
        }
    } catch (err) {
        console.error('[trackStart] Error:', err);
        player.message = await channel.send({ content: t.trackFallback(track.info.title, track.info.author) }).catch(() => null);
    }
});

module.exports = { buildEmbed, buildRow, buildDisabledRow, formatDuration };
