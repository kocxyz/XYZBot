import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { TournamentCreationTeamSizeMessageProvider } from '../../message_provider/tournament_creation_teamsize_message_provider';
import { isOrganizer } from '../../guards/role_guards';
import { reply } from '../../message_provider';


export const CreateTournamentBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('create-tournament')
    .setDescription('Creates a new Tournament')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The name of the Tournament')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('A small description about the Tournament')
        .setRequired(true)
    ),

  execute: async (interaction) => {
    if (!await isOrganizer(interaction)) {
      await reply(
        interaction,
        {
          content: 'You are not allowed to use this command.',
          ephemeral: true
        }
      )
      return;
    }

    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);

    const message = await reply(
      interaction,
      {
        ...await TournamentCreationTeamSizeMessageProvider.createMessage({
          name, description
        }),
        ephemeral: true
      }
    )

    if (!message) {
      return;
    }

    await TournamentCreationTeamSizeMessageProvider.collector(message, {
      name, description
    })

  }
} satisfies BasicDiscordCommand

