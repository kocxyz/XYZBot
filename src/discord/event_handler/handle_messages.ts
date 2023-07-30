import { ChannelType, Message } from 'discord.js';
import { environment } from '../../environment';
import fs from 'fs';

export function logMessage(message: Message): void {
    const channel = message.channel;
    
    if (message.guild?.id !== environment.DISCORD_GUILD_ID) return;
    if (!message.content) return;
    if (channel.type !== ChannelType.GuildText) return;
        
    const time = new Date(message.createdTimestamp).toISOString().slice(11, 16);
    const date = new Date(message.createdTimestamp).toISOString().split('T')[0];

    const path = `${environment.DISCORD_LOG_BASEPATH}/${date}/${channel.name}.log`;
    const content = `[${time}] ${message.author.username}: ${message.content}\n`;

    if(!fs.existsSync(`${environment.DISCORD_LOG_BASEPATH}/${date}`)) fs.mkdirSync(`${environment.DISCORD_LOG_BASEPATH}/${date}`, { recursive: true });

    fs.appendFile(path, content, (err) => {
        if (err) throw err;
    });
}