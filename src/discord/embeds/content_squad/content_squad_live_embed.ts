import { CSMember } from "@prisma/client";
import { HelixStream } from "@twurple/api";
import { EmbedBuilder, User } from "discord.js";

export function createContentSquadLiveEmbed(
  user: User,
  member: (CSMember & { streamData?: HelixStream | null }),
) {
  return new EmbedBuilder()
    .setTitle(`**${member.streamData?.title ?? 'No Title'}**`)
    .setAuthor({
      name: user.tag,
      iconURL: user.avatarURL()!
    })
    .setURL(`https://twitch.tv/${member.streamData?.userName}`)
    .setColor('#${member.color}')
    .setThumbnail(
      member.streamData?.thumbnailUrl
        .replace('{width}', '1280')
        .replace('{height}', '720')
      ?? null
    )
    .setDescription(`<@${user.id}> is now live on Twitch!`)
    .setTimestamp()
}