/** Discord brand color (blurple) — used for info/settings embeds. */
const BLURPLE = 0x5865F2;

/** Dark embed background — used for queue/neutral embeds. */
const DARK = 0x2F3136;

/** Music source brand colors — keyed by Riffy's sourceName (lowercase, no spaces). */
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

module.exports = { BLURPLE, DARK, SOURCE_COLORS };
