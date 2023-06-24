import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { disbandTeam } from '../../../services/team';
import { reply, replyErrorFromResult } from '../../message_provider';

export const DisbandTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('disband-team')
    .setDescription('Disband the Team'),

  execute: async (interaction) => {
    const disbandedTeamResult = await disbandTeam(interaction.user);

    if (disbandedTeamResult.type === 'error') {
      await replyErrorFromResult(interaction, disbandedTeamResult);
      return;
    }

    await reply(
      interaction,
      {
        content: `Successfully disbanded Team '${disbandedTeamResult.data.name}'`,
        ephemeral: true
      }
    )
  }
} satisfies BasicDiscordCommand
