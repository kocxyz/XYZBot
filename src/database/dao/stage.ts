import { Prisma } from "@prisma/client";
import { Failure, InternalErrorFailure, Result, Success } from "../../result";
import { prisma } from "../client";

export async function createStage<T extends Prisma.StageCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.StageCreateArgs>
): Promise<Result<Prisma.StageGetPayload<T>>> {
  return prisma.stage.create(args)
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function findFirstStage<T extends Prisma.StageFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.StageFindFirstArgs>
): Promise<Result<Prisma.StageGetPayload<T>, 'record-not-found'>> {
  return prisma.stage.findFirst(args)
    .then((stage) => {
      if (!stage) {
        return Failure(
          'record-not-found',
          'No Stage found with provided parameters.'
        )
      }
      return Success(stage)
    })
    .catch(InternalErrorFailure);
}

export async function updateStage<T extends Prisma.StageUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.StageUpdateArgs>
): Promise<Result<Prisma.StageGetPayload<T>, 'record-not-found'>> {
  return prisma.stage.update(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Stage found with provided parameters.'
        );
      }

      return InternalErrorFailure(error);
    });
}

export async function deleteStage<T extends Prisma.StageDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.StageDeleteArgs>
): Promise<Result<Prisma.StageGetPayload<T>, 'record-not-found'>> {
  return prisma.stage.delete(args)
    .then(Success)
    .catch((error: Prisma.PrismaClientKnownRequestError) => {
      if (error.code === 'P2025') {
        return Failure<'record-not-found'>(
          'record-not-found',
          'No Stage found with provided parameters.'
        );
      }

      return InternalErrorFailure(error);
    });
}