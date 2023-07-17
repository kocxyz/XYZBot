import { SlashCommandBuilder } from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { assertIsTeamOwner } from '../../../services/team';
import { TeamInviteMessageProvider } from '../../message_provider/team_invite_message_provider';
import { reply, replyErrorFromResult } from '../../message_provider';

export const InviteTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('invite-to-team')
    .setDescription('Invite a User to your Team')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to invite to the Team')
        .setRequired(true),
    ),

  execute: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    
    const user = interaction.options.getUser('user', true);

    const ownerResult = await assertIsTeamOwner(interaction.user);

    if (ownerResult.type === 'error') {
      await replyErrorFromResult(interaction, ownerResult);
      return;
    }

    const [team] = ownerResult.data;
    const message = await user.send(
      await TeamInviteMessageProvider.createMessage({ team }),
    );
    await TeamInviteMessageProvider.collector(message, { team });

    await reply(interaction, {
      content: `Invite send to ${user.username}`,
      ephemeral: true,
    });
  },
} satisfies BasicDiscordCommand;
