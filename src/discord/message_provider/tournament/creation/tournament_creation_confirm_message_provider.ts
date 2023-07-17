import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
} from 'discord.js';
import {
  MessageProvider,
  reply,
  replyErrorFromResult,
} from '../../../message_provider';
import { createTournamentCreationSummaryEmbed } from '../../../embeds/tournament/tournament_creation_embed';
import { KOCServer } from 'knockoutcity-auth-client';
import {
  createTournament,
  setTournamentOrganizerMessageId,
  setTournamentSignupsMessageId,
} from '../../../../services/tournament';
import { TournamentOrganizerMessageProvider } from '../../tournament/organize/tournament_organizer_message_provider';
import { TournamentSignupMessageProvider } from '../../tournament/signup/tournament_signup_message_provider';
import { environment } from '../../../../environment';
import { createLogger } from '../../../../logging';

const logger = createLogger('Tournament Creation');

const customIds = {
  confirmButton: 'confirm',
  discardButton: 'discard',
} as const;

async function createMessage({
  name,
  description,
  teamSize,
  server,
}: TournamentCreationConfirmMessageCreateParameters) {
  const confirmInput = new ButtonBuilder()
    .setCustomId(customIds.confirmButton)
    .setLabel('Create Tournament')
    .setStyle(ButtonStyle.Success);

  const cancelInput = new ButtonBuilder()
    .setCustomId(customIds.discardButton)
    .setLabel('Discard')
    .setStyle(ButtonStyle.Danger);

  return {
    embeds: [
      createTournamentCreationSummaryEmbed(name, description, teamSize, server),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        confirmInput,
        cancelInput,
      ),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  {
    name,
    description,
    teamSize,
    server,
  }: TournamentCreationConfirmMessageCollectorParameters,
) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3_600_000,
    max: 1,
  });

  collector.once('collect', async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.customId === customIds.confirmButton) {
      const tournamentResult = await createTournament(name, description, {
        teamSize,
        server,
      });
      if (tournamentResult.type === 'error') {
        await replyErrorFromResult(interaction, tournamentResult);
        return;
      }

      const tournament = tournamentResult.data;
      await reply(interaction, {
        content: `Successfully created Tournament '${tournament.title}'.`,
        ephemeral: true,
      });

      const organizerChannel =
        (await interaction.channel?.client.channels
          .fetch(environment.DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID)
          .catch((error) => {
            logger.error(
              `An error occured when fetching Tournament Organizer Channel: ${JSON.stringify(
                error,
              )}`,
            );
          })) ?? null;

      if (!organizerChannel?.isTextBased()) {
        console.error(`Tournament Organizer Channel is not Text Based.`);
        return;
      }

      const organizerMessage = await organizerChannel.send(
        await TournamentOrganizerMessageProvider.createMessage({ tournament }),
      );

      if (!organizerMessage) {
        console.error(
          `Could not create Organizer Message for ${tournament.id}`,
        );
        return;
      }

      await setTournamentOrganizerMessageId(tournament.id, organizerMessage.id);

      await TournamentOrganizerMessageProvider.collector(organizerMessage, {
        tournament,
      });

      const signupsChannel =
        (await interaction.channel?.client.channels
          .fetch(environment.DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID)
          .catch((error) => {
            logger.error(
              `An error occured when fetching Tournament Signups Channel: ${JSON.stringify(
                error,
              )}`,
            );
          })) ?? null;

      if (!signupsChannel?.isTextBased()) {
        console.error(`Tournament Signups Channel is not Text Based.`);
        return;
      }

      const signupsMessage = await signupsChannel.send(
        await TournamentSignupMessageProvider.createMessage({ tournament }),
      );

      if (!signupsMessage) {
        console.error(`Could not create Signups Message for ${tournament.id}`);
        return;
      }

      await setTournamentSignupsMessageId(tournament.id, signupsMessage.id);

      await TournamentSignupMessageProvider.collector(signupsMessage, {
        tournament,
      });

      return;
    }

    await reply(interaction, {
      content: 'Successfully discarded Tournament.',
      ephemeral: true,
    });
  });

  collector.on('end', () => {
    message.delete().catch();
  });
}

type TournamentCreationConfirmMessageCreateParameters = {
  name: string;
  description: string;
  teamSize: number;
  server: KOCServer;
};

type TournamentCreationConfirmMessageCollectorParameters = {
  name: string;
  description: string;
  teamSize: number;
  server: KOCServer;
};

export const TournamentCreationConfirmMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentCreationConfirmMessageCreateParameters,
  TournamentCreationConfirmMessageCollectorParameters
>;
