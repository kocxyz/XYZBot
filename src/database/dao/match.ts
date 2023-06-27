import { Prisma } from '@prisma/client';
import { Failure, InternalErrorFailure, Result, Success } from '../../result';
import { prisma } from '../client';

export async function createMatch<T extends Prisma.MatchCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.MatchCreateArgs>,
): Promise<Result<Prisma.MatchGetPayload<T>>> {
  return prisma.match.create(args).then(Success).catch(InternalErrorFailure);
}

export async function findManyMatches<T extends Prisma.MatchFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.MatchFindManyArgs>,
): Promise<Result<Prisma.MatchGetPayload<T>[]>> {
  return prisma.match
    .findMany(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function findFirstMatch<T extends Prisma.MatchFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.MatchFindFirstArgs>,
): Promise<Result<Prisma.MatchGetPayload<T>, 'record-not-found'>> {
  return prisma.match
    .findFirst(args)
    .then((match) => {
      if (!match) {
        return Failure(
          'record-not-found',
          'No Match found with provided parameters.',
        );
      }
      return Success(match);
    })
    .catch(InternalErrorFailure);
}

export async function updateMatch<T extends Prisma.MatchUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.MatchUpdateArgs>,
): Promise<Result<Prisma.MatchGetPayload<T>, 'record-not-found'>> {
  return prisma.match
    .update(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Match found with provided parameters.',
        );
      }

      return InternalErrorFailure(error);
    });
}

export async function deleteMatch<T extends Prisma.MatchDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.MatchDeleteArgs>,
): Promise<Result<Prisma.MatchGetPayload<T>, 'record-not-found'>> {
  return prisma.match
    .delete(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Match found with provided parameters.',
        );
      }

      return InternalErrorFailure(error);
    });
}
