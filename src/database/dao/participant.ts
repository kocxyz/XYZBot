import { Prisma } from '@prisma/client';
import { Failure, InternalErrorFailure, Result, Success } from '../../result';
import { prisma } from '../client';

export async function createParticipant<T extends Prisma.ParticipantCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.ParticipantCreateArgs>,
): Promise<Result<Prisma.ParticipantGetPayload<T>>> {
  return prisma.participant
    .create(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function findFirstParticipant<
  T extends Prisma.ParticipantFindFirstArgs,
>(
  args: Prisma.SelectSubset<T, Prisma.ParticipantFindFirstArgs>,
): Promise<Result<Prisma.ParticipantGetPayload<T>, 'record-not-found'>> {
  return prisma.participant
    .findFirst(args)
    .then((participant) => {
      if (!participant) {
        return Failure(
          'record-not-found',
          'No Participant found with provided parameters.',
        );
      }
      return Success(participant);
    })
    .catch(InternalErrorFailure);
}

export async function updateParticipant<T extends Prisma.ParticipantUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.ParticipantUpdateArgs>,
): Promise<Result<Prisma.ParticipantGetPayload<T>, 'record-not-found'>> {
  return prisma.participant
    .update(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Participant found with provided parameters.',
        );
      }

      return InternalErrorFailure(error);
    });
}

export async function deleteParticipant<T extends Prisma.ParticipantDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.ParticipantDeleteArgs>,
): Promise<Result<Prisma.ParticipantGetPayload<T>, 'record-not-found'>> {
  return prisma.participant
    .delete(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Participant found with provided parameters.',
        );
      }

      return InternalErrorFailure(error);
    });
}
