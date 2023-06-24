import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { findTeamByName, findTeamByUser } from '../../../services/team';
import { createTeamEmbed } from '../../embeds/team_embed';
import { reply, replyErrorFromResult } from '../../message_provider';

export const TeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Get information about a team')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the team')
        .setRequired(false)
    ),

  execute: async (interaction) => {
    const teamName = interaction.options.getString('name', false)
    const teamResult = teamName === null
      // Own team info
      ? await findTeamByUser(interaction.user)
      // Other team info
      : await findTeamByName(teamName)

    if (teamResult.type === 'error') {
      await replyErrorFromResult(interaction, teamResult);
      return;
    }

    await reply(
      interaction,
      {
        embeds: [createTeamEmbed(teamResult.data)]
      }
    );
  }
} satisfies BasicDiscordCommand
