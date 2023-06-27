import { Brawler } from '@prisma/client';
import { InternalErrorFailure, Result, Success } from '../../result';
import { prisma } from '../client';
import { createLogger } from '../../logging';

const logger = createLogger('Brawler DAO');

export async function findBrawlerByDiscordId(
  id: string,
): Promise<Result<Brawler | null>> {
  return prisma.brawler
    .findFirst({
      where: { discordId: id },
    })
    .then(Success)
    .catch(InternalErrorFailure);
}

export async function createBrawler(
  discordId: string,
  username: string,
): Promise<Result<Brawler>> {
  logger.verbose(`Creating Brawler: ${discordId} | ${username}`);

  return prisma.brawler
    .create({
      data: {
        discordId,
        username,
      },
    })
    .then(Success)
    .catch(InternalErrorFailure);
}
