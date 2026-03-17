const { Client, CommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { getGuildSettings, setGuildVolume, setGuildDjRole } = require('../../database/index');

function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

module.exports = {
    name: 'settings',
    description: 'Gérer les paramètres du bot sur ce serveur',
    guildOnly: true,
    userPermissions: ['KickMembers'],
    options: [
        {
            name: 'view',
            description: 'Voir tous les paramètres du serveur',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'volume',
            description: 'Définir le volume par défaut du bot (1-100)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'value',
                    description: 'Niveau de volume (1-100)',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                    min_value: 1,
                    max_value: 100,
                },
            ],
        },
        {
            name: 'dj',
            description: 'Définir le rôle DJ du serveur',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'role',
                    description: 'Le rôle à définir comme DJ',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
            ],
        },
    ],

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction, args) => {
        const subcommand = args.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'view') {
            const settings = await getGuildSettings(guildId);
            const djRole = settings.dj_role_id
                ? interaction.guild.roles.cache.get(settings.dj_role_id)
                : null;

            const voiceTime = formatDuration(Number(settings.voice_time_ms ?? 0));

            const embed = new EmbedBuilder()
                .setTitle(`Paramètres — ${interaction.guild.name}`)
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Volume', value: `${settings.volume}%`, inline: true },
                    { name: 'Rôle DJ', value: djRole ? `<@&${djRole.id}>` : 'Aucun', inline: true },
                    { name: 'Temps en vocal', value: `\`${voiceTime}\``, inline: true },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'volume') {
            const volume = args.getInteger('value');
            await setGuildVolume(guildId, volume);

            const player = client.riffy.players.get(guildId);
            if (player) player.setVolume(volume);

            return interaction.reply({
                content: `Volume défini à **${volume}%**${player ? ' (appliqué au lecteur actuel)' : ''}`,
                ephemeral: true,
            });
        }

        if (subcommand === 'dj') {
            const role = args.getRole('role');
            await setGuildDjRole(guildId, role.id);

            return interaction.reply({
                content: `Rôle DJ défini sur <@&${role.id}>`,
                ephemeral: true,
            });
        }
    },
};
