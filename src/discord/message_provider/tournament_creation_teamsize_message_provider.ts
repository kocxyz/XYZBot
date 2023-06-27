import {
  ActionRowBuilder,
  ComponentType,
  InteractionResponse,
  Message,
  MessageCreateOptions,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { MessageProvider, reply } from '../message_provider';
import { createTournamentCreationSummaryEmbed } from '../embeds/tournament/tournament_creation_embed';
import { TournamentCreationServerMessageProvider } from './tournament_creation_server_message_provider';

const customIds = {
  teamSizeInput: 'teamSize',
} as const;

async function createMessage({
  name,
  description,
}: TournamentCreationTeamSizeMessageCreateParameters) {
  const teamSizeInput = new StringSelectMenuBuilder()
    .setCustomId(customIds.teamSizeInput)
    .setPlaceholder('Select the team size!')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('1v1')
        .setDescription('1v1')
        .setValue('1'),
      new StringSelectMenuOptionBuilder()
        .setLabel('2v2')
        .setDescription('2v2')
        .setValue('2'),
      new StringSelectMenuOptionBuilder()
        .setLabel('3v3')
        .setDescription('3v3')
        .setValue('3'),
    );

  return {
    embeds: [createTournamentCreationSummaryEmbed(name, description)],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        teamSizeInput,
      ),
    ],
  } satisfies MessageCreateOptions;
}

async function collector(
  message: Message | InteractionResponse,
  { name, description }: TournamentCreationTeamSizeMessageCollectorParameters,
) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 3_600_000,
  });

  collector.once('collect', async (interaction) => {
    const teamSize = parseInt(interaction.values[0]);

    const message = await reply(interaction, {
      ...(await TournamentCreationServerMessageProvider.createMessage({
        name,
        description,
        teamSize,
      })),
      ephemeral: true,
    });

    if (!message) {
      return;
    }

    await TournamentCreationServerMessageProvider.collector(message, {
      name,
      description,
      teamSize,
    });
  });
}

type TournamentCreationTeamSizeMessageCreateParameters = {
  name: string;
  description: string;
};

type TournamentCreationTeamSizeMessageCollectorParameters = {
  name: string;
  description: string;
};

export const TournamentCreationTeamSizeMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentCreationTeamSizeMessageCreateParameters,
  TournamentCreationTeamSizeMessageCollectorParameters
>;
