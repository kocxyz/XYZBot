import { SlashCommandBuilder } from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { createTeam } from '../../../services/team';
import {
  reply,
  replyErrorFromResult,
} from '../../message_provider';

export const CreateTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('create-team')
    .setDescription('Creates a new Team')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The name of the Team')
        .setRequired(true),
    ),

  execute: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    
    const createdTeamResult = await createTeam(
      interaction.user,
      interaction.options.getString('name', true),
    );

    if (createdTeamResult.type === 'error') {
      await replyErrorFromResult(interaction, createdTeamResult);
      return;
    }

    await reply(interaction, {
      content: `Created Team **'${createdTeamResult.data.name}'**`,
      ephemeral: true,
    });
  },
} satisfies BasicDiscordCommand;
