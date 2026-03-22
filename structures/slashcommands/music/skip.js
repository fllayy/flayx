const { isAdminOrDJ } = require('../../functions/permissions');
const { startVote, addVote, getVote, clearVote } = require('../../functions/voteManager');
const { getLocale } = require('../../functions/i18n');

module.exports = {
    name: 'skip',
    description: 'Skips the current track',
    inVoice: true,
    sameVoice: true,
    player: true,
    run: async (client, interaction) => {
        const t = await getLocale(interaction.guild.id);
        const player = client.riffy.players.get(interaction.guild.id);
        const guildId = interaction.guild.id;
        const member = interaction.member;

        if (await isAdminOrDJ(member, guildId)) {
            clearVote(guildId);
            player.stop();
            return interaction.reply({ content: t.skipDone, ephemeral: true });
        }

        // Join existing vote if one is running
        const existingVote = getVote(guildId);
        if (existingVote) {
            if (existingVote.type !== 'skip') {
                return interaction.reply({ content: t.voteOtherRunning(existingVote.type), ephemeral: true });
            }
            const result = addVote(guildId, member.id);
            if (result?.alreadyVoted) {
                return interaction.reply({ content: t.voteAlreadyVoted, ephemeral: true });
            }
            if (result?.passed) {
                player.stop();
                return interaction.reply({ content: t.votePass });
            }
            return interaction.reply({ content: t.voteAdded(result.count, result.needed), ephemeral: true });
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
                if (v.messageRef) await v.messageRef.edit({ content: t.skipVotePassRef, components: [] }).catch(() => {});
            },
            onExpire: async (v) => {
                if (v.messageRef) {
                    await v.messageRef.edit({ content: t.skipVoteExpire(v.voters.size, needed), components: [] }).catch(() => {});
                    setTimeout(() => v.messageRef?.delete().catch(() => {}), 5000);
                }
            },
        });

        if (!vote) return interaction.reply({ content: t.voteAlreadyRunning, ephemeral: true });

        const addResult = addVote(guildId, member.id);

        // Immediate pass (alone in VC)
        if (addResult?.passed) {
            player.stop();
            return interaction.reply({ content: t.skipSolo, ephemeral: true });
        }

        const count = getVote(guildId)?.voters.size ?? 1;
        const voteMsg = await interaction.reply({ content: t.skipVoteStart(count, needed), fetchReply: true });
        vote.messageRef = voteMsg;
    },
};
