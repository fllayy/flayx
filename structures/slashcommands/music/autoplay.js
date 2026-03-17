const { ApplicationCommandOptionType } = require('discord.js');
const { buildEmbed } = require('../../riffy/tracks/trackStart');
const { isAdminOrDJ } = require('../../functions/permissions');

module.exports = {
    name: 'autoplay',
    description: 'Enable or disable autoplay',
    inVoice: true,
    sameVoice: true,
    player: true,
    options: [
        {
            name: 'state',
            description: 'Turn autoplay on or off',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'On', value: 'on' },
                { name: 'Off', value: 'off' },
            ],
        }
    ],
    run: async (client, interaction) => {
        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: `Tu dois être admin ou avoir le rôle DJ pour utiliser cette commande.`, ephemeral: true });
        }

        const player = client.riffy.players.get(interaction.guild.id);
        const state = interaction.options.getString('state');

        player.isAutoplay = state === 'on';

        if (player.message && player.trackData) {
            const updatedEmbed = buildEmbed(player, player.trackData);
            await player.message.edit({ embeds: [updatedEmbed] });
        }

        return interaction.reply(`Autoplay is now **${state === 'on' ? 'enabled' : 'disabled'}**.`);
    },
};
