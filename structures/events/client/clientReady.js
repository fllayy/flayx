const { ActivityType } = require("discord.js");
const client = require("../../client");
const { logger } = require("../../functions/logger");

client.on("clientReady", async () => {
    console.log("\n---------------------")
    logger(`${client.user.tag} is ready`, "success")
    console.log("---------------------")

    client.user.setPresence({
        activities: [
            {
                name: "You",
                type: ActivityType.Watching
            }
        ],
        status: "online"
    })
})