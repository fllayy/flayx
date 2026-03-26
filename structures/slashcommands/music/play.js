const { ApplicationCommandOptionType } = require('discord.js');
const { getGuildSettings } = require('../../database/index');
const { getLocaleFromSettings } = require('../../functions/i18n');

/**
 * Parse a YouTube timestamp query parameter (?t= or ?start=) into milliseconds.
 * Handles plain seconds (`60`) and compound formats (`1h2m3s`, `1m30s`).
 * @param {string} query - The raw query string (may or may not be a URL)
 * @returns {number|null} Milliseconds to seek to, or null if no timestamp found
 */
function parseTimestampMs(query) {
    try {
        const url = new URL(query);
        const t = url.searchParams.get('t') || url.searchParams.get('start');
        if (!t) return null;

        if (/^\d+$/.test(t)) return parseInt(t, 10) * 1000;

        let totalSeconds = 0;
        const h = t.match(/(\d+)h/);
        const m = t.match(/(\d+)m/);
        const s = t.match(/(\d+)s/);
        if (h) totalSeconds += parseInt(h[1]) * 3600;
        if (m) totalSeconds += parseInt(m[1]) * 60;
        if (s) totalSeconds += parseInt(s[1]);
        return totalSeconds > 0 ? totalSeconds * 1000 : null;
    } catch {
        return null;
    }
}

module.exports = {
    name: 'play',
    description: 'play a track',
    inVoice: true,
    options: [
        {
            name: 'query',
            description: 'The query to search for',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'source',
            description: 'The platform to search on (default: YouTube)',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'YouTube', value: 'ytsearch' },
                { name: 'SoundCloud', value: 'scsearch' },
                { name: 'Twitch', value: 'twitchsearch' },
                { name: 'Bandcamp', value: 'bcsearch' },
                { name: 'Vimeo', value: 'vmsearch' },
            ],
        }
    ],

    run: async (client, interaction) => {
        const query = interaction.options.getString('query').trim();
        const source = interaction.options.getString('source') ?? 'ytsearch';
        const settings = await getGuildSettings(interaction.guild.id);
        const t = getLocaleFromSettings(settings);

        if (!query) {
            return interaction.reply({ content: t.playQueryEmpty, ephemeral: true });
        }

        const textChannel = settings.announce_channel ?? interaction.channel.id;

        const player = client.riffy.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel,
            deaf: true,
        });

        if (!player.playing && !player.paused) player.setVolume(settings.volume);

        // Store YouTube timestamp for seeking when the track starts
        const seekMs = parseTimestampMs(query);
        if (seekMs) player._seekOnStart = seekMs;

        const resolve = await client.riffy.resolve({ query, requester: interaction.member, source });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of resolve.tracks) {
                track.info.requester = interaction.member;
                player.queue.add(track);
            }
            await interaction.reply(t.playPlaylist(tracks.length, playlistInfo.name));
            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = interaction.member;
            player.queue.add(track);
            await interaction.reply(t.playTrack(track.info.title));
            if (!player.playing && !player.paused) return player.play();

        } else {
            return interaction.reply(t.playNoResults);
        }
    },
};
