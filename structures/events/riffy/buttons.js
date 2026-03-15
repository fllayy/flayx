const client = require("../../client");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { buildEmbed, buildRow } = require("../../riffy/tracks/trackStart");

function buildDisabledRow(label, style) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('pause_resume').setLabel('Pause/Resume').setEmoji('⏸').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setEmoji('🔴').setStyle(ButtonStyle.Danger).setDisabled(true),
        new ButtonBuilder().setCustomId('autoplay').setLabel(label).setStyle(style).setDisabled(true)
    );
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const player = client.riffy.players.get(interaction.guild.id);

    if (interaction.customId === 'pause_resume') {
        await interaction.deferUpdate();
        if (!player) return interaction.followUp({ content: `The player doesn't exist`, ephemeral: true });

        player.pause(!player.paused);

    } else if (interaction.customId === 'skip') {
        await interaction.deferUpdate();
        if (!player) return interaction.followUp({ content: `The player doesn't exist`, ephemeral: true });

        player.stop();

        return interaction.message.edit({
            components: [buildDisabledRow('Skipped', ButtonStyle.Success)]
        });

    } else if (interaction.customId === 'stop') {
        await interaction.deferUpdate();
        if (!player) return interaction.followUp({ content: `The player doesn't exist`, ephemeral: true });

        player.destroy();

        return interaction.message.edit({
            components: [buildDisabledRow('Stopped', ButtonStyle.Danger)]
        });

    } else if (interaction.customId === 'autoplay') {
        await interaction.deferUpdate();
        if (!player) return interaction.followUp({ content: `The player doesn't exist`, ephemeral: true });

        player.isAutoplay = !player.isAutoplay;

        if (player.trackData) {
            const updatedEmbed = buildEmbed(player, player.trackData);
            return interaction.message.edit({ embeds: [updatedEmbed] });
        }
    }
});
