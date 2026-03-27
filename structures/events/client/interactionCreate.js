const { PermissionsBitField } = require("discord.js");
const client = require("../../client");
const { developers, dev_guild_id } = require("../../configuration/index");
const { logger } = require("../../functions/logger");
const { getLocale } = require("../../functions/i18n");

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const t = await getLocale(interaction.guildId);

    try {
        const command = client.slashCommands.get(interaction.commandName);

        const player = client.riffy.players.get(interaction.guildId);
        const memberChannel = interaction.member.voice.channelId;
        const clientChannel = interaction.guild.members.me.voice.channelId;

        if (!command) {
            return interaction.reply({ content: t.cmdUnknown(interaction.commandName), ephemeral: true });
        }

        if (command.devGuildOnly) {
            if (interaction.guildId !== dev_guild_id || !developers.includes(interaction.user.id)) {
                return interaction.reply({ content: t.cmdDevOnly(interaction.commandName), ephemeral: true });
            }
        }

        if (command.developerOnly) {
            if (!developers.includes(interaction.user.id)) {
                return interaction.reply({ content: t.cmdDevOnly(interaction.commandName), ephemeral: true });
            }
        }

        if (command.userPermissions) {
            if (!interaction.channel.permissionsFor(interaction.member).has(PermissionsBitField.resolve(command.userPermissions || []))) {
                return interaction.reply({
                    content: t.cmdUserPerms(command.userPermissions.join(", ")),
                    ephemeral: true,
                });
            }
        }

        if (command.clientPermissions) {
            if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.resolve(command.clientPermissions || []))) {
                return interaction.reply({
                    content: t.cmdBotPerms(command.clientPermissions.join(", ")),
                    ephemeral: true,
                });
            }
        }

        if (command.guildOnly && !interaction.guildId) {
            return interaction.reply({ content: t.cmdGuildOnly(interaction.commandName), ephemeral: true });
        }

        if (command.inVoice && !memberChannel) {
            return interaction.reply({ content: t.cmdInVoice, ephemeral: true });
        }

        if (command.sameVoice && memberChannel !== clientChannel) {
            return interaction.reply({ content: t.cmdSameVoice, ephemeral: true });
        }

        if (command.player && !player) {
            return interaction.reply({ content: t.cmdNoPlayer, ephemeral: true });
        }

        if (command.current && !player.current) {
            return interaction.reply({ content: t.cmdNoCurrent, ephemeral: true });
        }

        await command.run(client, interaction, interaction.options);
    } catch (err) {
        logger("An error occurred while processing a slash command:", "error");
        console.error(err);

        const errReply = { content: t.cmdError(err), flags: 64 };
        return interaction.deferred || interaction.replied
            ? interaction.editReply(errReply)
            : interaction.reply(errReply);
    }
});
