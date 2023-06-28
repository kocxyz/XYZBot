import {
  Brawler,
  Match,
  MatchGame,
  MatchStatus,
  Participant,
  ParticipantMatchGameResult,
  ParticipantMatchResult,
  Team,
} from '@prisma/client';
import * as MatchDao from '../database/dao/match';
import { Success, Failure, Result } from '../result';
import * as BracketManager from 'brackets-model';
import { manager } from '../tournament_manager/manager';

export async function updateMatchGameScore(
  matchGameId: number,
  opponent: 1 | 2,
  score: number,
  result?: BracketManager.Result,
): Promise<Result<void>> {
  return manager.update
    .matchGame({
      id: matchGameId,
      opponent1:
        opponent === 1
          ? {
              score,
              result,
            }
          : undefined,
      opponent2:
        opponent === 2
          ? {
              score,
              result,
            }
          : undefined,
    })
    .then(Success)
    .catch((e) => Failure('internal', e.message));
}

export async function getNextMatchGame(matchId: number): Promise<
  Result<
    | (MatchGame & {
        opponent1Result: ParticipantMatchGameResult | null;
        opponent2Result: ParticipantMatchGameResult | null;
      })
    | null,
    'record-not-found'
  >
> {
  const matchResult = await MatchDao.findFirstMatch({
    where: {
      id: matchId,
    },
    include: {
      games: {
        where: {
          status: {
            in: [MatchStatus.RUNNING, MatchStatus.READY],
          },
        },
        include: {
          opponent1Result: true,
          opponent2Result: true,
        },
      },
    },
  });

  if (matchResult.type === 'error') {
    return matchResult;
  }

  const games = matchResult.data.games;
  const nextGame = games.reduce<
    | (MatchGame & {
        opponent1Result: ParticipantMatchGameResult | null;
        opponent2Result: ParticipantMatchGameResult | null;
      })
    | null
  >((acc, cur) => {
    if (cur.number < (acc?.number ?? Number.POSITIVE_INFINITY)) {
      return cur;
    }
    return acc;
  }, null);

  return Success(nextGame);
}

export async function getNextMatch(
  stageId: number,
): Promise<Result<BracketManager.Match | null>> {
  // Grab next matches
  const tournamentNextMatchesResult = await manager.get
    .currentMatches(stageId)
    .then(Success)
    .catch((e) => Failure('internal', e.message));
  if (tournamentNextMatchesResult.type === 'error') {
    return tournamentNextMatchesResult;
  }

  // Get next match
  const nextMatch =
    tournamentNextMatchesResult.data.reduce<BracketManager.Match | null>(
      (acc, cur) => {
        // Currently found match is also ready so check if
        // Current match is ready and smaller in number
        if (
          cur.status === BracketManager.Status.Ready &&
          cur.number < (acc?.number ?? Number.POSITIVE_INFINITY)
        ) {
          return cur;
        }
        return acc;
      },
      null,
    );

  return Success(nextMatch);
}

export async function getMatchesForEmbedsWithDiscordId(): Promise<
  Result<
    (Match & {
      opponent1Result:
        | ParticipantMatchResult & {
            participant:
              | Participant & {
                  team: Team | null;
                  brawlers: Brawler[];
                };
          };
      opponent2Result:
        | ParticipantMatchResult & {
            participant:
              | Participant & {
                  team: Team | null;
                  brawlers: Brawler[];
                };
          };
      games: (MatchGame & {
        opponent1Result: ParticipantMatchGameResult;
        opponent2Result: ParticipantMatchGameResult;
      })[];
    })[]
  >
> {
  const matchResult = await MatchDao.findManyMatches({
    where: {
      discordMessageId: {
        not: null,
      },
    },
    include: {
      opponent1Result: {
        include: {
          participant: {
            include: {
              team: true,
              brawlers: true,
            },
          },
        },
      },
      opponent2Result: {
        include: {
          participant: {
            include: {
              team: true,
              brawlers: true,
            },
          },
        },
      },
      games: {
        include: {
          opponent1Result: true,
          opponent2Result: true,
        },
      },
    },
  });

  if (matchResult.type === 'error') {
    return matchResult;
  }
  const match = matchResult.data;
  return match.every(validateMatch)
    ? Success(match)
    : Failure('internal', 'Match does not meet requirements for embed');
}

export async function getMatchForEmbed(id: number): Promise<
  Result<
    Match & {
      opponent1Result:
        | ParticipantMatchResult & {
            participant:
              | Participant & {
                  team: Team | null;
                  brawlers: Brawler[];
                };
          };
      opponent2Result:
        | ParticipantMatchResult & {
            participant:
              | Participant & {
                  team: Team | null;
                  brawlers: Brawler[];
                };
          };
      games: (MatchGame & {
        opponent1Result: ParticipantMatchGameResult;
        opponent2Result: ParticipantMatchGameResult;
      })[];
    },
    'record-not-found'
  >
> {
  const matchResult = await MatchDao.findFirstMatch({
    where: { id },
    include: {
      opponent1Result: {
        include: {
          participant: {
            include: {
              team: true,
              brawlers: true,
            },
          },
        },
      },
      opponent2Result: {
        include: {
          participant: {
            include: {
              team: true,
              brawlers: true,
            },
          },
        },
      },
      games: {
        include: {
          opponent1Result: true,
          opponent2Result: true,
        },
      },
    },
  });

  if (matchResult.type === 'error') {
    return matchResult;
  }
  const match = matchResult.data;
  return validateMatch(match)
    ? Success(match)
    : Failure('internal', 'Match does not meet requirements for embed');
}

function validateMatch(
  match: Match & {
    opponent1Result:
      | (ParticipantMatchResult & {
          participant:
            | (Participant & {
                team: Team | null;
                brawlers: Brawler[];
              })
            | null;
        })
      | null;
    opponent2Result:
      | (ParticipantMatchResult & {
          participant:
            | (Participant & {
                team: Team | null;
                brawlers: Brawler[];
              })
            | null;
        })
      | null;
    games: (MatchGame & {
      opponent1Result: ParticipantMatchGameResult | null;
      opponent2Result: ParticipantMatchGameResult | null;
    })[];
  },
): match is Match & {
  opponent1Result:
    | ParticipantMatchResult & {
        participant:
          | Participant & {
              team: Team | null;
              brawlers: Brawler[];
            };
      };
  opponent2Result:
    | ParticipantMatchResult & {
        participant:
          | Participant & {
              team: Team | null;
              brawlers: Brawler[];
            };
      };
  games: (MatchGame & {
    opponent1Result: ParticipantMatchGameResult;
    opponent2Result: ParticipantMatchGameResult;
  })[];
} {
  if (!validateOpponentResult(match.opponent1Result)) {
    return false;
  }

  if (!validateOpponentResult(match.opponent2Result)) {
    return false;
  }

  if (!match.games.every(validateMatchGame)) {
    return false;
  }

  return true;
}

function validateOpponentResult(
  result:
    | (ParticipantMatchResult & {
        participant:
          | (Participant & {
              team: Team | null;
              brawlers: Brawler[];
            })
          | null;
      })
    | null,
): result is ParticipantMatchResult & {
  participant:
    | Participant & {
        team: Team | null;
        brawlers: Brawler[];
      };
} {
  if (result === null) {
    return false;
  }

  if (result.participant === null) {
    return false;
  }

  return true;
}

function validateMatchGame(
  game: MatchGame & {
    opponent1Result: ParticipantMatchGameResult | null;
    opponent2Result: ParticipantMatchGameResult | null;
  },
): game is MatchGame & {
  opponent1Result: ParticipantMatchGameResult;
  opponent2Result: ParticipantMatchGameResult;
} {
  return game.opponent1Result !== null && game.opponent2Result !== null;
}
