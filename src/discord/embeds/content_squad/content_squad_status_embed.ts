import { CSMember } from "@prisma/client";
import { HelixStream } from "@twurple/api";
import { EmbedBuilder } from "discord.js";

function generateDescription(
  member: CSMember & { streamData?: HelixStream | null }
) {
  return `${member.live ? "🔴" : "⚫"} **[${member.twitchName.toUpperCase()}](https://twitch.tv/${member.twitchName})** - ${member.streamData && member.streamData.gameName ? member.streamData.gameName : 'offline'}`
}

export function createContentSquadStatusEmbed(
  avatarURL: string,
  members: (CSMember & { streamData?: HelixStream | null })[],
) {
  return new EmbedBuilder()
    .setColor(0x808080)
    .setTitle('Creator Squad Members')
    .setDescription(
      members.length > 0
        ? members.map((member) => generateDescription(member)).join('\n\n')
        : 'No Creator Squad Members found.'
    )
    .setThumbnail(avatarURL)
    .setTimestamp()
}