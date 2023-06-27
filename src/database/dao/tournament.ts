import { Prisma } from '@prisma/client';
import { prisma } from '../client';
import { Failure, Success, InternalErrorFailure, Result } from '../../result';

export async function createTournament<T extends Prisma.TournamentCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TournamentCreateArgs>,
): Promise<Result<Prisma.TournamentGetPayload<T>>> {
  return prisma.tournament
    .create(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function findFirstTournament<
  T extends Prisma.TournamentFindFirstArgs,
>(
  args: Prisma.SelectSubset<T, Prisma.TournamentFindFirstArgs>,
): Promise<Result<Prisma.TournamentGetPayload<T>, 'record-not-found'>> {
  return prisma.tournament
    .findFirst(args)
    .then((tournament) => {
      if (!tournament) {
        return Failure(
          'record-not-found',
          'No Team found with provided parameters.',
        );
      }
      return Success(tournament);
    })
    .catch(InternalErrorFailure);
}

export async function findManyTournament<
  T extends Prisma.TournamentFindManyArgs,
>(
  args?: Prisma.SelectSubset<T, Prisma.TournamentFindManyArgs>,
): Promise<Result<Array<Prisma.TournamentGetPayload<T>>>> {
  return prisma.tournament
    .findMany(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function updateTournament<T extends Prisma.TournamentUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TournamentUpdateArgs>,
): Promise<Result<Prisma.TournamentGetPayload<T>, 'record-not-found'>> {
  return prisma.tournament
    .update(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Team found with provided parameters.',
        );
      }

      return InternalErrorFailure(error);
    });
}
