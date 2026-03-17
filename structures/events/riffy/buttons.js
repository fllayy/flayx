const client = require("../../client");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { buildEmbed, buildRow } = require("../../riffy/tracks/trackStart");
const { isAdminOrDJ } = require("../../functions/permissions");
const { startVote, addVote, getVote } = require("../../functions/voteManager");

function buildDisabledRow(label, style) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('pause_resume').setLabel('Pause/Resume').setEmoji('⏸').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setEmoji('🔴').setStyle(ButtonStyle.Danger).setDisabled(true),
        new ButtonBuilder().setCustomId('autoplay').setLabel(label).setStyle(style).setDisabled(true)
    );
}

async function handleVoteButton(interaction, player, type) {
    const guildId = interaction.guild.id;
    const member = interaction.member;

    // Join existing vote
    const existingVote = getVote(guildId);
    if (existingVote) {
        if (existingVote.type !== type) {
            return interaction.reply({ content: `Un vote de **${existingVote.type}** est déjà en cours.`, ephemeral: true });
        }
        const result = addVote(guildId, member.id);
        if (result?.alreadyVoted) {
            return interaction.reply({ content: `Tu as déjà voté!`, ephemeral: true });
        }
        if (result?.passed) {
            if (type === 'skip') {
                player.stop();
                await interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] }).catch(() => {});
            } else {
                if (player.message) await player.message.delete().catch(() => {});
                player.destroy();
            }
            return interaction.reply({ content: `✅ Vote passé!`, ephemeral: true });
        }
        return interaction.reply({ content: `🗳️ Vote ajouté! **${result.count}/${result.needed}** votes.`, ephemeral: true });
    }

    // Start a new vote
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) return interaction.reply({ content: `Tu dois être dans un salon vocal.`, ephemeral: true });

    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;
    const needed = Math.floor(memberCount / 2) + 1;

    const vote = startVote(guildId, {
        type,
        needed,
        onPass: async (v) => {
            if (type === 'skip') {
                player.stop();
                await interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] }).catch(() => {});
            } else {
                if (player.message) await player.message.delete().catch(() => {});
                player.destroy();
            }
            if (v.messageRef) await v.messageRef.edit({ content: `✅ Vote de ${type} passé!`, components: [] }).catch(() => {});
        },
        onExpire: async (v) => {
            if (v.messageRef) await v.messageRef.edit({ content: `❌ Vote de ${type} expiré (60s).`, components: [] }).catch(() => {});
        },
    });

    if (!vote) return interaction.reply({ content: `Un vote est déjà en cours.`, ephemeral: true });

    const addResult = addVote(guildId, member.id);

    // Immediate pass (alone in VC)
    if (addResult?.passed) {
        if (type === 'skip') {
            player.stop();
            await interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] }).catch(() => {});
        } else {
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
        }
        return interaction.reply({ content: `✅ Action effectuée.`, ephemeral: true });
    }

    const count = getVote(guildId)?.voters.size ?? 1;
    const voteMsg = await interaction.reply({
        content: `🗳️ Vote de **${type}** lancé par ${member}!\n**${count}/${needed}** votes nécessaires (60s).\n\nClique le bouton ou utilise \`/${type}\` pour voter.`,
        fetchReply: true,
    });
    vote.messageRef = voteMsg;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const player = client.riffy.players.get(interaction.guild.id);

    if (interaction.customId === 'pause_resume') {
        if (!player) return interaction.reply({ content: `The player doesn't exist`, ephemeral: true });

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: `Tu dois être admin ou avoir le rôle DJ pour utiliser ce bouton.`, ephemeral: true });
        }

        await interaction.deferUpdate();
        player.pause(!player.paused);

    } else if (interaction.customId === 'skip') {
        if (!player) return interaction.reply({ content: `The player doesn't exist`, ephemeral: true });

        if (await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            await interaction.deferUpdate();
            player.stop();
            return interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] });
        }

        return handleVoteButton(interaction, player, 'skip');

    } else if (interaction.customId === 'stop') {
        if (!player) return interaction.reply({ content: `The player doesn't exist`, ephemeral: true });

        if (await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            await interaction.deferUpdate();
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
            return;
        }

        return handleVoteButton(interaction, player, 'stop');

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
