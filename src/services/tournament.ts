import type { KOCServer } from 'knockoutcity-auth-client';
import { User } from 'discord.js';
import { findOrCreateBrawler } from './brawler';
import { Brawler, Participant, Team, Tournament, TournamentStatus } from '@prisma/client';
import { assertIsTeamOwner } from './team';
import * as TournamentDao from '../database/dao/tournament';
import * as ParticipantDao from '../database/dao/participant';
import { Failure, Result, SuccessResult } from '../result';

export function createTournament(
  name: string,
  description: string,
  options: {
    teamSize: number;
    server: KOCServer;
  },
): Promise<Result<Tournament & { participants: (Participant & { team: Team | null; brawlers: Brawler[] })[] }>> {
  return TournamentDao.createTournament({
    data: {
      title: name,
      description: description,
      serverId: `${options.server.id}`,
      teamSize: options.teamSize,
    },
    include: {
      participants: {
        include: {
          brawlers: true,
          team: true
        },
      },
    },
  });
}

export function findTournamentById(
  id: string,
): Promise<Result<Tournament & { participants: (Participant & { team: Team | null; brawlers: Brawler[] })[] }, 'record-not-found'>> {
  return TournamentDao.findFirstTournament({
    where: { id },
    include: {
      participants: {
        include: {
          brawlers: true,
          team: true
        },
      },
    },
  });
}

export function findTournamentsWithStatus(
  status: TournamentStatus,
): Promise<Result<(Tournament & { participants: Participant[] })[]>> {
  return TournamentDao.findManyTournament({
    where: {
      status,
    },
    include: {
      participants: true,
    },
  });
}

export function findTournaments(): Promise<Result<(Tournament & { participants: (Participant & { team: Team | null; brawlers: Brawler[] })[] })[]>> {
  return TournamentDao.findManyTournament({
    include: {
      participants: {
        include: {
          brawlers: true,
          team: true
        },
      },
    },
  });
}

export async function findTournamentsUserIsSignedUpFor(user: User): Promise<Result<Tournament[]>> {
  const brawlerResult = await findOrCreateBrawler(user);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  return TournamentDao.findManyTournament({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED,
      },
      participants: {
        some: {
          brawlers: {
            some: {
              id: brawlerResult.data.id,
            },
          },
        },
      },
    },
  });
}

export async function findTournamentsTeamIsSignedUpFor(team: Team): Promise<Result<Tournament[]>> {
  return TournamentDao.findManyTournament({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED,
      },
      participants: {
        some: {
          teamId: team.id,
        },
      },
    },
  });
}

export function changeTournamentStatus(
  id: string,
  status: TournamentStatus,
): Promise<Result<Tournament & { participants: Participant[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: {
      id: id,
    },
    data: {
      status: status,
    },
    include: {
      participants: true,
    },
  });
}

export async function setTournamentOrganizerMessageId(
  id: string,
  messageId: string,
): Promise<Result<Tournament & { participants: Participant[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: { id },
    data: {
      discordOrganizerMessageId: messageId,
    },
    include: {
      participants: true,
    },
  });
}

export async function setTournamentSignupsMessageId(
  id: string,
  messageId: string,
): Promise<Result<Tournament & { participants: Participant[] }, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: { id },
    data: {
      discordSingupMessageId: messageId,
    },
    include: {
      participants: true,
    },
  });
}

export async function archiveTournament(id: string): Promise<Result<Tournament, 'record-not-found'>> {
  return TournamentDao.updateTournament({
    where: {
      id: id,
    },
    data: {
      status: TournamentStatus.FINISHED,
      discordOrganizerMessageId: null,
      discordSingupMessageId: null,
    },
  });
}

export async function leaveSoloTournament(
  tournamentId: string,
  user: User,
): Promise<Result<Participant, 'signups-closed' | 'not-signed-up' | 'record-not-found'>> {
  const [brawlerResult, tournamentResult] = await Promise.all([
    findOrCreateBrawler(user),
    findTournamentById(tournamentId),
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
    return Failure('signups-closed', 'Signups for the Tournament already closed. Not possible to withdraw.');
  }

  const participantsWithBrawler = tournament.participants.filter((p) => p.brawlers.some((b) => b.id === brawler.id));
  if (participantsWithBrawler.length === 0) {
    return Failure('not-signed-up', 'You are currently not signed up for the Tournament.');
  }

  return ParticipantDao.deleteParticipant({
    where: {
      id: participantsWithBrawler[0].id,
    },
  });
}

export async function signupForSoloTournament(
  tournamentId: string,
  user: User,
): Promise<
  Result<Tournament & { participants: Participant[] }, 'signups-closed' | 'already-signed-up' | 'record-not-found'>
> {
  const [brawlerResult, tournamentResult] = await Promise.all([
    findOrCreateBrawler(user),
    findTournamentById(tournamentId),
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
    return Failure('signups-closed', 'Signups for the Tournament are currently closed.');
  }

  const participantsWithBrawler = tournament.participants.filter((p) => p.brawlers.some((b) => b.id === brawler.id));
  if (participantsWithBrawler.length === 1) {
    return Failure('already-signed-up', 'You are already signed up for the Tournament.');
  }

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId,
    },
    data: {
      participants: {
        create: {
          name: brawler.username,
          brawlers: {
            connect: {
              id: brawler.id,
            },
          },
        },
      },
    },
    include: {
      participants: true,
    },
  });
}

export async function leaveTeamTournament(
  tournamentId: string,
  user: User,
): Promise<
  Result<
    Participant,
    'signups-closed' | 'not-signed-up' | 'not-in-a-team' | 'not-team-owner' | 'record-not-found'
  >
> {
  const [ownerResult, tournamentResult] = await Promise.all([
    assertIsTeamOwner(user),
    findTournamentById(tournamentId),
  ]);

  if (ownerResult.type === 'error') {
    return ownerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const tournament = tournamentResult.data;
  const [team] = ownerResult.data;

  const participantsWithTeam = tournament.participants.filter((p) => p.teamId === team.id);
  if (participantsWithTeam.length === 0) {
    return Failure('not-signed-up', 'Your Team is currently not signed up for the Tournament.');
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure('signups-closed', 'Signups for the Tournament already closed. Not possible to withdraw.');
  }

  return ParticipantDao.deleteParticipant({
    where: {
      id: participantsWithTeam[0].id,
    },
  });
}

export async function signupForTeamTournament(
  tournamentId: string,
  user: User,
  participants: User[],
): Promise<
  Result<
    Tournament & { participants: Participant[] },
    | 'signups-closed'
    | 'already-signed-up'
    | 'not-in-a-team'
    | 'not-team-owner'
    | 'not-enough-members'
    | 'record-not-found'
  >
> {
  const [ownerResult, tournamentResult, ...participantBrawlersResults] = await Promise.all([
    assertIsTeamOwner(user),
    findTournamentById(tournamentId),
    ...participants.map(findOrCreateBrawler),
  ]);

  if (ownerResult.type === 'error') {
    return ownerResult;
  }

  if (tournamentResult.type === 'error') {
    return tournamentResult;
  }

  const tournament = tournamentResult.data;
  const [team] = ownerResult.data;

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    return Failure('signups-closed', 'Signups for the Tournament already currently closed.');
  }

  if (team.members.length < tournament.teamSize) {
    return Failure(
      'not-enough-members',
      'Your Team has not enough members. Please invite some to join the Tournament.',
    );
  }

  const participantsWithTeam = tournament.participants.filter((p) => p.teamId === team.id);
  if (participantsWithTeam.length === 1) {
    return Failure('already-signed-up', 'Your Team is already signed up for the Tournament.');
  }

  const participantBrawlers: SuccessResult<Brawler>[] = participantBrawlersResults.filter(
    (result) => result.type === 'success',
  ) as SuccessResult<Brawler>[];
  if (participantBrawlers.length !== participantBrawlersResults.length) {
    return Failure('internal', 'Could not fetch all Brawler Participants');
  }

  return TournamentDao.updateTournament({
    where: {
      id: tournamentId,
    },
    data: {
      participants: {
        create: {
          name: team.name,
          team: {
            connect: {
              id: team.id
            }
          },
          brawlers: {
            connect: participantBrawlers.map((b) => ({
              id: b.data.id
            }))
          }
        }
      },
    },
    include: {
      participants: true,
    },
  });
}
