module.exports = {
    client_token: process.env.CLIENT_TOKEN,
    client_id: process.env.CLIENT_ID,
    developers: process.env.DEVELOPERS ? process.env.DEVELOPERS.split(",") : [],
    sharding: process.env.SHARDING === "false",
    nodes: [
        {
            host: process.env.NODELINK_HOST || process.env.LAVALINK_HOST || "nodelink",
            port: parseInt(process.env.NODELINK_PORT || process.env.LAVALINK_PORT) || 3000,
            password: process.env.NODELINK_PASSWORD || process.env.LAVALINK_PASSWORD || "youshallnotpass",
            secure: (process.env.NODELINK_SECURE || process.env.LAVALINK_SECURE) === "true"
        }
    ]
}
