import { Prisma, Team } from "@prisma/client";
import { Failure, InternalErrorFailure, Result, Success } from "../../result";
import { prisma } from "../client";

export async function createTeam<T extends Prisma.TeamCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TeamCreateArgs>
): Promise<Result<Prisma.TeamGetPayload<T>>> {
  return prisma.team.create(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function findFirstTeam<T extends Prisma.TeamFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.TeamFindFirstArgs>
): Promise<Result<Prisma.TeamGetPayload<T>, 'record-not-found'>> {
  return prisma.team.findFirst(args)
    .then((team) => {
      if (!team) {
        return Failure(
          'record-not-found',
          'No Team found with provided parameters.'
        )
      }
      return Success(team)
    })
    .catch(InternalErrorFailure);
}

export async function updateTeam<T extends Prisma.TeamUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TeamUpdateArgs>
): Promise<Result<Prisma.TeamGetPayload<T>, 'record-not-found'>> {
  return prisma.team.update(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Team found with provided parameters.'
        );
      }

      return InternalErrorFailure(error);
    });
}

export async function deleteTeam<T extends Prisma.TeamDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.TeamDeleteArgs>
): Promise<Result<Prisma.TeamGetPayload<T>, 'record-not-found'>> {
  return prisma.team.delete(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Team found with provided parameters.'
        );
      }

      return InternalErrorFailure(error);
    });
}