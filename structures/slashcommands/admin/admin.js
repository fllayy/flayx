const { EmbedBuilder } = require('discord.js');
const { BLURPLE, DARK } = require('../../constants/colors');
const { getGuildSettings, getDatabaseStats } = require('../../database/index');

const YT_CIPHER_URL = process.env.YT_CIPHER_URL || 'http://yt-cipher:8001';

/** Ping yt-cipher and return { online, latencyMs, error }. */
async function checkYtCipher() {
    const start = Date.now();
    try {
        await fetch(YT_CIPHER_URL, { signal: AbortSignal.timeout(3000) });
        return { online: true, latencyMs: Date.now() - start };
    } catch (e) {
        return { online: false, latencyMs: -1, error: e.message };
    }
}

/**
 * Fetch live stats from a NodeLink node via GET /v4/stats.
 * Returns { ok, latencyMs, stats, error } where stats mirrors the Lavalink v4 stats shape.
 */
async function fetchNodeStats(node) {
    const proto = node.secure ? 'https' : 'http';
    const url   = `${proto}://${node.host}:${node.port}/v4/stats`;
    const start = Date.now();
    try {
        const res = await fetch(url, {
            headers: { Authorization: node.password },
            signal: AbortSignal.timeout(3000),
        });
        const latencyMs = Date.now() - start;
        if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
        const stats = await res.json();
        return { ok: true, latencyMs, stats };
    } catch (e) {
        return { ok: false, latencyMs: Date.now() - start, error: e.message };
    }
}

/** Format a duration in seconds to "Xd Xh Xm Xs". */
function fmtUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

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
            // Run external checks in parallel
            const [dbStats, cipherStats] = await Promise.all([
                getDatabaseStats(),
                checkYtCipher(),
            ]);

            // ── Bot overview ──
            const totalGuilds   = client.guilds.cache.size;
            const totalUsers    = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const activePlayers = client.riffy.players.size;
            const mem           = process.memoryUsage();
            const rssMB         = (mem.rss / 1024 / 1024).toFixed(1);
            const heapMB        = (mem.heapUsed / 1024 / 1024).toFixed(1);

            const botEmbed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle('Bot Statistics')
                .addFields(
                    { name: 'Servers',  value: `\`${totalGuilds}\``,  inline: true },
                    { name: 'Users',    value: `\`${totalUsers}\``,   inline: true },
                    { name: 'Players',  value: `\`${activePlayers}\``, inline: true },
                    { name: 'Uptime',   value: `\`${fmtUptime(Math.floor(process.uptime()))}\``, inline: true },
                    { name: 'RSS',      value: `\`${rssMB} MB\``,     inline: true },
                    { name: 'Heap',     value: `\`${heapMB} MB\``,    inline: true },
                );

            // ── NodeLink nodes — fetch live stats via REST ──
            const nodes      = [...client.riffy.nodes.values()];
            const nodeResults = await Promise.all(nodes.map(n => fetchNodeStats(n)));

            const nodeFields = nodes.map((node, i) => {
                const addr   = `${node.host}:${node.port}`;
                const result = nodeResults[i];
                const label  = `${result.ok ? '[UP]' : '[DOWN]'} ${node.name ?? addr}`;
                if (!result.ok) {
                    return { name: label, value: `\`${addr}\` — ${result.error} (\`${result.latencyMs}ms\`)`, inline: false };
                }
                const { stats } = result;
                const memUsed  = (stats.memory.used      / 1024 / 1024).toFixed(1);
                const memAlloc = (stats.memory.allocated / 1024 / 1024).toFixed(1);
                const cpuSys   = (stats.cpu.systemLoad   * 100).toFixed(1);
                const cpuNlRaw = stats.cpu.lavalinkLoad ?? stats.cpu.nodelinkLoad ?? stats.cpu.appLoad;
                const cpuNl    = cpuNlRaw != null ? (cpuNlRaw * 100).toFixed(1) : null;
                return {
                    name: label,
                    value: [
                        `\`${addr}\` • Latency: \`${result.latencyMs}ms\``,
                        `Players: \`${stats.playingPlayers}/${stats.players}\` • CPU: \`sys ${cpuSys}%${cpuNl != null ? ` / nl ${cpuNl}%` : ''}\``,
                        `Memory: \`${memUsed}/${memAlloc} MB\` • Uptime: \`${fmtUptime(Math.floor(stats.uptime / 1000))}\``,
                    ].join('\n'),
                    inline: false,
                };
            });

            const nodeEmbed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle(`NodeLink — ${nodeResults.filter(r => r.ok).length}/${nodes.length} nodes`)
                .addFields(nodeFields.length ? nodeFields : [{ name: 'No nodes configured', value: '\u200b' }]);

            // ── Infrastructure ──
            const dbValue = [
                `Pool: \`${dbStats.total} total, ${dbStats.idle} idle, ${dbStats.waiting} waiting\``,
                `Latency: \`${dbStats.latencyMs >= 0 ? `${dbStats.latencyMs}ms` : 'error'}\``,
            ].join('\n');

            const cipherValue = cipherStats.online
                ? `Status: \`Online\` • Latency: \`${cipherStats.latencyMs}ms\``
                : `Status: \`Offline\` — ${cipherStats.error ?? 'timeout'}`;

            const infraEmbed = new EmbedBuilder()
                .setColor(BLURPLE)
                .setTitle('Infrastructure')
                .addFields(
                    { name: 'PostgreSQL', value: dbValue,     inline: false },
                    { name: 'yt-cipher',  value: cipherValue, inline: false },
                );

            return interaction.editReply({ embeds: [botEmbed, nodeEmbed, infraEmbed] });
        }

        // ── /admin announce ────────────────────────────────────────────────
        if (sub === 'announce') {
            const message = options.getString('message');
            let sent = 0, failed = 0;

            for (const guild of client.guilds.cache.values()) {
                try {
                    const settings = await getGuildSettings(guild.id);
                    if (!settings.announce_channel) continue;

                    const channel = await guild.channels.fetch(settings.announce_channel).catch(() => null);
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
