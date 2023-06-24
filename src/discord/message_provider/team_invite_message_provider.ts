import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { MessageProvider, reply, replyErrorFromResult } from "../message_provider";
import { Team } from "@prisma/client";
import { joinTeam } from "../../services/team";

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
      await reply(
        interaction,
        {
          content: `Successfully declined invite.`
        }
      )
      return;
    }

    const joinTeamResult = await joinTeam(team.id, interaction.user)
    if (joinTeamResult.type === 'error') {
      await replyErrorFromResult(interaction, joinTeamResult);
      return;
    }

    await reply(
      interaction,
      {
        content: `Successfully joined Team: ${joinTeamResult.data.name}`
      }
    )
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