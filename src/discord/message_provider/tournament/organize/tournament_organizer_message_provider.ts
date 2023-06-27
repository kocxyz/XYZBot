import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
} from 'discord.js';
import { Status } from 'brackets-model';
import {
  MessageProvider,
  reply,
  replyErrorFromResult,
} from '../../../message_provider';
import {
  archiveTournament,
  changeTournamentStatus,
  findTournamentById,
  setTournamentMatchMessageId,
  startTournament,
} from '../../../../services/tournament';
import {
  Tournament,
  TournamentStatus,
  Participant,
  Brawler,
  Team,
} from '@prisma/client';
import { createTournamentOrganizerEmbed } from '../../../embeds/tournament/tournament_organizer_embed';
import { createTournamentSignupListEmbed } from '../../../embeds/tournament/tournament_signups_list_embed';
import { environment } from '../../../../environment';
import { PermanentCollector } from '../../../permanent_collector';
import { manager } from '../../../../tournament_manager/manager';
import { Failure, Success } from '../../../../result';
import { getMatchForEmbed } from '../../../../services/match';
import { TournamentMatchOrganizerMessageProvider } from './tournament_match_organizer_message_provider';

const customIds = {
  openSignupsButton: 'openSignups',
  closeSignupsButton: 'closeSignups',
  startButton: 'start',
  finishButton: 'finish',
  listSignupsButton: 'listSignups',
  archiveButton: 'delete',
} as const;

async function createMessage({
  tournament,
}: TournamentOrganizerMessageCreateParameters) {
  const openSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.openSignupsButton)
    .setLabel('Open Signups')
    .setStyle(ButtonStyle.Primary);

  const closeSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.closeSignupsButton)
    .setLabel('Close Signups')
    .setStyle(ButtonStyle.Primary);

  const startButton = new ButtonBuilder()
    .setCustomId(customIds.startButton)
    .setLabel('Start Tournament')
    .setStyle(ButtonStyle.Success);

  const finishButton = new ButtonBuilder()
    .setCustomId(customIds.finishButton)
    .setLabel('Finish Tournament')
    .setStyle(ButtonStyle.Danger);

  const listSignupsButton = new ButtonBuilder()
    .setCustomId(customIds.listSignupsButton)
    .setLabel('List Signups')
    .setStyle(ButtonStyle.Primary);

  const archiveButton = new ButtonBuilder()
    .setCustomId(customIds.archiveButton)
    .setLabel('Archive Tournament')
    .setStyle(ButtonStyle.Secondary);

  return {
    embeds: [await createTournamentOrganizerEmbed(tournament)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        tournament.status === TournamentStatus.FINISHED
          ? [archiveButton]
          : tournament.status === TournamentStatus.IN_PROGRESS
          ? [listSignupsButton, finishButton]
          : tournament.status === TournamentStatus.SIGNUP_OPEN
          ? [listSignupsButton, closeSignupsButton, startButton]
          : [listSignupsButton, openSignupsButton],
      ),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  { tournament }: TournamentOrganizerMessageCollectorParameters,
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    switch (interaction.customId) {
      case customIds.openSignupsButton:
        const openSignupsResult = await changeTournamentStatus(
          tournament.id,
          TournamentStatus.SIGNUP_OPEN,
        );
        if (openSignupsResult.type === 'error') {
          await replyErrorFromResult(interaction, openSignupsResult);
          return;
        }
        break;
      case customIds.closeSignupsButton:
        const closeSignupsResult = await changeTournamentStatus(
          tournament.id,
          TournamentStatus.SIGNUP_CLOSED,
        );
        if (closeSignupsResult.type === 'error') {
          await replyErrorFromResult(interaction, closeSignupsResult);
          return;
        }
        break;
      case customIds.startButton:
        // Start Tournament
        const startTournamentResult = await startTournament(tournament.id);
        if (startTournamentResult.type === 'error') {
          await replyErrorFromResult(interaction, startTournamentResult);
          return;
        }

        // Grab next matches
        const tournamentNextMatchesResult = await manager.get
          .currentMatches(startTournamentResult.data.id)
          .then(Success)
          .catch((e) => Failure('internal', e.message));
        if (tournamentNextMatchesResult.type === 'error') {
          await replyErrorFromResult(interaction, tournamentNextMatchesResult);
          return;
        }

        // Get next match
        const nextMatch = tournamentNextMatchesResult.data.reduce(
          (acc, cur) => {
            // Check if first match qualifies
            // Else replace with first one that can be played
            if (acc.status !== Status.Ready && cur.status === Status.Ready) {
              return cur;
            }
            // Currently found match is also ready so check if
            // Current match is ready and smaller in number
            if (cur.status === Status.Ready && cur.number < acc.number) {
              return cur;
            }
            return acc;
          },
        );

        const matchResult = await getMatchForEmbed(nextMatch.id);
        if (matchResult.type === 'error') {
          await replyErrorFromResult(interaction, matchResult);
          return;
        }

        const tournamentMatchOrganizerEmbedInteractionMessage = await reply(
          interaction,
          await TournamentMatchOrganizerMessageProvider.createMessage({
            match: matchResult.data,
          }),
        );

        if (!tournamentMatchOrganizerEmbedInteractionMessage) {
          return;
        }

        const tournamentMatchOrganizerEmbedMessage =
          await tournamentMatchOrganizerEmbedInteractionMessage.fetch();

        await TournamentMatchOrganizerMessageProvider.collector(
          tournamentMatchOrganizerEmbedMessage,
          { match: matchResult.data },
        );

        await setTournamentMatchMessageId(
          matchResult.data.id,
          tournamentMatchOrganizerEmbedMessage.id,
        );
        return;
      case customIds.finishButton:
        const finishTournamentResult = await changeTournamentStatus(
          tournament.id,
          TournamentStatus.FINISHED,
        );
        if (finishTournamentResult.type === 'error') {
          await replyErrorFromResult(interaction, finishTournamentResult);
          return;
        }
        break;
      case customIds.archiveButton:
        const archiveResult = await archiveTournament(tournament.id);

        if (archiveResult.type === 'error') {
          await replyErrorFromResult(interaction, archiveResult);
          return;
        }

        await reply(interaction, {
          content: `Successfully archive Tournament: ${tournament.title}`,
          ephemeral: true,
        });

        const organizerChannel = await interaction.client.channels.fetch(
          environment.DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID,
        );

        if (
          organizerChannel &&
          organizerChannel.isTextBased() &&
          tournament.discordOrganizerMessageId !== null
        ) {
          try {
            const message = await organizerChannel.messages.fetch(
              tournament.discordOrganizerMessageId,
            );
            await message.delete();
            await reply(interaction, {
              content: `Successfully deleted Organization Message`,
              ephemeral: true,
            });
          } catch (e: any) {
            console.error(`(${tournament.title}): ${e.message}`);
            await reply(interaction, {
              content: `An error occured while deleting the Organization message.`,
              ephemeral: true,
            });
          }
        }

        const signupsChannel = await interaction.client.channels.fetch(
          environment.DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID,
        );

        if (
          signupsChannel &&
          signupsChannel.isTextBased() &&
          tournament.discordSingupMessageId !== null
        ) {
          try {
            const message = await signupsChannel.messages.fetch(
              tournament.discordSingupMessageId,
            );
            await message.delete();
            await reply(interaction, {
              content: `Successfully deleted Signups Message`,
              ephemeral: true,
            });
          } catch (e: any) {
            console.error(`(${tournament.title}): ${e.message}`);
            await reply(interaction, {
              content: `An error occured while deleting the Signups message.`,
              ephemeral: true,
            });
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

        await reply(interaction, {
          embeds: [createTournamentSignupListEmbed(tournamentResult.data)],
          ephemeral: true,
        });
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

    await message
      .edit(await createMessage({ tournament: tournamentResult.data }))
      .catch();

    await reply(interaction, {
      content: 'Successfully updated Tournament',
      ephemeral: true,
    });
  });
}

type TournamentOrganizerMessageCreateParameters = {
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[];
  };
};

type TournamentOrganizerMessageCollectorParameters = {
  tournament: Tournament & {
    participants: (Participant & { team: Team | null; brawlers: Brawler[] })[];
  };
};

export const TournamentOrganizerMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentOrganizerMessageCreateParameters,
  TournamentOrganizerMessageCollectorParameters
>;
