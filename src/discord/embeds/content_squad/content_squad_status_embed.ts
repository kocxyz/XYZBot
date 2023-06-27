import { CSMember } from '@prisma/client';
import { HelixStream } from '@twurple/api';
import { EmbedBuilder } from 'discord.js';

function getLiveEmoji(member: CSMember): string {
  return member.live ? '🔴' : '⚫';
}

function getGame(member: CSMember & { streamData?: HelixStream | null }) {
  return member.streamData && member.streamData.gameName
    ? member.streamData.gameName
    : 'offline';
}

function generateDescription(
  member: CSMember & { streamData?: HelixStream | null },
) {
  return `${getLiveEmoji(
    member,
  )} **[${member.twitchName.toUpperCase()}](https://twitch.tv/${
    member.twitchName
  })** - ${getGame(member)}`;
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
        : 'No Creator Squad Members found.',
    )
    .setThumbnail(avatarURL)
    .setTimestamp();
}
