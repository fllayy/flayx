const { isAdminOrDJ } = require('../../functions/permissions');

module.exports = {
    name: 'pause',
    description: 'Pauses the current track',
    inVoice: true,
    sameVoice: true,
    player: true,
    run: async (client, interaction) => {
        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: `Tu dois être admin ou avoir le rôle DJ pour utiliser cette commande.`, ephemeral: true });
        }

        const player = client.riffy.players.get(interaction.guild.id);

        if (player.paused) {
            return interaction.reply({ content: `The player is already paused`, ephemeral: true });
        }

        player.pause(true);
        return interaction.reply({ content: `Paused the current track`, ephemeral: true });
    },
};
