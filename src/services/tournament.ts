import type { KOCServer } from 'knockoutcity-auth-client'
import { prisma } from "../database/client";
import { User } from 'discord.js';
import { findOrCreateBrawler } from './brawler';
import { Team, TournamentStatus } from '@prisma/client';
import { findTeamByUser } from './team';

export async function findTournament(id: string) {
  return prisma.tournament.findFirst({
    where: {
      id: id
    },
    include: {
      participants: true,
      teams: true
    }
  })
}

export async function findTournamentsWithOpenSignup() {
  return prisma.tournament.findMany({
    where: {
      status: TournamentStatus.SIGNUP_OPEN
    },
    include: {
      participants: true,
    }
  })
}

export async function findTournaments() {
  return prisma.tournament.findMany({
    include: {
      participants: true,
      teams: true
    }
  })
}

export async function createTournament(
  name: string,
  description: string,
  options: {
    teamSize: number,
    server: KOCServer
  }
) {
  return prisma.tournament.create({
    data: {
      title: name,
      description: description,
      serverId: `${options.server.id}`,
      teamSize: options.teamSize
    },
    include: {
      participants: true,
      teams: true
    }
  })
}

export async function leaveSoloTournament(
  tournamentId: string,
  user: User
) {
  const [brawler, tournament] = await Promise.all([
    findOrCreateBrawler(user),
    findTournament(tournamentId)
  ])

  if (!tournament) {
    throw Error('No Tournament with provided Id');
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    throw Error('Signups for the Tournament already closed. Not possible to withdraw.')
  }

  if (tournament.participants.filter((b) => b.id === brawler.id).length === 0) {
    throw Error('Currently not signed up for the Tournament.')
  }

  return prisma.tournament.update({
    where: {
      id: tournamentId
    },
    data: {
      participants: {
        disconnect: [{ id: brawler.id }]
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}

export async function signupForSoloTournament(
  tournamentId: string,
  user: User,
) {
  const [brawler, tournament] = await Promise.all([
    findOrCreateBrawler(user),
    findTournament(tournamentId)
  ])

  if (!tournament) {
    throw Error('No Tournament with provided Id');
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    throw Error('Currently no signup possible for the Tournament.')
  }

  if (tournament.participants.filter((b) => b.id === brawler.id).length === 1) {
    throw Error('Already signed up for the Tournament.')
  }

  return prisma.tournament.update({
    where: {
      id: tournamentId
    },
    data: {
      participants: {
        connect: [{ id: brawler.id }]
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}

export async function leaveTeamTournament(
  tournamentId: string,
  user: User
) {
  const [brawler, tournament] = await Promise.all([
    findOrCreateBrawler(user),
    findTournament(tournamentId)
  ])

  if (!tournament) {
    throw Error('No Tournament with provided Id');
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    throw Error('Signups for the Tournament already closed. Not possible to withdraw.')
  }

  const team = await findTeamByUser(user);
  if (!team) {
    throw Error('Currently in no Team.')
  }
  if (team.ownerId !== brawler.id) {
    throw Error('Only the Team Owner can withdraw the Team from the Tournament.')
  }

  if (tournament.teams.filter((t) => t.id === team.id).length === 0) {
    throw Error('Currently Team is not signed up for the Tournament.')
  }

  const participantsToWithdraw = tournament.participants.filter(
    (b) => b.teamId === team.id
  )

  return prisma.tournament.update({
    where: {
      id: tournamentId
    },
    data: {
      teams: {
        disconnect: [{ id: team.id }]
      },
      participants: {
        disconnect: participantsToWithdraw.map(p => ({ id: p.id }))
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}

export async function signupForTeamTournament(
  tournamentId: string,
  user: User,
  participants: User[],
) {
  const [brawler, tournament, ...participantBrawlers] = await Promise.all([
    findOrCreateBrawler(user),
    findTournament(tournamentId),
    ...participants.map(findOrCreateBrawler)
  ])

  if (!tournament) {
    throw Error('No Tournament with provided Id');
  }

  if (tournament.status !== TournamentStatus.SIGNUP_OPEN) {
    throw Error('Currently no signup possible for the Tournament.')
  }

  const team = await findTeamByUser(user);
  if (!team) {
    throw Error('Currently in no Team.')
  }
  if (team.ownerId !== brawler.id) {
    throw Error('Only the Team Owner can sign the Team up from the Tournament.')
  }

  if (team.members.length < tournament.teamSize) {
    throw Error('Your Team has not enough members. Please invite some to join the Tournament.')
  }

  if (tournament.teams.filter((t) => t.id === team.id).length === 1) {
    throw Error('Team is already signed up for the Tournament.')
  }

  return prisma.tournament.update({
    where: {
      id: tournamentId
    },
    data: {
      teams: {
        connect: [{ id: team.id }]
      },
      participants: {
        connect: participantBrawlers.map(b => ({ id: b.id }))
      }
    },
    include: {
      participants: true,
      teams: true,
    }
  })
}

export async function changeTournamentStatus(
  id: string,
  status: TournamentStatus
) {
  return prisma.tournament.update({
    where: {
      id: id
    },
    data: {
      status: status
    },
    include: {
      participants: true,
      teams: true
    }
  })
}

export async function setTournamentOrganizerMessageId(
  id: string,
  messageId: string
) {
  return prisma.tournament.update({
    where: {
      id: id
    },
    data: {
      discordOrganizerMessageId: messageId
    },
    include: {
      participants: true,
    }
  })
}

export async function setTournamentSignupsMessageId(
  id: string,
  messageId: string
) {
  return prisma.tournament.update({
    where: {
      id: id
    },
    data: {
      discordSingupMessageId: messageId
    },
    include: {
      participants: true,
    }
  })
}

export async function findTournamentsUserIsSignedUpFor(user: User) {
  const brawler = await findOrCreateBrawler(user);

  return prisma.tournament.findMany({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED
      },
      participants: {
        some: { id: brawler.id }
      }
    }
  })
}

export async function findTournamentsTeamIsSignedUpFor(team: Team) {
  return prisma.tournament.findMany({
    where: {
      NOT: {
        status: TournamentStatus.FINISHED
      },
      teams: {
        some: { id: team.id }
      }
    }
  })
}

export async function archiveTournament(id: string) {
  return prisma.tournament.update({
    where: {
      id: id
    },
    data: {
      status: TournamentStatus.FINISHED,
      discordOrganizerMessageId: null,
      discordSingupMessageId: null
    }
  })
}