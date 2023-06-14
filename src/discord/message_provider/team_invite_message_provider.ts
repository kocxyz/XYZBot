import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { MessageProvider } from "../message_provider";
import { Team } from "@prisma/client";
import { findTeamByUser, joinTeam } from "../../services/team";

const customIds = {
  acceptButton: 'accept',
  declineButton: 'decline'
} as const;

async function createMessage(
  { team }: TeamInviteMessageCreateParameters
) {
  const acceptButton = new ButtonBuilder()
    .setCustomId(customIds.acceptButton)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success)

  const declineButton = new ButtonBuilder()
    .setCustomId(customIds.declineButton)
    .setLabel('Decline')
    .setStyle(ButtonStyle.Danger)

  return {
    content: `You have been invited to the Team: ${team.name}`,
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents([acceptButton, declineButton]),
    ]
  }
}

async function collector(
  message: Message | InteractionResponse,
  { team }: TeamInviteMessageCollectorParameters
) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3_600_000
  });

  collector.on('collect', async (interaction) => {
    if (interaction.customId === customIds.declineButton) {
      await interaction.reply({
        content: `Successfully declined invite.`
      })
      return;
    }

    const userTeam = await findTeamByUser(interaction.user)
    if (userTeam) {
      await interaction.reply({
        content: `You are currently in a Team. Invite could not be accepted.`
      })
      return;
    }

    const joinedTeam = await joinTeam(team.id, interaction.user)
    if (!joinedTeam) {
      await interaction.reply({
        content: `An Error occured joining Team: ${team.name}`
      })
      return;
    }

    await interaction.reply({
      content: `Successfully joined Team: ${joinedTeam.name}`
    })
  })
}

type TeamInviteMessageCreateParameters = {
  team: Team
}

type TeamInviteMessageCollectorParameters = {
  team: Team
}

export const TeamInviteMessageProvider = {
  createMessage,
  collector
} satisfies MessageProvider<
  TeamInviteMessageCreateParameters,
  TeamInviteMessageCollectorParameters
>