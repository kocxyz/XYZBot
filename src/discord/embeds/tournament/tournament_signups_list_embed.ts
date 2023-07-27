import { Tournament, Brawler, Team, Participant } from '@prisma/client';
import { APIEmbedField, EmbedBuilder } from 'discord.js';
import lodash from 'lodash';
import { environment } from '../../../environment';

export function createTournamentSignupListEmbed({
  title,
  teamSize,
  participants,
}: Tournament & {
  participants: (Participant & { team: Team | null; brawlers: Brawler[] })[];
}): EmbedBuilder[] {
  const participantSlices =
    participants.length <= environment.DISCORD_MAX_PARTICIPANTS_PER_EMBED
      ? [participants]
      : lodash.chunk(
          participants,
          environment.DISCORD_MAX_PARTICIPANTS_PER_EMBED,
        );

  return participantSlices.map((slice, index) => {
    return new EmbedBuilder()
      .setTitle(`Participants: ${title}`)
      .setDescription(
        participantSlices.length > 1
          ? `(${index + 1} / ${participantSlices.length})`
          : null,
      )
      .addFields(
        teamSize === 1
          ? slice.map(({ brawlers: [brawler] }) =>
              createSoloEntryField(brawler),
            )
          : createTeamEntryFields(slice),
      );
  });
}

function createSoloEntryField(brawler: Brawler) {
  return {
    name: 'Name',
    value: `${brawler.username}`,
  };
}

function createTeamEntryFields(
  participants: (Participant & { team: Team | null; brawlers: Brawler[] })[],
): APIEmbedField[] {
  return participants.flatMap((participant): APIEmbedField[] => {
    return [
      { name: '\n', value: '\n' },
      { name: 'Team', value: participant.team?.name ?? '-', inline: true },
      {
        name: 'Players',
        value: participant.brawlers.map((b) => b.username).join('\n'),
        inline: true,
      },
    ];
  });
}
