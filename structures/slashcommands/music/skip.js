const { isAdminOrDJ } = require('../../functions/permissions');
const { startVote, addVote, getVote } = require('../../functions/voteManager');

module.exports = {
    name: 'skip',
    description: 'Skips the current track',
    inVoice: true,
    sameVoice: true,
    player: true,
    run: async (client, interaction) => {
        const player = client.riffy.players.get(interaction.guild.id);
        const guildId = interaction.guild.id;
        const member = interaction.member;

        if (await isAdminOrDJ(member, guildId)) {
            player.stop();
            return interaction.reply({ content: 'Skipped the current track.', ephemeral: true });
        }

        // Join existing vote if one is running
        const existingVote = getVote(guildId);
        if (existingVote) {
            if (existingVote.type !== 'skip') {
                return interaction.reply({ content: `Un vote de **${existingVote.type}** est déjà en cours.`, ephemeral: true });
            }
            const result = addVote(guildId, member.id);
            if (result?.alreadyVoted) {
                return interaction.reply({ content: `Tu as déjà voté!`, ephemeral: true });
            }
            if (result?.passed) {
                player.stop();
                return interaction.reply({ content: `✅ Vote passé! Track skippée.` });
            }
            return interaction.reply({ content: `🗳️ Vote ajouté! **${result.count}/${result.needed}** votes.`, ephemeral: true });
        }

        // Start a new vote
        const voiceChannel = member.voice.channel;
        const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;
        const needed = Math.floor(memberCount / 2) + 1;

        const vote = startVote(guildId, {
            type: 'skip',
            needed,
            onPass: async (v) => {
                player.stop();
                if (v.messageRef) await v.messageRef.edit({ content: `✅ Vote de skip passé! Track skippée.`, components: [] }).catch(() => {});
            },
            onExpire: async (v) => {
                if (v.messageRef) await v.messageRef.edit({ content: `❌ Vote de skip expiré — **${v.voters.size}/${needed}** votes.`, components: [] }).catch(() => {});
            },
        });

        if (!vote) return interaction.reply({ content: `Un vote est déjà en cours.`, ephemeral: true });

        const addResult = addVote(guildId, member.id);

        // Immediate pass (alone in VC)
        if (addResult?.passed) {
            player.stop();
            return interaction.reply({ content: `✅ Track skippée.`, ephemeral: true });
        }

        const count = getVote(guildId)?.voters.size ?? 1;
        const voteMsg = await interaction.reply({
            content: `🗳️ Vote de **skip** lancé!\n**${count}/${needed}** votes nécessaires (60s).\n\nUtilise \`/skip\` ou clique le bouton skip du player pour voter.`,
            fetchReply: true,
        });
        vote.messageRef = voteMsg;
    },
};
