const { isAdminOrDJ } = require('../../functions/permissions');
const { getLocale } = require('../../functions/i18n');

module.exports = {
    name: 'shuffle',
    description: 'Mélanger aléatoirement la queue',
    inVoice: true,
    sameVoice: true,
    player: true,

    run: async (client, interaction) => {
        const t = await getLocale(interaction.guild.id);

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjRequired, ephemeral: true });
        }

        const player = client.riffy.players.get(interaction.guild.id);

        if (!player.queue.length) {
            return interaction.reply({ content: t.shuffleEmpty, ephemeral: true });
        }

        // Fisher-Yates in-place shuffle
        for (let i = player.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
        }

        return interaction.reply({ content: t.shuffleDone(player.queue.length), ephemeral: true });
    },
};
