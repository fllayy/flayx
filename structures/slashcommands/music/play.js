const { Client, CommandInteraction, ApplicationCommandOptionType } = require('discord.js');

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
                { name: 'YouTube Music', value: 'ytmsearch' },
                { name: 'SoundCloud', value: 'scsearch' },
                { name: 'Spotify', value: 'spsearch' },
                { name: 'Apple Music', value: 'amsearch' },
                { name: 'Yandex Music', value: 'ymsearch' },
                { name: 'Twitch', value: 'twitchsearch' },
                { name: 'Bandcamp', value: 'bcsearch' },
                { name: 'Vimeo', value: 'vmsearch' },
            ],
        }
    ],

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String[]} args
     * @returns 
     */

    run: async (client, interaction, args) => {
        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') ?? 'ytsearch';

        const player = client.riffy.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
            deaf: true,
        })

        const resolve = await client.riffy.resolve({ query: query, requester: interaction.member, source });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of resolve.tracks) {
                track.info.requester = interaction.member;
                player.queue.add(track);
            }

            await interaction.reply(`Added ${tracks.length} songs from ${playlistInfo.name} playlist.`);

            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = interaction.member;

            player.queue.add(track);

            await interaction.reply(`Added **${track.info.title}** to the queue.`);

            if (!player.playing && !player.paused) return player.play();

        } else {
            return interaction.reply(`There were no results found for your query.`);
        }
    },
};