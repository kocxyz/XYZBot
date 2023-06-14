import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { createTeam, findTeamByUser } from '../../../services/team';
import { isOrganizer } from '../../guards/role_guards';

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
      await interaction.reply({
        content: 'You are already in a team!',
        ephemeral: true
      })
      return;
    }

    const createdTeam = await createTeam(
      interaction.user,
      interaction.options.getString('name', true)
    );

    await interaction.reply({
      content: `Created Team **'${createdTeam.name}'**`,
      ephemeral: true
    })
  }
} satisfies BasicDiscordCommand
