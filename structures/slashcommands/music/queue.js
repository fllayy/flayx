const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js');

const ITEMS_PER_PAGE = 10;
const TIMEOUT = 2 * 60 * 1000;

module.exports = {
    name: 'queue',
    description: 'View or manage the current queue',
    inVoice: true,
    sameVoice: true,
    player: true,
    options: [
        {
            name: 'clear',
            description: 'Clear the queue: use "all" or a track index (e.g. 3)',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    run: async (client, interaction, options) => {
        const player = client.riffy.players.get(interaction.guild.id);
        const clearArg = options.getString('clear');

        // /queue clear:all
        if (clearArg !== null) {
            if (clearArg.toLowerCase() === 'all') {
                player.queue.splice(0);
                return interaction.reply({ content: '🗑️ Queue cleared.', ephemeral: true });
            }

            // /queue clear:<index>
            const index = parseInt(clearArg, 10);
            if (isNaN(index) || index < 1 || index > player.queue.length) {
                return interaction.reply({
                    content: `❌ Invalid index. The queue has **${player.queue.length}** track(s). Use a number between 1 and ${player.queue.length}.`,
                    ephemeral: true,
                });
            }

            const [removed] = player.queue.splice(index - 1, 1);
            return interaction.reply({
                content: `🗑️ Removed **${removed.info.title}** from the queue.`,
                ephemeral: true,
            });
        }

        // /queue — show paginated queue
        const queue = player.queue;

        if (!queue.length && !player.current) {
            return interaction.reply({ content: '📭 The queue is empty.', ephemeral: true });
        }

        const totalPages = Math.max(1, Math.ceil(queue.length / ITEMS_PER_PAGE));
        let currentPage = 0;

        function buildEmbed(page) {
            const start = page * ITEMS_PER_PAGE;
            const tracks = queue.slice(start, start + ITEMS_PER_PAGE);

            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('🎵 Current Queue')
                .setFooter({ text: `Page ${page + 1}/${totalPages} • ${queue.length} track(s) in queue` });

            if (player.current) {
                embed.addFields({
                    name: '▶ Now Playing',
                    value: `**[${player.current.info.title}](${player.current.info.uri})**`,
                });
            }

            if (tracks.length) {
                const lines = tracks.map((track, i) => {
                    const title = track.info.title.length > 40
                        ? track.info.title.slice(0, 39) + '…'
                        : track.info.title;
                    return `**${start + i + 1}.** [${title}](${track.info.uri})`;
                });
                embed.addFields({ name: 'Up Next', value: lines.join('\n') });
            } else if (!player.current) {
                embed.setDescription('No tracks in queue.');
            }

            return embed;
        }

        function buildRow(page, disabled = false) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('queue_prev')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled || page === 0),
                new ButtonBuilder()
                    .setCustomId('queue_next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled || page >= totalPages - 1),
            );
        }

        const reply = await interaction.reply({
            embeds: [buildEmbed(currentPage)],
            components: totalPages > 1 ? [buildRow(currentPage)] : [],
            fetchReply: true,
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({ time: TIMEOUT });

        collector.on('collect', async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: 'Only the person who ran this command can navigate the queue.', ephemeral: true });
            }

            await btn.deferUpdate();

            if (btn.customId === 'queue_prev' && currentPage > 0) currentPage--;
            if (btn.customId === 'queue_next' && currentPage < totalPages - 1) currentPage++;

            await reply.edit({
                embeds: [buildEmbed(currentPage)],
                components: [buildRow(currentPage)],
            });
        });

        collector.on('end', async () => {
            await reply.edit({ components: [buildRow(currentPage, true)] }).catch(() => {});
        });
    },
};
