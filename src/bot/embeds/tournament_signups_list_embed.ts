import { Tournament, Brawler, Team } from "@prisma/client";
import { APIEmbedField, EmbedBuilder } from "discord.js";

export function createTournamentSignupListEmbed(
  tournament: Tournament & {
    participants: Brawler[],
    teams: Team[]
  }
) {
  return new EmbedBuilder()
    .setTitle(`Participants: ${tournament.title}`)
    .setDescription(tournament.description)
    .addFields(
      tournament.teamSize === 1
        ? tournament.participants.map(createSoloEntryField)
        : createTeamEntryFields(tournament)
    )
}

function createSoloEntryField(
  brawler: Brawler
) {
  return {
    name: 'Name',
    value: `${brawler.username}`
  };
}

function createTeamEntryFields(
  tournament: Tournament & {
    participants: Brawler[],
    teams: Team[]
  }
): APIEmbedField[] {
  return tournament.teams.flatMap((team): APIEmbedField[] => {
    const members = tournament.participants.filter(
      (b) => b.teamId === team.id
    );

    return [
      { name: '\u200B', value: '\u200B' },
      { name: 'Team', value: team.name, inline: true },
      ...members.map((b, index) => ({
        name: `Player ${index + 1}`,
        value: b.username,
        inline: true
      }))
    ]
  })
}