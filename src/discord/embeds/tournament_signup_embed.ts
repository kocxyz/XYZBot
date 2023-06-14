import { Tournament, Brawler, Team } from "@prisma/client";
import { EmbedBuilder } from "discord.js";
import { getServers, DEFAULT_AUTH_URL } from "knockoutcity-auth-client";

export async function createTournamentSignupEmbed(
  tournament: Tournament & {
    participants: Brawler[],
    teams: Team[]
  }
) {
  const servers = await getServers(DEFAULT_AUTH_URL)
  const server = servers.data.filter(
    (s) => `${s.id}` === `${tournament.serverId}`
  )[0];

  return new EmbedBuilder()
    .setTitle(tournament.title)
    .setDescription(tournament.description)
    .addFields([
      { name: 'Team Size', value: `${tournament.teamSize}v${tournament.teamSize}` },
      {
        name: tournament.teamSize === 1
          ? 'Participants'
          : 'Teams',
        value: tournament.teamSize === 1
          ? `${tournament.participants.length}`
          : `${tournament.teams.length}  (${tournament.participants.length})`
      },
      { name: 'Server Name', value: server.name, inline: true },
      { name: 'Server Region', value: server.region, inline: true },
    ])
}