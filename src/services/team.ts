import { User } from "discord.js";
import { prisma } from "../database/client";
import { findOrCreateBrawler } from "./brawler";

export async function joinTeam(id: string, user: User) {
  const brawler = await findOrCreateBrawler(user);

  if (brawler.teamId) {
    return null;
  }

  return prisma.team.update({
    where: { id: id },
    data: {
      members: {
        connect: { id: brawler.id }
      }
    }
  });
}

export async function leaveTeam(id: string, user: User) {
  const brawler = await findOrCreateBrawler(user);

  if (!brawler.teamId) {
    return null;
  }

  return prisma.team.update({
    where: { id: id },
    data: {
      members: {
        disconnect: { id: brawler.id }
      }
    }
  });
}

export async function findTeamByUser(user: User) {
  const brawler = await findOrCreateBrawler(user);

  if (!brawler.teamId) {
    return null;
  }

  return prisma.team.findFirst({
    where: { id: brawler.teamId },
    include: {
      owner: true,
      members: true,
    }
  });
}

export async function findTeamByName(name: string) {
  return prisma.team.findFirst({
    where: { name: name },
    include: {
      owner: true,
      members: true,
    }
  });
}

export async function createTeam(user: User, name: string) {
  const brawler = await findOrCreateBrawler(user);

  // TODO: Error handling
  if (brawler.teamId) {
    throw Error('');
  }

  return prisma.team.create({
    data: {
      name: name,
      ownerId: brawler.id,
      members: {
        connect: [{ id: brawler.id }]
      }
    }
  });
}

export async function disbandTeam(
  id: string
) {
  return prisma.team.delete({
    where: { id: id }
  });
}