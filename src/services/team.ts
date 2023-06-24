import { User } from "discord.js";
import { findOrCreateBrawler } from "./brawler";
import { Failure, Result, Success } from "../result";
import { Brawler, Team } from "@prisma/client";
import * as TeamDao from "../database/dao/team";
import { findTournamentsTeamIsSignedUpFor, findTournamentsUserIsSignedUpFor } from "./tournament";

export async function createTeam(
  user: User,
  name: string
): Promise<Result<Team, 'team-name-already-exists' | 'already-in-a-team'>> {
  const brawlerResult = await assertNotInTeam(user);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const teamResult = await findTeamByName(name);
  if (teamResult.type === 'success') {
    // We found a Team with the same name.
    return Failure(
      'team-name-already-exists',
      'A Team with the specified name already exists.'
    );
  }

  return TeamDao.createTeam({
    data: {
      name: name,
      ownerId: brawlerResult.data.id,
      members: {
        connect: [{ id: brawlerResult.data.id }]
      }
    }
  })
}

export async function findTeamByUser(
  user: User
): Promise<Result<Team & { owner: Brawler | null, members: Brawler[] }, 'not-in-a-team' | 'record-not-found'>> {
  const brawlerResult = await assertInTeam(user);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  return TeamDao.findFirstTeam({
    where: { id: brawlerResult.data.teamId },
    include: {
      owner: true,
      members: true,
    }
  });
}

export function findTeamByName(
  name: string
): Promise<Result<Team & { owner: Brawler | null, members: Brawler[] }, 'record-not-found'>> {
  return TeamDao.findFirstTeam({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    },
    include: {
      owner: true,
      members: true,
    }
  });
}

export async function joinTeam(
  id: string,
  user: User
): Promise<Result<Team, 'already-in-a-team' | 'record-not-found'>> {
  const brawlerResult = await assertNotInTeam(user);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  return TeamDao.updateTeam({
    where: { id },
    data: {
      members: {
        connect: { id: brawlerResult.data.id }
      }
    }
  })
}

export async function leaveTeam(
  user: User
): Promise<Result<Team, 'is-team-owner' | 'not-in-a-team' | 'signed-up-for-active-tournaments' | 'record-not-found'>> {
  const teamResult = await findTeamByUser(user);
  if (teamResult.type === 'error') {
    return teamResult;
  }

  const brawlerResult = await assertInTeam(user);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const team = teamResult.data;
  const brawler = brawlerResult.data;
  if (team.ownerId === brawler.id) {
    return Failure(
      'is-team-owner',
      'You are the Team Owner and can not leave the Team. Use the disband command instead.'
    );
  }

  const signupTournamentsResult = await findTournamentsUserIsSignedUpFor(user);
  if (signupTournamentsResult.type === 'error') {
    return signupTournamentsResult;
  }

  if (signupTournamentsResult.data.length > 0) {
    return Failure(
      'signed-up-for-active-tournaments',
      'You are is still signed up for active Tournaments.'
    );
  }

  return TeamDao.updateTeam({
    where: { id: brawlerResult.data.teamId },
    data: {
      members: {
        disconnect: { id: brawlerResult.data.id }
      }
    }
  });
}

export async function disbandTeam(
  user: User
): Promise<Result<Team, 'not-team-owner' | 'not-in-a-team' | 'signed-up-for-active-tournaments' | 'record-not-found'>> {
  const result = await assertIsTeamOwner(user);
  if (result.type === 'error') {
    return result;
  }

  const [team] = result.data;
  const signupTournamentsResult = await findTournamentsTeamIsSignedUpFor(team);
  if (signupTournamentsResult.type === 'error') {
    return signupTournamentsResult;
  }

  if (signupTournamentsResult.data.length > 0) {
    return Failure(
      'signed-up-for-active-tournaments',
      'Your Team is still signed up for active Tournaments.'
    );
  }

  return TeamDao.deleteTeam({
    where: { id: team.id }
  });
}

export async function assertIsTeamOwner(
  user: User
): Promise<Result<[Team & { owner: Brawler | null, members: Brawler[] }, Brawler], 'not-in-a-team' | 'not-team-owner' | 'record-not-found'>> {
  const teamResult = await findTeamByUser(user);
  if (teamResult.type === 'error') {
    return teamResult;
  }

  const brawlerResult = await findOrCreateBrawler(user);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const team = teamResult.data;
  const brawler = brawlerResult.data;
  if (team.ownerId !== brawler.id) {
    return Failure(
      'not-team-owner',
      'Only the Team Owner can perform this action.'
    );
  }

  return Success([team, brawler]);
}

async function assertNotInTeam(
  user: User,
): Promise<Result<Brawler & { teamId: null }, 'already-in-a-team'>> {
  const brawlerResult = await findOrCreateBrawler(user);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const brawler = brawlerResult.data;
  if (!assertHasNoTeamId(brawler)) {
    return Failure(
      'already-in-a-team',
      'You are already in a Team!'
    );
  }

  return Success(brawler)
}

async function assertInTeam(
  user: User,
): Promise<Result<Brawler & { teamId: string }, 'not-in-a-team'>> {
  const brawlerResult = await findOrCreateBrawler(user);

  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const brawler = brawlerResult.data;
  if (!assertHasTeamId(brawler)) {
    return Failure(
      'not-in-a-team',
      'You are currently not in a Team!'
    );
  }

  return Success(brawler)
}

function assertHasTeamId(
  brawler: Brawler
): brawler is Brawler & { teamId: string } {
  return brawler.teamId !== null
}

function assertHasNoTeamId(
  brawler: Brawler
): brawler is Brawler & { teamId: null } {
  return brawler.teamId === null
}