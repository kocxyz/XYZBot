import type { Brawler } from '@prisma/client';
import { User } from 'discord.js';
import { DEFAULT_AUTH_URL, getUserById } from 'knockoutcity-auth-client';
import * as BrawlerDao from '../database/dao/brawler';
import { Failure, InternalErrorFailure, Result, Success } from '../result';

export async function findOrCreateBrawler(
  user: User,
): Promise<Result<Brawler>> {
  const brawlerResult = await BrawlerDao.findBrawlerByDiscordId(user.id);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const brawler = brawlerResult.data;
  // Brawler doesn't exist
  if (!brawler) {
    return createBrawler(user);
  }

  return Success(brawler);
}

async function createBrawler(user: User): Promise<Result<Brawler>> {
  const userDataResult = await getUserById(DEFAULT_AUTH_URL, user.id)
    .then(Success)
    .catch((error) => {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data &&
        error.response.data.type === 'invalid_account'
      ) {
        return Failure('internal', 'No User for Discord Account found.');
      }

      return InternalErrorFailure(error);
    });

  if (userDataResult.type === 'error') {
    return userDataResult;
  }

  return BrawlerDao.createBrawler(user.id, userDataResult.data.data.username);
}
