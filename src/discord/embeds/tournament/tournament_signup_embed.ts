import { Tournament, Participant } from '@prisma/client';
import { EmbedBuilder } from 'discord.js';
import { getServers, DEFAULT_AUTH_URL } from 'knockoutcity-auth-client';

export async function createTournamentSignupEmbed(
  tournament: Tournament & {
    participants: Participant[];
  },
) {
  const servers = await getServers(DEFAULT_AUTH_URL);
  const server = servers.data.filter(
    (s) => `${s.id}` === `${tournament.serverId}`,
  )[0];

  const participants = tournament.participants.length;

  return new EmbedBuilder()
    .setTitle(tournament.title)
    .setDescription(tournament.description)
    .addFields([
      {
        name: 'Team Size',
        value: `${tournament.teamSize}v${tournament.teamSize}`,
      },
      {
        name: tournament.teamSize === 1 ? 'Participants' : 'Teams',
        value:
          tournament.teamSize === 1
            ? `${participants}`
            : `${participants}  (${tournament.teamSize * participants})`,
      },
      { name: 'Server Name', value: server.name, inline: true },
      { name: 'Server Region', value: server.region, inline: true },
    ]);
}
