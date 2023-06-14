import { Tournament } from "@prisma/client";
import { RestOrArray, APIEmbedField, EmbedBuilder } from "discord.js";
import { DEFAULT_AUTH_URL, getServers } from "knockoutcity-auth-client";

async function buildSummaryFields(
  tournament: Tournament
): Promise<RestOrArray<APIEmbedField>> {
  const servers = await getServers(DEFAULT_AUTH_URL)
  const server = servers.data.filter(
    (s) => `${s.id}` === tournament.serverId
  )[0]

  const teamSize = tournament.teamSize
  return [
    { name: 'Tournament Status', value: `${tournament.status}` },
    { name: 'Team Size', value: `${teamSize}v${teamSize}` },
    { name: 'Server Name', value: server.name, inline: true },
    { name: 'Server Region', value: server.region, inline: true },
  ];
}

export async function createTournamentOrganizerEmbed(
  tournament: Tournament
) {
  return new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(tournament.title)
    .setDescription(tournament.description)
    .addFields(...await buildSummaryFields(tournament))
    .setTimestamp()
}