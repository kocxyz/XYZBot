import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { createTournamentSignupEmbed } from "../embeds/tournament/tournament_signup_embed";
import { Brawler, Team, Tournament } from "@prisma/client";
import { MessageProvider, reply } from "../message_provider";
import { signupForSoloTournament, leaveSoloTournament, leaveTeamTournament, findTournament } from "../../services/tournament";
import { findTeamByUser } from "../../services/team";
import { findOrCreateBrawler } from "../../services/brawler";
import { TournamentSignupTeamMessageProvider } from "./tournament_signup_team_message_provider";
import { PermanentCollector } from "../permanent_collector";

const customIds = {
  signupButton: 'signup',
  leaveButton: 'leave'
} as const;

async function handleSoloInteraction(
  interaction: ButtonInteraction,
  { tournament }: TournamentSignupMessageCollectorParameters
): Promise<void> {
  if (interaction.customId === customIds.signupButton) {
    try {
      await signupForSoloTournament(
        tournament.id,
        interaction.user
      )
    }
    catch (e: any) {
      await reply(
        interaction,
        {
          content: `${e.message}`,
          ephemeral: true
        }
      )
      return;
    }

    await reply(
      interaction,
      {
        content: `Successully signed up for: ${tournament.title}`,
        ephemeral: true
      }
    )
  }
  else if (interaction.customId === customIds.leaveButton) {
    try {
      await leaveSoloTournament(
        tournament.id,
        interaction.user
      );
    }
    catch (e: any) {
      await reply(
        interaction,
        {
          content: `${e.message}`,
          ephemeral: true
        }
      )
      return;
    }

    await reply(
      interaction,
      {
        content: `Successully removed Tournament Entry for: ${tournament.title}`,
        ephemeral: true
      }
    )
  }
}

async function handleTeamInteraction(
  tournamentMessage: Message | InteractionResponse,
  interaction: ButtonInteraction,
  { tournament }: TournamentSignupMessageCollectorParameters
): Promise<void> {
  if (interaction.customId === customIds.signupButton) {
    const team = await findTeamByUser(interaction.user);
    if (!team) {
      await reply(
        interaction,
        {
          content: 'You are currently not in a Team',
          ephemeral: true
        }
      )
      return;
    }

    const brawler = await findOrCreateBrawler(interaction.user);
    if (team.ownerId !== brawler.id) {
      await reply(
        interaction,
        {
          content: 'Only the Team Owner can sign the Team up from the Tournament.',
          ephemeral: true
        }
      )
      return;
    }

    if (team.members.length < tournament.teamSize) {
      await reply(
        interaction,
        {
          content: 'Your Team has not enough members. Please invite some to join the Tournament.',
          ephemeral: true
        }
      )
      return;
    }

    const message = await reply(
      interaction,
      {
        ...await TournamentSignupTeamMessageProvider.createMessage({
          team: team,
          tournament: tournament
        }),
        ephemeral: true
      }
    )

    if (!message) {
      return;
    }

    await TournamentSignupTeamMessageProvider.collector(
      message,
      {
        team: team,
        tournament: tournament,
        tournamentMessage: tournamentMessage
      }
    )
    return;
  }

  if (interaction.customId === customIds.leaveButton) {
    try {
      await leaveTeamTournament(
        tournament.id,
        interaction.user
      );
    }
    catch (e: any) {
      await reply(
        interaction,
        {
          content: `${e.message}`,
          ephemeral: true
        }
      )
      return;
    }

    await reply(
      interaction,
      {
        content: `Successully removed Team Tournament Entry for: ${tournament.title}`,
        ephemeral: true
      }
    )
  }
}

async function createMessage(
  { tournament }: TournamentSignupMessageCreateParameters
) {
  const embed = await createTournamentSignupEmbed(tournament);

  const signupInput = new ButtonBuilder()
    .setCustomId(customIds.signupButton)
    .setLabel(
      tournament.teamSize === 1
        ? 'I want to participate!'
        : 'We want to participate!'
    )
    .setStyle(ButtonStyle.Success)

  const leaveInput = new ButtonBuilder()
    .setCustomId(customIds.leaveButton)
    .setLabel(
      tournament.teamSize === 1
        ? 'I changed my mind.'
        : 'We changed our minds.'
    )
    .setStyle(ButtonStyle.Danger)

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(signupInput, leaveInput),
    ]
  }
}

async function collector(
  message: Message | InteractionResponse,
  params: TournamentSignupMessageCollectorParameters
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    if (params.tournament.teamSize === 1) {
      await handleSoloInteraction(
        interaction,
        params
      )
    }
    else {
      await handleTeamInteraction(
        message,
        interaction,
        params
      )
    }

    const updatedTournament = await findTournament(params.tournament.id);
    if (updatedTournament) {
      await message.edit(await createMessage({ tournament: updatedTournament }))
    }
  });
}

type TournamentSignupMessageCreateParameters = {
  tournament: Tournament & {
    participants: Brawler[],
    teams: Team[]
  }
}

type TournamentSignupMessageCollectorParameters = {
  tournament: Tournament & {
    participants: Brawler[],
    teams: Team[]
  }
}

export const TournamentSignupMessageProvider = {
  createMessage,
  collector
} satisfies MessageProvider<
  TournamentSignupMessageCreateParameters,
  TournamentSignupMessageCollectorParameters
>