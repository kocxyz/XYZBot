import {
  Brawler,
  Match,
  MatchGame,
  Participant,
  ParticipantMatchGameResult,
  ParticipantMatchResult,
  Team,
} from '@prisma/client';
import { APIEmbedField, EmbedBuilder } from 'discord.js';

function getParticipantField(
  index: number,
  participant: Participant & {
    team: Team | null;
    brawlers: Brawler[];
  },
): Array<APIEmbedField> {
  return participant.team === null
    ? getSoloFields(index, participant.brawlers[0])
    : getTeamFields(index, participant.team, participant.brawlers);
}

function getSoloFields(index: number, brawler: Brawler): Array<APIEmbedField> {
  return [
    {
      name: `Participant ${index + 1}`,
      value: brawler.username,
    },
  ];
}

function getTeamFields(
  index: number,
  team: Team,
  brawlers: Brawler[],
): Array<APIEmbedField> {
  return [
    {
      name: `Team ${index + 1}`,
      value: team.name,
    },
    ...brawlers.map((brawler, index) => ({
      name: `Member ${index + 1}`,
      value: brawler.username,
      inline: true,
    })),
  ];
}

function getMatchGameField(
  game: MatchGame & {
    opponent1Result: ParticipantMatchGameResult;
    opponent2Result: ParticipantMatchGameResult;
  },
  index: number,
): APIEmbedField {
  const score1 = game.opponent1Result.score ?? '-';
  const score2 = game.opponent2Result.score ?? '-';
  return {
    name: `Game ${index + 1}`,
    value: `\`${score1} | ${score2}\``,
    inline: true,
  };
}

export async function createTournamentMatchOrganizerEmbed(
  match: Match & {
    opponent1Result: ParticipantMatchResult & {
      participant: Participant & {
        team: Team | null;
        brawlers: Brawler[];
      };
    };
    opponent2Result: ParticipantMatchResult & {
      participant: Participant & {
        team: Team | null;
        brawlers: Brawler[];
      };
    };
    games: (MatchGame & {
      opponent1Result: ParticipantMatchGameResult;
      opponent2Result: ParticipantMatchGameResult;
    })[];
  },
) {
  return new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle(`Match`)
    .addFields([
      ...getParticipantField(0, match.opponent1Result.participant),
      {
        name: `\n`,
        value: ' ',
      },
      ...getParticipantField(1, match.opponent2Result.participant),
      {
        name: `\n`,
        value: '\n',
      },
      ...match.games.map(getMatchGameField),
    ])
    .setTimestamp();
}
