import { RestOrArray, APIEmbedField, EmbedBuilder } from "discord.js";
import { KOCServer } from "knockoutcity-auth-client";

function buildSummaryFields(
  teamSize?: number,
  server?: KOCServer
): RestOrArray<APIEmbedField> {
  const fields = [];

  if (teamSize) {
    fields.push([
      { name: 'Team Size', value: `${teamSize}v${teamSize}` },
    ])
  }

  if (server) {
    fields.push([
      { name: 'Server Name', value: server.name, inline: true },
      { name: 'Server Region', value: server.region, inline: true },
    ])
  }

  return fields.flat(1);
}

export function createTournamentCreationSummaryEmbed(
  name: string,
  description: string,
  teamSize?: number,
  server?: KOCServer
) {
  return new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(name)
    .setDescription(description)
    .addFields(...buildSummaryFields(teamSize, server))
    .setTimestamp()
}