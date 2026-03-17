const { isAdminOrDJ } = require('../../functions/permissions');
const { startVote, addVote, getVote } = require('../../functions/voteManager');

module.exports = {
    name: 'stop',
    description: 'Disconnect the bot from your voice channel',
    inVoice: true,
    sameVoice: true,
    player: true,
    run: async (client, interaction) => {
        const player = client.riffy.players.get(interaction.guildId);
        const guildId = interaction.guild.id;
        const member = interaction.member;

        if (await isAdminOrDJ(member, guildId)) {
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
            return interaction.reply({ content: 'Disconnected from the voice channel.', ephemeral: true });
        }

        // Join existing vote if one is running
        const existingVote = getVote(guildId);
        if (existingVote) {
            if (existingVote.type !== 'stop') {
                return interaction.reply({ content: `Un vote de **${existingVote.type}** est déjà en cours.`, ephemeral: true });
            }
            const result = addVote(guildId, member.id);
            if (result?.alreadyVoted) {
                return interaction.reply({ content: `Tu as déjà voté!`, ephemeral: true });
            }
            if (result?.passed) {
                if (player.message) await player.message.delete().catch(() => {});
                player.destroy();
                return interaction.reply({ content: `✅ Vote passé! Bot déconnecté.` });
            }
            return interaction.reply({ content: `🗳️ Vote ajouté! **${result.count}/${result.needed}** votes.`, ephemeral: true });
        }

        // Start a new vote
        const voiceChannel = member.voice.channel;
        const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;
        const needed = Math.floor(memberCount / 2) + 1;

        const vote = startVote(guildId, {
            type: 'stop',
            needed,
            onPass: async (v) => {
                if (player.message) await player.message.delete().catch(() => {});
                player.destroy();
                if (v.messageRef) await v.messageRef.edit({ content: `✅ Vote de stop passé! Bot déconnecté.`, components: [] }).catch(() => {});
            },
            onExpire: async (v) => {
                if (v.messageRef) await v.messageRef.edit({ content: `❌ Vote de stop expiré — **${v.voters.size}/${needed}** votes.`, components: [] }).catch(() => {});
            },
        });

        if (!vote) return interaction.reply({ content: `Un vote est déjà en cours.`, ephemeral: true });

        const addResult = addVote(guildId, member.id);

        // Immediate pass (alone in VC)
        if (addResult?.passed) {
            if (player.message) await player.message.delete().catch(() => {});
            player.destroy();
            return interaction.reply({ content: `✅ Bot déconnecté.`, ephemeral: true });
        }

        const count = getVote(guildId)?.voters.size ?? 1;
        const voteMsg = await interaction.reply({
            content: `🗳️ Vote de **stop** lancé!\n**${count}/${needed}** votes nécessaires (60s).\n\nUtilise \`/stop\` ou clique sur le bouton stop du player pour voter.`,
            fetchReply: true,
        });
        vote.messageRef = voteMsg;
    },
};
