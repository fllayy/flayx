module.exports = {
    client_token: process.env.CLIENT_TOKEN,
    client_id: process.env.CLIENT_ID,
    developers: process.env.DEVELOPERS ? process.env.DEVELOPERS.split(",") : [],
    sharding: process.env.SHARDING === "false",
    nodes: [
        {
            host: process.env.LAVALINK_HOST || "lavalink",
            port: parseInt(process.env.LAVALINK_PORT) || 2333,
            password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
            secure: process.env.LAVALINK_SECURE === "false"
        }
    ]
}
