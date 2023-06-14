import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { DEFAULT_AUTH_URL, getUser } from 'knockoutcity-auth-client';
import { createUserEmbed } from '../../embeds/user_embed';

export const UserBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Creates a new Team')
    .addUserOption(option =>
      option.setName('name')
        .setDescription('The name of the user')
        .setRequired(false)
    ),

  execute: async (interaction) => {
    const user = interaction.options.getUser('name', false)
      ?? interaction.user;

    const userData = await getUser(DEFAULT_AUTH_URL, user.id)
      .catch(() => null);

    if (!userData) {
      await interaction.reply({
        content: 'User does not exist!',
      })
      return;
    }

    await interaction.reply({
      embeds: [createUserEmbed(user, userData.data)]
    });
  }
} satisfies BasicDiscordCommand
