import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { createTournamentSignupEmbed } from "../embeds/tournament/tournament_signup_embed";
import { Brawler, Team, Tournament } from "@prisma/client";
import { MessageProvider } from "../message_provider";
import { signupForSoloTournament, leaveSoloTournament, leaveTeamTournament } from "../../services/tournament";
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
): Promise<Tournament & { participants: Brawler[]; teams: Team[]; }> {
  let updatedTournament = undefined;

  if (interaction.customId === customIds.signupButton) {
    try {
      updatedTournament = await signupForSoloTournament(
        tournament.id,
        interaction.user
      )
    }
    catch (e: any) {
      await interaction.reply({
        content: `${e.message}`,
        ephemeral: true
      })
      return tournament;
    }

    await interaction.reply({
      content: `Successully signed up for: ${tournament.title}`,
      ephemeral: true
    })
  }
  else if (interaction.customId === customIds.leaveButton) {
    try {
      updatedTournament = await leaveSoloTournament(
        tournament.id,
        interaction.user
      );
    }
    catch (e: any) {
      await interaction.reply({
        content: `${e.message}`,
        ephemeral: true
      })
      return tournament;
    }

    await interaction.reply({
      content: `Successully removed Tournament Entry for: ${tournament.title}`,
      ephemeral: true
    })
  }

  if (!updatedTournament) {
    console.error(`Could not update Tournament!`);
    return tournament;
  }

  return updatedTournament;
}

async function handleTeamInteraction(
  tournamentMessage: Message | InteractionResponse,
  interaction: ButtonInteraction,
  { tournament }: TournamentSignupMessageCollectorParameters
): Promise<Tournament & { participants: Brawler[]; teams: Team[]; }> {
  let updatedTournament;

  if (interaction.customId === customIds.signupButton) {
    const team = await findTeamByUser(interaction.user);
    if (!team) {
      await interaction.reply({
        content: 'You are currently not in a Team',
        ephemeral: true
      })
      return tournament;
    }

    const brawler = await findOrCreateBrawler(interaction.user);
    if (team.ownerId !== brawler.id) {
      await interaction.reply({
        content: 'Only the Team Owner can sign the Team up from the Tournament.',
        ephemeral: true
      })
      return tournament;
    }

    if (team.members.length < tournament.teamSize) {
      await interaction.reply({
        content: 'Your Team has not enough members. Please invite some to join the Tournament.',
        ephemeral: true
      })
      return tournament;
    }

    const message = await interaction.reply(
      {
        ...await TournamentSignupTeamMessageProvider.createMessage({
          team: team,
          tournament: tournament
        }),
        ephemeral: true
      }
    )

    await TournamentSignupTeamMessageProvider.collector(
      message,
      {
        team: team,
        tournament: tournament,
        tournamentMessage: tournamentMessage
      }
    )
    return tournament;
  }

  if (interaction.customId === customIds.leaveButton) {
    try {
      updatedTournament = await leaveTeamTournament(
        tournament.id,
        interaction.user
      );
    }
    catch (e: any) {
      await interaction.reply({
        content: `${e.message}`,
        ephemeral: true
      })
      return tournament;
    }

    await interaction.reply({
      content: `Successully removed Team Tournament Entry for: ${tournament.title}`,
      ephemeral: true
    })
  }

  if (!updatedTournament) {
    return tournament;
  }
  return updatedTournament;
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
    let updatedTournament;
    if (params.tournament.teamSize === 1) {
      updatedTournament = await handleSoloInteraction(
        interaction,
        params
      )
    }
    else {
      updatedTournament = await handleTeamInteraction(
        message,
        interaction,
        params
      )
    }

    await message.edit(await createMessage({ tournament: updatedTournament }))
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