const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const { BLURPLE } = require('../../constants/colors');
const { getLocale } = require('../../functions/i18n');

const TIMEOUT = 5 * 60 * 1000;

const CATEGORY_ICONS = {
    information: '📋',
    music:       '🎵',
    settings:    '⚙️',
};

function groupByCategory(slashCommands) {
    const map = {};
    for (const cmd of slashCommands.values()) {
        const cat = cmd.category || 'other';
        if (!map[cat]) map[cat] = [];
        map[cat].push(cmd);
    }
    return map;
}

function buildOverviewEmbed(categories, t) {
    const total = Object.values(categories).reduce((acc, cmds) => acc + cmds.length, 0);

    const embed = new EmbedBuilder()
        .setColor(BLURPLE)
        .setTitle(t.helpTitle)
        .setDescription(t.helpDescription)
        .setFooter({ text: t.helpTotalFooter(total) });

    for (const [cat, cmds] of Object.entries(categories)) {
        const icon = CATEGORY_ICONS[cat] ?? '•';
        const label = t.helpCategoryLabels[cat] ?? cat;
        embed.addFields({ name: `${icon} ${label}`, value: `${cmds.length} command(s)`, inline: true });
    }

    return embed;
}

function buildCategoryEmbed(cat, cmds, t) {
    const icon = CATEGORY_ICONS[cat] ?? '•';
    const label = t.helpCategoryLabels[cat] ?? cat;

    const lines = cmds.map(cmd => `\`/${cmd.name}\` — ${cmd.description}`);

    return new EmbedBuilder()
        .setColor(BLURPLE)
        .setTitle(t.helpCategoryDesc(icon, label))
        .setDescription(lines.join('\n'));
}

function buildSelectRow(categories, t, selected) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder(t.helpSelectPlaceholder)
        .addOptions(
            Object.keys(categories).map(cat => {
                const icon = CATEGORY_ICONS[cat] ?? '•';
                const label = t.helpCategoryLabels[cat] ?? cat;
                const opt = new StringSelectMenuOptionBuilder()
                    .setLabel(`${icon} ${label}`)
                    .setValue(cat);
                if (cat === selected) opt.setDefault(true);
                return opt;
            })
        );

    return new ActionRowBuilder().addComponents(menu);
}

function buildBackRow(t) {
    const btn = new ButtonBuilder()
        .setCustomId('help_back')
        .setLabel(t.helpBackBtn)
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(btn);
}

module.exports = {
    name: 'help',
    description: 'View all available commands',

    run: async (client, interaction) => {
        const t = await getLocale(interaction.guild.id);
        const categories = groupByCategory(client.slashCommands);

        const reply = await interaction.reply({
            embeds: [buildOverviewEmbed(categories, t)],
            components: [buildSelectRow(categories, t)],
            ephemeral: true,
            fetchReply: true,
        });

        const collector = reply.createMessageComponentCollector({ time: TIMEOUT });

        let lastComponents = [buildSelectRow(categories, t)];

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: t.helpNavOnly, ephemeral: true });
            }

            if (i.isStringSelectMenu() && i.customId === 'help_category') {
                const cat = i.values[0];
                const components = [buildSelectRow(categories, t, cat), buildBackRow(t)];
                lastComponents = components;
                await i.update({
                    embeds: [buildCategoryEmbed(cat, categories[cat], t)],
                    components,
                });
            }

            if (i.isButton() && i.customId === 'help_back') {
                const components = [buildSelectRow(categories, t)];
                lastComponents = components;
                await i.update({
                    embeds: [buildOverviewEmbed(categories, t)],
                    components,
                });
            }
        });

        collector.on('end', () => {
            const disabled = lastComponents.map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components = newRow.components.map(c => c.setDisabled(true));
                return newRow;
            });
            reply.edit({ components: disabled }).catch(() => {});
        });
    },
};
