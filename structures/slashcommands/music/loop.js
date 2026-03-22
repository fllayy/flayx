const { ApplicationCommandOptionType } = require('discord.js');
const { isAdminOrDJ } = require('../../functions/permissions');
const { buildEmbed } = require('../../riffy/tracks/trackStart');
const { getLocale } = require('../../functions/i18n');

module.exports = {
    name: 'loop',
    description: 'Définir le mode de répétition de la lecture',
    inVoice: true,
    sameVoice: true,
    player: true,
    options: [
        {
            name: 'mode',
            description: 'Mode de répétition',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Piste (🔂)', value: 'track' },
                { name: 'Queue (🔁)', value: 'queue' },
                { name: 'Désactivé', value: 'none' },
            ],
        },
    ],

    run: async (client, interaction, options) => {
        const t = await getLocale(interaction.guild.id);

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjRequired, ephemeral: true });
        }

        const mode = options.getString('mode');
        const player = client.riffy.players.get(interaction.guild.id);

        player.loop = mode;

        if (player.message && player.trackData) {
            const updatedEmbed = buildEmbed(player, player.trackData, t);
            await player.message.edit({ embeds: [updatedEmbed] }).catch(() => {});
        }

        return interaction.reply({ content: t.loopDone(t.loopLabels[mode]), ephemeral: true });
    },
};
