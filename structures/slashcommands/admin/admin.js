const { EmbedBuilder } = require('discord.js');
const { BLURPLE, DARK } = require('../../constants/colors');
const { getGuildSettings } = require('../../database/index');

module.exports = {
    name: 'admin',
    description: 'Bot administration — dev server only.',
    devGuildOnly: true,
    options: [
        {
            type: 2, // SUB_COMMAND_GROUP
            name: 'servers',
            description: 'Manage servers the bot is in.',
            options: [
                {
                    type: 1, // SUB_COMMAND
                    name: 'list',
                    description: 'List all servers with their ID and member count.',
                },
                {
                    type: 1,
                    name: 'kick',
                    description: 'Make the bot leave a server.',
                    options: [
                        {
                            type: 3, // STRING
                            name: 'guild_id',
                            description: 'The server ID to leave.',
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            type: 1, // SUB_COMMAND
            name: 'stats',
            description: 'Show global bot statistics.',
        },
        {
            type: 1,
            name: 'announce',
            description: 'Send a message to the announce channel of every server that has one configured.',
            options: [
                {
                    type: 3,
                    name: 'message',
                    description: 'The message to send.',
                    required: true,
                },
            ],
        },
        {
            type: 2, // SUB_COMMAND_GROUP
            name: 'shard',
            description: 'Shard information.',
            options: [
                {
                    type: 1,
                    name: 'status',
                    description: 'Show the status and ping of every shard.',
                },
            ],
        },
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply({ ephemeral: true });

        const group = options.getSubcommandGroup(false);
        const sub   = options.getSubcommand();

        // ── /admin servers list ────────────────────────────────────────────
        if (group === 'servers' && sub === 'list') {
            const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);

            const PAGE = 15;
            const pages = Math.ceil(guilds.length / PAGE);
            const list = guilds.slice(0, PAGE).map((g, i) =>
                `\`${i + 1}.\` **${g.name}**\n╰ ID: \`${g.id}\` • Members: \`${g.memberCount}\``
            ).join('\n');

            const embed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle(`Servers (${guilds.length})`)
                .setDescription(list || 'No servers.')
                .setFooter({ text: pages > 1 ? `Showing 1–${Math.min(PAGE, guilds.length)} of ${guilds.length}` : `${guilds.length} server(s)` });

            return interaction.editReply({ embeds: [embed] });
        }

        // ── /admin servers kick ────────────────────────────────────────────
        if (group === 'servers' && sub === 'kick') {
            const guildId = options.getString('guild_id');
            const guild   = client.guilds.cache.get(guildId);

            if (!guild) {
                return interaction.editReply({ content: `❌ No server found with ID \`${guildId}\`.` });
            }

            const name = guild.name;
            await guild.leave();
            return interaction.editReply({ content: `✅ Left **${name}** (\`${guildId}\`).` });
        }

        // ── /admin stats ───────────────────────────────────────────────────
        if (sub === 'stats') {
            const totalGuilds  = client.guilds.cache.size;
            const totalUsers   = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const uptimeSec    = Math.floor(process.uptime());
            const d = Math.floor(uptimeSec / 86400);
            const h = Math.floor((uptimeSec % 86400) / 3600);
            const m = Math.floor((uptimeSec % 3600) / 60);
            const s = uptimeSec % 60;
            const uptime = `${d}d ${h}h ${m}m ${s}s`;

            const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

            const activeNodes = [...client.riffy.nodes.values()].filter(n => n.connected).length;
            const totalNodes  = client.riffy.nodes.size;
            const activePlayers = client.riffy.players.size;

            const embed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle('Bot Statistics')
                .addFields(
                    { name: 'Servers',   value: `\`${totalGuilds}\``,                  inline: true },
                    { name: 'Users',     value: `\`${totalUsers}\``,                   inline: true },
                    { name: 'Players',   value: `\`${activePlayers}\``,                inline: true },
                    { name: 'Uptime',    value: `\`${uptime}\``,                       inline: true },
                    { name: 'Memory',    value: `\`${memMB} MB\``,                     inline: true },
                    { name: 'Nodes',     value: `\`${activeNodes}/${totalNodes}\``,    inline: true },
                );

            return interaction.editReply({ embeds: [embed] });
        }

        // ── /admin announce ────────────────────────────────────────────────
        if (sub === 'announce') {
            const message = options.getString('message');
            let sent = 0, failed = 0;

            for (const guild of client.guilds.cache.values()) {
                try {
                    const settings = await getGuildSettings(guild.id);
                    if (!settings.announce_channel) continue;

                    const channel = guild.channels.cache.get(settings.announce_channel);
                    if (!channel?.isTextBased()) continue;

                    await channel.send(message);
                    sent++;
                } catch {
                    failed++;
                }
            }

            return interaction.editReply({
                content: `📢 Announced to **${sent}** server(s)${failed > 0 ? `, failed on **${failed}**` : ''}.`,
            });
        }

        // ── /admin shard status ────────────────────────────────────────────
        if (group === 'shard' && sub === 'status') {
            const shards = client.ws.shards;

            if (shards.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor(DARK)
                    .setTitle('Shard Status')
                    .setDescription('Sharding is disabled — running on a single connection.')
                    .addFields(
                        { name: 'Status', value: `\`${client.ws.status === 0 ? 'READY' : client.ws.status}\``, inline: true },
                        { name: 'Ping',   value: `\`${client.ws.ping}ms\``,                                    inline: true },
                    );
                return interaction.editReply({ embeds: [embed] });
            }

            const STATUS = ['READY', 'CONNECTING', 'RECONNECTING', 'IDLE', 'NEARLY', 'DISCONNECTED', 'WAITING_FOR_GUILDS', 'IDENTIFYING', 'RESUMING'];
            const lines = [...shards.values()].map(s => {
                const guildCount = client.guilds.cache.filter(g => g.shardId === s.id).size;
                return `Shard \`${s.id}\` — ${STATUS[s.status] ?? s.status} — \`${s.ping}ms\` — \`${guildCount}\` guilds`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle(`Shard Status (${shards.size})`)
                .setDescription(lines);

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
