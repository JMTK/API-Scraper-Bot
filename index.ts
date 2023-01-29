import Discord from 'discord.js';
import Config from './config.json';

console.log("Logging into bot...");
let token = Config.BotToken ?? process.env.DISCORD_BOT_TOKEN;
let client = new Discord.Client({intents: ['Guilds']});
client.login(token).then(() => console.log("Logged in!")).catch(console.error);

async function getEndpointResponse(url : string) {
    return await (await fetch(url)).text();
}

let urls = Config.URLsToCheck;
let lastKnownResponseText : (string | null) = null;
console.log("Starting check of URLs! Found ", urls, "to check for...");
setInterval(async () => {
    for (let url of urls) {
        try {
            let newEndpointResponseText = await getEndpointResponse(url);
            if (lastKnownResponseText === null) {
                lastKnownResponseText = newEndpointResponseText;
                continue;
            }
            if (lastKnownResponseText !== newEndpointResponseText) {
                lastKnownResponseText = newEndpointResponseText;
                //alert!
                let channel = client.channels.cache.get(Config.ChannelIDToPostTo);
                if (!channel) {
                    channel = client.channels.cache.find(c => (c as Discord.TextChannel).name === Config.ChannelIDToPostTo);
                    if (!channel) {
                        throw "Could not find channel from your config. Try making sure you have the right ID or just type the name of the channel and the bot has read permissions";
                    }
                }
                if (!channel.isTextBased()) {
                    throw "Channel is not text-based and bot cannot send to it!";
                }
                if (!(channel as Discord.TextChannel).permissionsFor(client.user!)!.has('SendMessages')) {
                    throw "Bot does not have permissions to post in the config channel!";
                }

                await channel.send({content: `Text has changed for url:${url}\n${newEndpointResponseText}`});
            }
        }
        catch(ex) {
            console.error("Failed to scrape url", url, "because of error: ", ex);
        }
    }
}, Config.FrequencyToCheckInSeconds * 1000);