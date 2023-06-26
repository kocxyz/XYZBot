import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { MessageProvider, reply, replyErrorFromResult } from "../message_provider";
import { archiveTournament, changeTournamentStatus, findTournamentById } from "../../services/tournament";
import { Tournament, TournamentStatus, Participant, Brawler, Team } from "@prisma/client";
import { createTournamentOrganizerEmbed } from "../embeds/tournament/tournament_organizer_embed";
import { createTournamentSignupListEmbed } from "../embeds/tournament/tournament_signups_list_embed";
import { environment } from "../../environment";
import { PermanentCollector } from "../permanent_collector";

const customIds = {
  openSignupsButton: 'openSignups',
  closeSignupsButton: 'closeSignups',
  startButton: 'start',
  finishButton: 'finish',
  listSignupsButton: 'listSignups',
  archiveButton: 'delete'
} as const;

async function createMessage(
  { tournament }: TournamentOrganizerMessageCreateParameters
) {
  const openSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.openSignupsButton)
    .setLabel('Open Signups')
    .setStyle(ButtonStyle.Primary)

  const closeSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.closeSignupsButton)
    .setLabel('Close Signups')
    .setStyle(ButtonStyle.Primary)

  const startButton = new ButtonBuilder()
    .setCustomId(customIds.startButton)
    .setLabel('Start Tournament')
    .setStyle(ButtonStyle.Success)

  const finishButton = new ButtonBuilder()
    .setCustomId(customIds.finishButton)
    .setLabel('Finish Tournament')
    .setStyle(ButtonStyle.Danger)

  const listSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.listSignupsButton)
    .setLabel('List Signups')
    .setStyle(ButtonStyle.Primary)

  const archiveButton = new ButtonBuilder()
    .setCustomId(customIds.archiveButton)
    .setLabel('Archive Tournament')
    .setStyle(ButtonStyle.Secondary)

  return {
    embeds: [await createTournamentOrganizerEmbed(tournament)],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          tournament.status === TournamentStatus.FINISHED
            ? [archiveButton]
            : tournament.status === TournamentStatus.IN_PROGRESS
              ? [listSignupsButton, finishButton]
              : tournament.status === TournamentStatus.SIGNUP_OPEN
                ? [listSignupsButton, closeSignupsButton, startButton]
                : [listSignupsButton, openSignupsButton]
        )
      ,
    ]
  }
}

async function collector(
  message: Message | InteractionResponse,
  { tournament }: TournamentOrganizerMessageCollectorParameters
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    switch (interaction.customId) {
      case customIds.openSignupsButton:
        await changeTournamentStatus(
          tournament.id,
          TournamentStatus.SIGNUP_OPEN
        )
        break;
      case customIds.closeSignupsButton:
        await changeTournamentStatus(
          tournament.id,
          TournamentStatus.SIGNUP_CLOSED
        )
        break;
      case customIds.startButton:
        await changeTournamentStatus(
          tournament.id,
          TournamentStatus.IN_PROGRESS
        )
        break;
      case customIds.finishButton:
        await changeTournamentStatus(
          tournament.id,
          TournamentStatus.FINISHED
        )
        break;
      case customIds.archiveButton:
        const archiveResult = await archiveTournament(
          tournament.id,
        )

        if (archiveResult.type === 'error') {
          await replyErrorFromResult(interaction, archiveResult);
          return;
        }

        await reply(
          interaction,
          {
            content: `Successfully archive Tournament: ${tournament.title}`,
            ephemeral: true
          }
        )

        const organizerChannel = await interaction.client.channels.fetch(
          environment.DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID
        )

        if (
          organizerChannel &&
          organizerChannel.isTextBased() &&
          tournament.discordOrganizerMessageId !== null
        ) {
          try {
            const message = await organizerChannel.messages.fetch(
              tournament.discordOrganizerMessageId
            )
            await message.delete();
            await reply(
              interaction,
              {
                content: `Successfully deleted Organization Message`,
                ephemeral: true
              }
            )
          }
          catch (e: any) {
            console.error(`(${tournament.title}): ${e.message}`)
            await reply(
              interaction,
              {
                content: `An error occured while deleting the Organization message.`,
                ephemeral: true
              }
            )
          }
        }

        const signupsChannel = await interaction.client.channels.fetch(
          environment.DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID
        )

        if (
          signupsChannel &&
          signupsChannel.isTextBased() &&
          tournament.discordSingupMessageId !== null
        ) {
          try {
            const message = await signupsChannel.messages.fetch(
              tournament.discordSingupMessageId
            )
            await message.delete()
            await reply(
              interaction,
              {
                content: `Successfully deleted Signups Message`,
                ephemeral: true
              }
            )
          }
          catch (e: any) {
            console.error(`(${tournament.title}): ${e.message}`)
            await reply(
              interaction,
              {
                content: `An error occured while deleting the Signups message.`,
                ephemeral: true
              }
            )
          }
        }

        return;
      case customIds.listSignupsButton:
        // Pull fresh data because the on in the
        // tournament object can be old since it
        // is not updated when signups change.
        const tournamentResult = await findTournamentById(tournament.id);

        if (tournamentResult.type === 'error') {
          await replyErrorFromResult(interaction, tournamentResult);
          return;
        }

        await reply(
          interaction,
          {
            embeds: [createTournamentSignupListEmbed(tournamentResult.data)],
            ephemeral: true
          }
        )
        return;
    }

    // Pull fresh data because the on in the
    // tournament object can be old since it
    // is not updated when signups change.
    const tournamentResult = await findTournamentById(tournament.id);

    if (tournamentResult.type === 'error') {
      await replyErrorFromResult(interaction, tournamentResult);
      return;
    }

    await message.edit(
      await createMessage({ tournament: tournamentResult.data })
    ).catch()

    await reply(
      interaction,
      {
        content: 'Successfully updated Tournament',
        ephemeral: true
      }
    )
  })
}

type TournamentOrganizerMessageCreateParameters = {
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[],
  }
}

type TournamentOrganizerMessageCollectorParameters = {
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[],
  }
}

export const TournamentOrganizerMessageProvider = {
  createMessage,
  collector
} satisfies MessageProvider<
  TournamentOrganizerMessageCreateParameters,
  TournamentOrganizerMessageCollectorParameters
>