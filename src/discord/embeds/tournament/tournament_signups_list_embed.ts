import { Tournament, Brawler, Team, Participant } from '@prisma/client';
import { APIEmbedField, EmbedBuilder } from 'discord.js';

export function createTournamentSignupListEmbed(
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[];
  },
) {
  return new EmbedBuilder()
    .setTitle(`Participants: ${tournament.title}`)
    .setDescription(tournament.description)
    .addFields(
      tournament.teamSize === 1
        ? tournament.participants.map((p) => createSoloEntryField(p.brawlers[0]))
        : createTeamEntryFields(tournament),
    );
}

function createSoloEntryField(brawler: Brawler) {
  return {
    name: 'Name',
    value: `${brawler.username}`,
  };
}

function createTeamEntryFields(
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[];
  },
): APIEmbedField[] {
  return tournament.participants.flatMap((participant): APIEmbedField[] => {
    return [
      { name: '\n', value: '\n' },
      { name: 'Team', value: participant.team?.name ?? '-', inline: true },
      ...participant.brawlers.map((b, index) => ({
        name: `Player ${index + 1}`,
        value: b.username,
        inline: true,
      })),
    ];
  });
}
