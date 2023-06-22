import { User } from "discord.js";
import { prisma } from "../database/client";
import { DEFAULT_AUTH_URL, getUser } from 'knockoutcity-auth-client'
import { createLogger } from "../logging";

const logger = createLogger('Brawler Service')

export async function findOrCreateBrawler(
  user: User
) {
  const brawler = await findBrawler(user);
  // Brawler doesn't exist
  if (!brawler) {
    return createBrawler(user)
  }
  return brawler;
}

export function findBrawler(user: User) {
  return prisma.brawler.findFirst({
    where: {
      discordId: user.id
    },
  })
}

async function createBrawler(user: User) {
  const userData = await getUser(DEFAULT_AUTH_URL, user.id)
    .catch(() => {
      throw Error('Could not get User data. Please make sure you have created an Account in the Launcher!');
    })

  logger.verbose(`Create Brawler: ${user.id} | ${userData.data.username}`)

  return prisma.brawler.create({
    data: {
      discordId: user.id,
      username: userData.data.username
    }
  })
}