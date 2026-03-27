module.exports = {
    client_token: process.env.CLIENT_TOKEN,
    client_id: process.env.CLIENT_ID,
    developers: process.env.DEVELOPERS ? process.env.DEVELOPERS.split(",") : [],
    dev_guild_id: process.env.DEV_GUILD_ID || null,
    sharding: process.env.SHARDING === "false",
    nodes: (() => {
        const nodes = [];
        let i = 1;
        while (process.env[`NODELINK_${i}_HOST`]) {
            nodes.push({
                host: process.env[`NODELINK_${i}_HOST`],
                port: parseInt(process.env[`NODELINK_${i}_PORT`]) || 3000,
                password: process.env[`NODELINK_${i}_PASSWORD`] || "youshallnotpass",
                secure: process.env[`NODELINK_${i}_SECURE`] === "true"
            });
            i++;
        }
        return nodes;
    })()
}
