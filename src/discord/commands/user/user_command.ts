import { SlashCommandBuilder } from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { DEFAULT_AUTH_URL, getUser } from 'knockoutcity-auth-client';
import { createUserEmbed } from '../../embeds/user_embed';
import { reply } from '../../message_provider';

export const UserBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Get information about a user')
    .addUserOption((option) =>
      option
        .setName('name')
        .setDescription('The name of the user')
        .setRequired(false),
    ),

  execute: async (interaction) => {
    const user = interaction.options.getUser('name', false) ?? interaction.user;

    const userData = await getUser(DEFAULT_AUTH_URL, user.id).catch(() => null);

    if (!userData) {
      await reply(interaction, {
        content: 'User does not exist!',
        ephemeral: true,
      });
      return;
    }

    await reply(interaction, {
      embeds: [await createUserEmbed(interaction, user, userData.data)],
    });
  },
} satisfies BasicDiscordCommand;
