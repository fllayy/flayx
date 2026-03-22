const { isAdminOrDJ } = require('../../functions/permissions');
const { getLocale } = require('../../functions/i18n');

module.exports = {
    name: 'pause',
    description: 'Pauses the current track',
    inVoice: true,
    sameVoice: true,
    player: true,
    run: async (client, interaction) => {
        const t = await getLocale(interaction.guild.id);

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjRequired, ephemeral: true });
        }

        const player = client.riffy.players.get(interaction.guild.id);

        if (player.paused) {
            return interaction.reply({ content: t.pauseAlready, ephemeral: true });
        }

        player.pause(true);
        return interaction.reply({ content: t.pauseDone, ephemeral: true });
    },
};
