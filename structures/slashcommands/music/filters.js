const { ApplicationCommandOptionType } = require('discord.js');
const { isAdminOrDJ } = require('../../functions/permissions');
const { getLocale } = require('../../functions/i18n');

const FILTER_APPLY = {
    karaoke:    (f) => f.setKaraoke(true),
    nightcore:  (f) => f.setNightcore(true),
    vaporwave:  (f) => f.setVaporwave(true),
    '8d':       (f) => f.set8D(true),
    bassboost:  (f) => f.setBassboost(true),
    slowmode:   (f) => f.setSlowmode(true),
    tremolo:    (f) => f.setTremolo(true),
    vibrato:    (f) => f.setVibrato(true),
    rotation:   (f) => f.setRotation(true),
    distortion: (f) => f.setDistortion(true),
    lowpass:    (f) => f.setLowPass(true),
};

module.exports = {
    name: 'filters',
    description: 'Apply or remove an audio filter',
    inVoice: true,
    sameVoice: true,
    player: true,
    options: [
        {
            name: 'filter',
            description: 'Filter to apply (select the same one again to disable it)',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: '🎤 Karaoke — remove vocals',      value: 'karaoke' },
                { name: '🌙 Nightcore — speed up + pitch',  value: 'nightcore' },
                { name: '🌊 Vaporwave — slow + lower pitch', value: 'vaporwave' },
                { name: '🎵 8D Audio — spatial rotation',   value: '8d' },
                { name: '🔊 Bass Boost',                    value: 'bassboost' },
                { name: '🐢 Slowmode',                      value: 'slowmode' },
                { name: '📳 Tremolo',                       value: 'tremolo' },
                { name: '〰️ Vibrato',                      value: 'vibrato' },
                { name: '🔄 Rotation',                      value: 'rotation' },
                { name: '⚡ Distortion',                    value: 'distortion' },
                { name: '🎚️ Low Pass',                     value: 'lowpass' },
                { name: '❌ Clear all filters',             value: 'clear' },
            ],
        },
    ],

    run: async (client, interaction, options) => {
        const t = await getLocale(interaction.guild.id);

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjRequired, ephemeral: true });
        }

        const player = client.riffy.players.get(interaction.guild.id);
        const filter = options.getString('filter');

        if (filter === 'clear') {
            player.filters.clearFilters();
            player._activeFilter = null;
            return interaction.reply({ content: t.filterClear, ephemeral: true });
        }

        // Toggle: same filter selected again → disable it
        if (player._activeFilter === filter) {
            player.filters.clearFilters();
            player._activeFilter = null;
            return interaction.reply({ content: t.filterOff(t.filterLabels[filter]), ephemeral: true });
        }

        // Apply new filter (clear any active one first)
        player.filters.clearFilters();
        FILTER_APPLY[filter](player.filters);
        player._activeFilter = filter;

        return interaction.reply({ content: t.filterOn(t.filterLabels[filter]), ephemeral: true });
    },
};
