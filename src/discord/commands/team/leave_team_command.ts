import { SlashCommandBuilder } from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { leaveTeam } from '../../../services/team';
import { reply, replyErrorFromResult } from '../../message_provider';

export const LeaveTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('leave-team')
    .setDescription('Leave your current Team'),

  execute: async (interaction) => {
    const leaveTeamResult = await leaveTeam(interaction.user);

    if (leaveTeamResult.type === 'error') {
      await replyErrorFromResult(interaction, leaveTeamResult);
      return;
    }

    await reply(interaction, {
      content: `Successfully left Team: ${leaveTeamResult.data.name}`,
      ephemeral: true,
    });
  },
} satisfies BasicDiscordCommand;
