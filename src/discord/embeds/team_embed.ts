import { Brawler, Team } from '@prisma/client';
import { EmbedBuilder } from 'discord.js';

export function createTeamEmbed(
  team: Team & {
    owner: Brawler | null;
    members: Brawler[];
  },
) {
  const totalMatches = team.wins + team.losses;

  return new EmbedBuilder().setTitle(team.name).addFields([
    {
      name: 'Owner',
      value: team.owner?.username ?? '-',
    },
    {
      name: 'Wins / Losses',
      value: `${team.wins} | ${team.losses}`,
      inline: true,
    },
    {
      name: 'Win Rate',
      value:
        totalMatches !== 0 ? `${(team.wins / totalMatches).toFixed(0)}%` : '-',
      inline: true,
    },
    {
      name: 'Members',
      value: team.members.map((member) => `- ${member.username}`).join('\n'),
    },
  ]);
}
