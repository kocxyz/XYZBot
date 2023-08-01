import { ChannelType, Message, PartialMessage } from 'discord.js';
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

export function logEditMessage(oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage): void {
    const channel = newMessage.channel;

    if (newMessage.guild?.id !== environment.DISCORD_GUILD_ID) return;
    if (!newMessage.content) return;
    if (channel.type !== ChannelType.GuildText) return;
    if(!newMessage.editedTimestamp) return;

    const time = new Date(newMessage.editedTimestamp).toISOString().slice(11, 16);
    const date = new Date(newMessage.editedTimestamp).toISOString().split('T')[0];

    const path = `${environment.DISCORD_LOG_BASEPATH}/${date}/${channel.name}.log`;
    const content = `[${time}] ${oldMessage.author?.username} (edit): "${oldMessage.content}" >>> "${newMessage.content}"\n`;

    if(!fs.existsSync(`${environment.DISCORD_LOG_BASEPATH}/${date}`)) fs.mkdirSync(`${environment.DISCORD_LOG_BASEPATH}/${date}`, { recursive: true });

    fs.appendFile(path, content, (err) => {
        if (err) throw err;
    });
}