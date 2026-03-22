const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { BLURPLE } = require('../../constants/colors');
const { getGuildSettings, setGuildVolume, setGuildDjRole, setGuildLanguage, setGuildAnnounceChannel } = require('../../database/index');
const { getLocaleFromSettings, LOCALES } = require('../../functions/i18n');
const { isAdmin, isAdminOrDJ } = require('../../functions/permissions');

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
        {
            name: 'language',
            description: 'Choisir la langue des réponses du bot',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'lang',
                    description: 'Langue souhaitée',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Français', value: 'fr' },
                        { name: 'English', value: 'en' },
                    ],
                },
            ],
        },
        {
            name: 'announce_channel',
            description: 'Forcer le bot à poster le lecteur dans un salon spécifique',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Salon textuel cible (laisser vide pour désactiver)',
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                    channel_types: [ChannelType.GuildText],
                },
            ],
        },
    ],

    run: async (client, interaction, args) => {
        const subcommand = args.getSubcommand();
        const guildId = interaction.guild.id;
        const settings = await getGuildSettings(guildId);
        const t = getLocaleFromSettings(settings);

        if (subcommand === 'view') {
            const djRole = settings.dj_role_id
                ? interaction.guild.roles.cache.get(settings.dj_role_id)
                : null;
            const announceChannel = settings.announce_channel
                ? interaction.guild.channels.cache.get(settings.announce_channel)
                : null;
            const voiceTime = formatDuration(Number(settings.voice_time_ms ?? 0));
            const langLabel = settings.language === 'en' ? t.settingsLangEn : t.settingsLangFr;

            const embed = new EmbedBuilder()
                .setTitle(t.settingsViewTitle(interaction.guild.name))
                .setColor(BLURPLE)
                .addFields(
                    { name: t.settingsFieldVolume,    value: `${settings.volume}%`, inline: true },
                    { name: t.settingsFieldDj,        value: djRole ? `<@&${djRole.id}>` : t.settingsViewNone, inline: true },
                    { name: t.settingsFieldLang,      value: langLabel, inline: true },
                    { name: t.settingsFieldAnnounce,  value: announceChannel ? `<#${announceChannel.id}>` : t.settingsViewAuto, inline: true },
                    { name: t.settingsFieldVoiceTime, value: `\`${voiceTime}\``, inline: true },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'dj') {
            if (!isAdmin(interaction.member)) {
                return interaction.reply({ content: t.settingsNoPerms, ephemeral: true });
            }
            const role = args.getRole('role');
            if (role.id === interaction.guild.id) {
                return interaction.reply({ content: t.settingsDjEveryoneRole, ephemeral: true });
            }
            if (role.managed) {
                return interaction.reply({ content: t.settingsDjManagedRole, ephemeral: true });
            }
            await setGuildDjRole(guildId, role.id);
            return interaction.reply({ content: t.settingsDj(role.id), ephemeral: true });
        }

        if (!await isAdminOrDJ(interaction.member, guildId)) {
            return interaction.reply({ content: t.settingsNoPerms, ephemeral: true });
        }

        if (subcommand === 'volume') {
            const volume = args.getInteger('value');
            await setGuildVolume(guildId, volume);
            const player = client.riffy.players.get(guildId);
            if (player) player.setVolume(volume);
            return interaction.reply({ content: t.settingsVolume(volume, !!player), ephemeral: true });
        }

        if (subcommand === 'language') {
            const lang = args.getString('lang');
            await setGuildLanguage(guildId, lang);
            const newT = LOCALES[lang] ?? LOCALES.en;
            const label = lang === 'en' ? newT.settingsLangEn : newT.settingsLangFr;
            return interaction.reply({ content: newT.settingsLang(label), ephemeral: true });
        }

        if (subcommand === 'announce_channel') {
            const channel = args.getChannel('channel');
            if (channel) {
                const botPerms = channel.permissionsFor(interaction.guild.members.me);
                if (!botPerms?.has(PermissionsBitField.Flags.SendMessages)) {
                    return interaction.reply({ content: t.settingsAnnounceNoPerms, ephemeral: true });
                }
                await setGuildAnnounceChannel(guildId, channel.id);
                return interaction.reply({ content: t.settingsAnnounceSet(channel.id), ephemeral: true });
            } else {
                await setGuildAnnounceChannel(guildId, null);
                return interaction.reply({ content: t.settingsAnnounceClear, ephemeral: true });
            }
        }
    },
};
