const { readdirSync } = require("fs");
const { REST, Routes, Client, Collection, ActivityType } = require('discord.js');
const { client_id, client_token, nodes, dev_guild_ids } = require("./configuration/index");
const { logger } = require("./functions/logger");
const { Riffy } = require("riffy")
const { initDatabase } = require("./database/index")

const client = new Client({
    intents: [
        "Guilds",
        "GuildMembers",
        "GuildMessages",
        "MessageContent",
        "GuildVoiceStates"
    ]
});

client.slashCommands = new Collection();

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4"
});

module.exports = client;

client.login(client_token).catch((error) => {
    logger("Couldn't login to the bot. Please check the config file.", "error")
    console.error(error)
    return process.exit()
})

process.on('unhandledRejection', error => {
    logger("An unhandled rejection error occured.", "error")
    console.error(error)
})

process.on('uncaughtException', error => {
    logger("An uncaught exception error occured.", "error")
    console.error(error)
})

async function load_events() {
    console.log("\n---------------------")
    logger("INITIATING EVENTS", "debug")

    const dirs = readdirSync('./structures/events/');
    
    for (const dir of dirs) {
        const events = readdirSync(`./structures/events/${dir}`).filter((file) => file.endsWith(".js"));

        for (const file of events) {
            const pull = require(`./events/${dir}/${file}`);

            try {
                if (pull.name && typeof pull.name !== 'string') {
                    logger(`Couldn't load the event ${file}, error: Property event should be string.`)
                    continue;
                }

                pull.name = pull.name || file.replace('.js', '');

                logger(`[EVENTS] ${pull.name}`, "info")
            } catch (err) {
                logger(`Couldn't load the event ${file}, error: ${err}`, "error")
                continue;
            }
        }
    }

    console.log("---------------------")
}

async function load_slash_commands() {
    console.log("\n---------------------")
    logger("INITIATING SLASH COMMANDS", "debug")

    const slash = [];
    const devSlash = [];

    const dirs = readdirSync('./structures/slashcommands/');

    for (const dir of dirs) {
        const commands = readdirSync(`./structures/slashcommands/${dir}`).filter((file) => file.endsWith(".js"));

        for (const file of commands) {
            const pull = require(`./slashcommands/${dir}/${file}`);

            try {
                if (!pull.name || !pull.description) {
                    logger(`Missing a name, description or run function in ${file} slash command.`, "error")
                    continue;
                }

                const data = {};
                for (const key in pull) {
                    data[key.toLowerCase()] = pull[key];
                }

                if (pull.devGuildOnly) {
                    devSlash.push(data);
                } else {
                    slash.push(data);
                }

                pull.category = dir;
                client.slashCommands.set(pull.name, pull);

                logger(`[SLASH] ${pull.name}`, "info")
            } catch (err) {
                logger(`Couldn't load the slash command ${file}, error: ${err}`, "error")
                console.error(err)
                continue;
            }
        }
    }

    console.log("---------------------")

    if (!client_id) {
        logger("Couldn't find the client ID in the config file.", "error")
        return process.exit()
    }

    const rest = new REST({ version: '10' }).setToken(client_token);

    try {
        await rest.put(Routes.applicationCommands(client_id), { body: slash });
        logger("Successfully registered global application commands.", "success")

        if (devSlash.length > 0) {
            if (dev_guild_ids.length === 0) {
                logger("DEV_GUILD_ID is not set — skipping dev command registration.", "warn")
            } else {
                for (const guildId of dev_guild_ids) {
                    await rest.put(Routes.applicationGuildCommands(client_id, guildId), { body: devSlash });
                    logger(`Successfully registered ${devSlash.length} dev command(s) on guild ${guildId}.`, "success")
                }
            }
        }
    } catch (err) {
        logger("Couldn't register application commands.", "error")
        console.error(err);
    }
}

async function load_riffy() {
    console.log("\n---------------------")
    logger("INITIATING RIFFY", "debug")

    const dirs = readdirSync('./structures/riffy/');
    
    for (const dir of dirs) {
        const lavalink = readdirSync(`./structures/riffy/${dir}`).filter(file => file.endsWith('.js'));

        for (let file of lavalink) {
            try {
                let pull = require(`./riffy/${dir}/${file}`);

                if (pull.name && typeof pull.name !== 'string') {
                    logger(`Couldn't load the riffy event ${file}, error: Property event should be string.`, "error")
                    continue;
                }

                pull.name = pull.name || file.replace('.js', '');

                logger(`[RIFFY] ${pull.name}`, "info")
            } catch (err) {
                logger(`Couldn't load the riffy event ${file}, error: ${err}`, "error")
                console.error(err)
                continue;
            }
        }
    }

    console.log("---------------------")
}

client.once('clientReady', async () => {
    client.user.setPresence({
        activities: [{ name: 'Starting...', type: ActivityType.Listening }],
        status: 'dnd'
    });

    client.riffy.init(client.user.id);

    await initDatabase()
    await load_events()
    await load_slash_commands()
    await load_riffy()

    console.log("\n---------------------")
    logger(`${client.user.tag} is ready`, "success")
    console.log("---------------------")

    client.user.setPresence({
        activities: [{ name: '/play', type: ActivityType.Playing }],
        status: 'online'
    });
})