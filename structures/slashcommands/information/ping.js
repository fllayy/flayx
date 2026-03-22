const { EmbedBuilder } = require('discord.js');
const { BLURPLE } = require('../../constants/colors');
const { getLocale } = require('../../functions/i18n');

module.exports = {
    name: 'ping',
    description: 'Check the bot latency.',

    run: async (client, interaction) => {
        const t = await getLocale(interaction.guild.id);
        const sent = await interaction.deferReply({ fetchReply: true });
        const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor(BLURPLE)
            .setTitle(t.pingTitle)
            .addFields(
                { name: t.pingWs,  value: `\`${client.ws.ping}ms\``, inline: true },
                { name: t.pingApi, value: `\`${apiLatency}ms\``,     inline: true },
            );

        return interaction.editReply({ embeds: [embed] });
    },
};
