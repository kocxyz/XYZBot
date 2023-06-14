import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { findTeamByUser } from '../../../services/team';
import { findOrCreateBrawler } from '../../../services/brawler';
import { TeamInviteMessageProvider } from '../../message_provider/team_invite_message_provider';

export const InviteTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('invite-to-team')
    .setDescription('Invite a User to your Team')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to invite to the Team')
        .setRequired(true)
    ),

  execute: async (interaction) => {
    const user = interaction.options.getUser('user', true)

    const team = await findTeamByUser(interaction.user);
    // If the user is currently not in a team
    if (!team) {
      await interaction.reply({
        content: 'You are not in a team!',
        ephemeral: true
      })
      return;
    }

    const brawler = await findOrCreateBrawler(interaction.user);
    if (team.ownerId !== brawler.id) {
      await interaction.reply({
        content: 'Only the owner can invite users to the team!',
        ephemeral: true
      })
      return;
    }

    const message = await user.send(
      await TeamInviteMessageProvider.createMessage({ team })
    );
    await TeamInviteMessageProvider.collector(message, { team })

    await interaction.reply({
      content: `Invite send to ${user.username}`,
      ephemeral: true
    })
  }
} satisfies BasicDiscordCommand


