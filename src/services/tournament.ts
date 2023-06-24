import type { KOCServer } from 'knockoutcity-auth-client'
import { User } from 'discord.js';
import { findOrCreateBrawler } from './brawler';
import { Brawler, Team, Tournament, TournamentStatus } from '@prisma/client';
import { assertIsTeamOwner } from './team';
import * as TournamentDao from '../database/dao/tournament';
import { Failure, Result, SuccessResult } from '../result';

export function createTournament(
  name: string,
  description: string,
  options: {
    teamSize: number,
    server: KOCServer
  }
): Promise<Result<(Tournament & { participants: Brawler[], teams: Team[] })>> {
  return TournamentDao.createTournament({
    data: {
      title: name,
      description: description,
      serverId: `${options.server.id}`,
      teamSize: options.teamSize
    },
    include: {
      participants: true,
      teams: true
    }
  })
}

export function findTournamentById(
  id: string
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'record-not-found'>> {
  return TournamentDao.findFirstTournament({
    where: { id },
    include: {
      participants: true,
      teams: true
    }
  })
}

export function findTournamentsWithStatus(
  status: TournamentStatus
): Promise<Result<(Tournament & { participants: Brawler[] })[]>> {
  return TournamentDao.findManyTournament({
    where: {
      status
    },
    include: {
      participants: true,
    }
  })
}

export function findTournaments(): Promise<
  Result<(Tournament & { participants: Brawler[], teams: Team[] })[]>
> {
  return TournamentDao.findManyTournament({
    include: {
      participants: true,
      teams: true
    }
  });
}

export async function findTournamentsUserIsSignedUpFor(
  user: User
): Promise<Result<Tournament[]>> {
  const brawlerResult = await findOrCreateBrawler(user);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  return TournamentDao.findManyTournament({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED
      },
      participants: {
        some: { id: brawlerResult.data.id }
      }
    }
  })
}

export async function findTournamentsTeamIsSignedUpFor(
  team: Team
): Promise<Result<Tournament[]>> {
  return TournamentDao.findManyTournament({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED
      },
      teams: {
        some: { id: team.id }
      }
    }
  })
}

export function changeTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: {
      id: id
    },
    data: {
      status: status
    },
    include: {
      participants: true,
      teams: true
    }
  })
}

export async function setTournamentOrganizerMessageId(
  id: string,
  messageId: string
): Promise<Result<Tournament & { participants: Brawler[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: { id },
    data: {
      discordOrganizerMessageId: messageId
    },
    include: {
      participants: true,
    }
  })
}

export async function setTournamentSignupsMessageId(
  id: string,
  messageId: string
): Promise<Result<Tournament & { participants: Brawler[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: { id },
    data: {
      discordSingupMessageId: messageId
    },
    include: {
      participants: true,
    }
  })
}

export async function archiveTournament(
  id: string
): Promise<Result<Tournament, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: {
      id: id
    },
    data: {
      status: TournamentStatus.FINISHED,
      discordOrganizerMessageId: null,
      discordSingupMessageId: null
    }
  })
}

export async function leaveSoloTournament(
  tournamentId: string,
  user: User
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'signups-closed' | 'not-signed-up' | 'record-not-found'>> {
  const [brawlerResult, tournamentResult] = await Promise.all([
    findOrCreateBrawler(user),
    findTournamentById(tournamentId)
  ]);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const brawler = brawlerResult.data;
  const tournament = tournamentResult.data;

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure(
      'signups-closed',
      'Signups for the Tournament already closed. Not possible to withdraw.'
    )
  }

  if (tournament.participants.filter((b) => b.id === brawler.id).length === 0) {
    return Failure(
      'not-signed-up',
      'You are currently not signed up for the Tournament.'
    );
  }

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId
    },
    data: {
      participants: {
        disconnect: [{ id: brawler.id }]
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}

export async function signupForSoloTournament(
  tournamentId: string,
  user: User,
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'signups-closed' | 'already-signed-up' | 'record-not-found'>> {
  const [brawlerResult, tournamentResult] = await Promise.all([
    findOrCreateBrawler(user),
    findTournamentById(tournamentId)
  ])

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const brawler = brawlerResult.data;
  const tournament = tournamentResult.data;

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure(
      'signups-closed',
      'Signups for the Tournament are currently closed.'
    )
  }

  if (tournament.participants.filter((b) => b.id === brawler.id).length === 1) {
    return Failure(
      'already-signed-up',
      'You are already signed up for the Tournament.'
    );
  }

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId
    },
    data: {
      participants: {
        connect: [{ id: brawler.id }]
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  });
}

export async function leaveTeamTournament(
  tournamentId: string,
  user: User
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'signups-closed' | 'not-signed-up' | 'not-in-a-team' | 'not-team-owner' | 'record-not-found'>> {
  const [ownerResult, tournamentResult] = await Promise.all([
    assertIsTeamOwner(user),
    findTournamentById(tournamentId)
  ])

  if (ownerResult.type === 'error') {
    return ownerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const tournament = tournamentResult.data;
  const [team] = ownerResult.data;
  if (tournament.teams.filter((t) => t.id === team.id).length === 0) {
    return Failure(
      'not-signed-up',
      'Your Team is currently not signed up for the Tournament.'
    );
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure(
      'signups-closed',
      'Signups for the Tournament already closed. Not possible to withdraw.'
    )
  }

  const participantsToWithdraw = tournament.participants.filter(
    (b) => b.teamId === team.id
  );

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId
    },
    data: {
      teams: {
        disconnect: [{ id: team.id }]
      },
      participants: {
        disconnect: participantsToWithdraw.map(p => ({ id: p.id }))
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  });
}

export async function signupForTeamTournament(
  tournamentId: string,
  user: User,
  participants: User[],
): Promise<Result<Tournament & { participants: Brawler[], teams: Team[] }, 'signups-closed' | 'already-signed-up' | 'not-in-a-team' | 'not-team-owner' | 'not-enough-members' | 'record-not-found'>> {
  const [ownerResult, tournamentResult, ...participantBrawlersResults] = await Promise.all([
    assertIsTeamOwner(user),
    findTournamentById(tournamentId),
    ...participants.map(findOrCreateBrawler)
  ])

  if (ownerResult.type === 'error') {
    return ownerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const tournament = tournamentResult.data;
  const [team] = ownerResult.data;

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure(
      'signups-closed',
      'Signups for the Tournament already currently closed.'
    )
  }

  if (team.members.length < tournament.teamSize) {
    return Failure(
      'not-enough-members',
      'Your Team has not enough members. Please invite some to join the Tournament.'
    )
  }

  if (tournament.teams.filter((t) => t.id === team.id).length === 1) {
    return Failure(
      'already-signed-up',
      'Your Team is already signed up for the Tournament.'
    );
  }

  const participantBrawlers: SuccessResult<Brawler>[] = participantBrawlersResults.filter(
    (result) => result.type === 'success'
  ) as SuccessResult<Brawler>[];
  if (participantBrawlers.length !== participantBrawlersResults.length) {
    return Failure(
      'internal',
      'Could not fetch all Brawler Participants'
    );
  }

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId
    },
    data: {
      teams: {
        connect: [{ id: team.id }]
      },
      participants: {
        connect: participantBrawlers.map(b => ({ id: b.data.id }))
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}