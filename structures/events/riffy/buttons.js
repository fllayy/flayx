const client = require("../../client");
const { ButtonStyle } = require("discord.js");
const { buildEmbed, buildDisabledRow } = require("../../riffy/tracks/trackStart");
const { isAdminOrDJ } = require("../../functions/permissions");
const { startVote, addVote, getVote, clearVote } = require("../../functions/voteManager");
const { getLocale } = require("../../functions/i18n");

async function handleVoteButton(interaction, player, type, t) {
    const guildId = interaction.guild.id;
    const member = interaction.member;

    // Join existing vote
    const existingVote = getVote(guildId);
    if (existingVote) {
        if (existingVote.type !== type) {
            return interaction.reply({ content: t.voteOtherRunning(existingVote.type), ephemeral: true });
        }
        const result = addVote(guildId, member.id);
        if (result?.alreadyVoted) {
            return interaction.reply({ content: t.voteAlreadyVoted, ephemeral: true });
        }
        if (result?.passed) {
            if (type === 'skip') {
                player.stop();
                await interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] }).catch(() => {});
            } else {
                if (player.message) await player.message.delete().catch(() => {});
                player.destroy();
            }
            return interaction.reply({ content: t.votePass, ephemeral: true });
        }
        // Update the vote message with the new count
        if (existingVote.messageRef) {
            await existingVote.messageRef.edit({
                content: t.btnVoteUpdate(type, result.count, result.needed)
            }).catch(() => {});
        }
        return interaction.reply({ content: t.voteAdded(result.count, result.needed), ephemeral: true });
    }

    // Start a new vote
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) return interaction.reply({ content: t.btnNoVoice, ephemeral: true });

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
            if (v.messageRef) await v.messageRef.edit({ content: t.btnVotePassRef(type), components: [] }).catch(() => {});
        },
        onExpire: async (v) => {
            if (v.messageRef) {
                await v.messageRef.edit({ content: t.btnVoteExpire(type, v.voters.size, needed), components: [] }).catch(() => {});
                setTimeout(() => v.messageRef?.delete().catch(() => {}), 5000);
            }
        },
    });

    if (!vote) return interaction.reply({ content: t.voteAlreadyRunning, ephemeral: true });

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
        return interaction.reply({ content: t.btnVoteAction, ephemeral: true });
    }

    const count = getVote(guildId)?.voters.size ?? 1;
    const voteMsg = await interaction.reply({
        content: t.btnVoteStart(type, count, needed),
        fetchReply: true,
    });
    vote.messageRef = voteMsg;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const player = client.riffy.players.get(interaction.guild.id);
    const t = await getLocale(interaction.guild.id);

    if (interaction.customId === 'pause_resume') {
        if (!player) return interaction.reply({ content: t.btnNoPlayer, ephemeral: true });

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjButton, ephemeral: true });
        }

        await interaction.deferUpdate();
        player.pause(!player.paused);

    } else if (interaction.customId === 'skip') {
        if (!player) return interaction.reply({ content: t.btnNoPlayer, ephemeral: true });

        if (await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            clearVote(interaction.guild.id);
            await interaction.deferUpdate();
            player.stop();
            return interaction.message.edit({ components: [buildDisabledRow('Skipped', ButtonStyle.Success)] });
        }

        return handleVoteButton(interaction, player, 'skip', t);

    } else if (interaction.customId === 'stop') {
        if (!player) return interaction.reply({ content: t.btnNoPlayer, ephemeral: true });

        if (await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            clearVote(interaction.guild.id);
            await interaction.deferUpdate();
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
            return;
        }

        return handleVoteButton(interaction, player, 'stop', t);

    } else if (interaction.customId === 'autoplay') {
        if (!player) return interaction.reply({ content: t.btnNoPlayer, ephemeral: true });

        if (!await isAdminOrDJ(interaction.member, interaction.guild.id)) {
            return interaction.reply({ content: t.adminDjButton, ephemeral: true });
        }

        await interaction.deferUpdate();
        player.isAutoplay = !player.isAutoplay;

        if (player.trackData) {
            const updatedEmbed = buildEmbed(player, player.trackData, t);
            return interaction.message.edit({ embeds: [updatedEmbed] }).catch(() => {});
        }
    }
});
