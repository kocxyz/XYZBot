import type { Brawler } from "@prisma/client";
import { User } from "discord.js";
import { DEFAULT_AUTH_URL, getUser } from 'knockoutcity-auth-client'
import * as BrawlerDao from '../database/dao/brawler';
import { InternalErrorFailure, Result, Success } from "../result";

export async function findOrCreateBrawler(
  user: User
): Promise<Result<Brawler>> {
  const brawlerResult = await BrawlerDao.findBrawlerByDiscordId(user.id);
  if (brawlerResult.type === 'error') {
    return brawlerResult;
  }

  const brawler = brawlerResult.data;
  // Brawler doesn't exist
  if (!brawler) {
    return createBrawler(user)
  }

  return Success(brawler);
}

async function createBrawler(
  user: User
): Promise<Result<Brawler>> {
  const userDataResult = await getUser(DEFAULT_AUTH_URL, user.id)
    .then(Success)
    .catch(InternalErrorFailure)

  if (userDataResult.type === 'error') {
    return userDataResult;
  }

  return BrawlerDao.createBrawler(
    user.id,
    userDataResult.data.data.username
  );
}