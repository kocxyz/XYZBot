import { SlashCommandBuilder } from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { isOrganizer } from '../../guards/role_guards';
import { reply, replyErrorFromResult } from '../../message_provider';
import { TournamentMatchOrganizerMessageProvider } from '../../message_provider/tournament/organize/tournament_match_organizer_message_provider';
import { getMatchForEmbed } from '../../../services/match';
import { setTournamentMatchMessageId } from '../../../services/tournament';

export const CreateTournamentMatchGameBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('create-tournament-match-game')
    .setDescription('Creates a embed for a Tournament Match Game')
    .addNumberOption((option) =>
      option
        .setName('id')
        .setDescription('The Id of the Tournament Match Game')
        .setRequired(true),
    ),

  execute: async (interaction) => {
    await interaction.deferReply();

    if (!(await isOrganizer(interaction))) {
      await reply(interaction, {
        content: 'You are not allowed to use this command.',
        ephemeral: true,
      });
      return;
    }

    const id = interaction.options.getNumber('id', true);

    const matchResult = await getMatchForEmbed(id);
    if (matchResult.type === 'error') {
      await replyErrorFromResult(interaction, matchResult);
      return;
    }

    const message = await reply(
      interaction,
      await TournamentMatchOrganizerMessageProvider.createMessage({
        match: matchResult.data,
      }),
    );

    if (!message) {
      return;
    }

    const tournamentMatchOrganizerEmbedMessage = await message.fetch();

    await TournamentMatchOrganizerMessageProvider.collector(
      tournamentMatchOrganizerEmbedMessage,
      { match: matchResult.data },
    );

    await setTournamentMatchMessageId(
      matchResult.data.id,
      tournamentMatchOrganizerEmbedMessage.id,
    );
  },
} satisfies BasicDiscordCommand;
