import { CSMember } from "@prisma/client";
import { HelixStream } from "@twurple/api";
import { EmbedBuilder } from "discord.js";

export function createContentSquadStatusEmbed(
  avatarURL: string,
  members: (CSMember & { streamData?: HelixStream | null })[],
) {
  return new EmbedBuilder()
    .setColor(0x808080)
    .setTitle('Creator Squad Members')
    .setDescription(
      members.map((member) => `${member.live ? "🔴" : "⚫"} **[${member.twitchName.toUpperCase()}](https://twitch.tv/${member.twitchName})** - ${member.streamData && member.streamData.gameName ? member.streamData.gameName : 'offline'}`).join("\n\n")
    )
    .setThumbnail(avatarURL)
    .setTimestamp()
}