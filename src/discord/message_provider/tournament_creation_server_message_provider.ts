import {
  ActionRowBuilder,
  ComponentType,
  InteractionResponse,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { MessageProvider, reply } from '../message_provider';
import { createTournamentCreationSummaryEmbed } from '../embeds/tournament/tournament_creation_embed';
import { DEFAULT_AUTH_URL, getServers } from 'knockoutcity-auth-client';
import { TournamentCreationConfirmMessageProvider } from './tournament_creation_confirm_message_provider';

const customIds = {
  serverInput: 'server',
} as const;

async function createMessage({
  name,
  description,
  teamSize,
}: TournamentCreationServerMessageCreateParameters) {
  const servers = await getServers(DEFAULT_AUTH_URL);
  const serverInput = new StringSelectMenuBuilder()
    .setCustomId(customIds.serverInput)
    .setPlaceholder('Select the Tournament Server!')
    .addOptions(
      servers.data.map((server, index) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(`${server.region} | ${server.name}`)
          .setValue(`${index}`);
      }),
    );

  return {
    embeds: [createTournamentCreationSummaryEmbed(name, description, teamSize)],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        serverInput,
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
  }: TournamentCreationServerMessageCollectorParameters,
) {
  const servers = await getServers(DEFAULT_AUTH_URL);

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 3_600_000,
    max: 1,
  });

  collector.once('collect', async (interaction) => {
    const server = servers.data[parseInt(interaction.values[0])];

    const message = await reply(interaction, {
      ...(await TournamentCreationConfirmMessageProvider.createMessage({
        name,
        description,
        teamSize,
        server,
      })),
      ephemeral: true,
    });

    if (!message) {
      return;
    }

    await TournamentCreationConfirmMessageProvider.collector(message, {
      name,
      description,
      teamSize,
      server,
    });
  });

  collector.on('end', () => {
    message.delete().catch();
  });
}

type TournamentCreationServerMessageCreateParameters = {
  name: string;
  description: string;
  teamSize: number;
};

type TournamentCreationServerMessageCollectorParameters = {
  name: string;
  description: string;
  teamSize: number;
};

export const TournamentCreationServerMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentCreationServerMessageCreateParameters,
  TournamentCreationServerMessageCollectorParameters
>;
