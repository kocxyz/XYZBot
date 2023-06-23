import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { createTeam, findTeamByUser } from '../../../services/team';
import { createLogger } from '../../../logging';
import { reply, replyError } from '../../message_provider';

const logger = createLogger('Create Team Command')

export const CreateTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('create-team')
    .setDescription('Creates a new Team')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the Team')
        .setRequired(true)
    ),

  execute: async (interaction) => {
    const team = await findTeamByUser(interaction.user);
    // If a team already exists for that user
    // then he has to leave first
    if (team) {
      await reply(
        interaction,
        {
          content: 'You are already in a team!',
          ephemeral: true
        }
      )
      return;
    }

    const createdTeam = await createTeam(
      interaction.user,
      interaction.options.getString('name', true)
    ).catch((error) => {
      logger.error(
        `An error occured during Team creation: ${JSON.stringify(error)}`
      )
      return null;
    });

    if (createdTeam === null) {
      await replyError(interaction);
      return;
    }

    await reply(
      interaction,
      {
        content: `Created Team **'${createdTeam.name}'**`,
        ephemeral: true
      }
    )
  }
} satisfies BasicDiscordCommand
