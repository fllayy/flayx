const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { Dynamic } = require("musicard");
const client = require("../../client");

function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('pause_resume')
            .setLabel('Pause/Resume')
            .setEmoji('⏸')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setEmoji('🔴')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('autoplay')
            .setLabel('Autoplay')
            .setEmoji('💡')
            .setStyle(ButtonStyle.Primary)
    );
}

function buildEmbed(player, track) {
    const duration = formatDuration(track.info.length);
    const queueLength = player.queue?.length ?? 0;
    const volume = player.volume ?? 100;
    const autoplay = player.isAutoplay ? 'enabled' : 'disabled';
    const source = track.info.sourceName ?? 'unknown';

    return new EmbedBuilder()
        .setTitle('Music Controller | FLAYX')
        .setDescription(
            `**Now Playing:**\n[${track.info.title}](${track.info.uri}) by \`${track.info.author}\`\n\nThis track was recommended via ${source}`
        )
        .setImage('attachment://musicard.png')
        .setFooter({ text: `Queue Length: ${queueLength} | Duration: ${duration} | Volume: ${volume}% | Autoplay: ${autoplay}` })
        .setColor(0x5865F2);
}

client.riffy.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);

    const musicard = await Dynamic({
        thumbnailImage: track.info.thumbnail,
        name: track.info.title,
        author: track.info.author
    });

    const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
    const embed = buildEmbed(player, track);
    const row = buildRow();

    player.trackData = track;

    const msg = await channel.send({
        embeds: [embed],
        files: [attachment],
        components: [row]
    });

    player.message = msg;
});

module.exports = { buildEmbed, buildRow, formatDuration };
