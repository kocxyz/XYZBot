import {
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
} from 'discord.js';
import {
  MessageProvider,
  reply,
  replyErrorFromResult,
} from '../../../message_provider';
import { createTournamentMatchOrganizerEmbed } from '../../../embeds/tournament/tournament_organizer_match_embed';
import {
  Match,
  ParticipantMatchResult,
  Participant,
  Brawler,
  MatchGame,
  ParticipantMatchGameResult,
  Team,
  MatchStatus,
} from '@prisma/client';
import { PermanentCollector } from '../../../permanent_collector';
import {
  getMatchForEmbed,
  getNextMatchGame,
  updateMatchGameScore,
} from '../../../../services/match';

const customIds = {
  enterScoreTeam1: 'enterScoreTeam1',
  enterScoreTeam2: 'enterScoreTeam2',
  nextGameButton: 'nextGame',
} as const;

async function handleScoreUpdate(
  interaction: BaseInteraction,
  match: Match,
  opponent: 1 | 2,
): Promise<void> {
  return new Promise(async (resolve) => {
    const scoreCollector = interaction.channel?.createMessageCollector({
      filter: (message) => !isNaN(parseInt(message.content)),
      max: 1,
    });

    if (!scoreCollector) {
      await reply(interaction, {
        content: `Could not crete score collector.`,
      });
      return;
    }

    const questionMessage = await reply(interaction, {
      content: `Please enter the Score for Team ${opponent}:`,
    });

    scoreCollector.on('end', async (collected) => {
      const collectedMessage = collected.first();
      if (!collectedMessage) {
        await reply(interaction, {
          content: `No message collected.`,
        });
        return;
      }

      const score = parseInt(collectedMessage.content);
      const nextMatchGameResult = await getNextMatchGame(match.id);
      if (nextMatchGameResult.type === 'error') {
        await replyErrorFromResult(interaction, nextMatchGameResult);
        return;
      }

      if (!nextMatchGameResult.data) {
        return;
      }

      await updateMatchGameScore(nextMatchGameResult.data.id, opponent, score);

      await questionMessage?.delete();
      await collectedMessage.delete().catch();

      resolve();
    });
  });
}

async function updateMessage(
  interaction: BaseInteraction,
  message: Message | InteractionResponse,
  match: Match,
) {
  const updateMatchResult = await getMatchForEmbed(match.id);
  if (updateMatchResult.type === 'error') {
    await replyErrorFromResult(interaction, updateMatchResult);
    return;
  }

  await message.edit(
    await TournamentMatchOrganizerMessageProvider.createMessage({
      match: updateMatchResult.data,
    }),
  );
}

async function createMessage({
  match,
}: TournamentMatchOrganizerMessageCreateParameters) {
  const nextGameButton = new ButtonBuilder()
    .setCustomId(customIds.nextGameButton)
    .setLabel('Next Game')
    .setStyle(ButtonStyle.Success)
    .setDisabled(match.status === MatchStatus.COMPLETED);

  const enterScoreTeam1Button = new ButtonBuilder()
    .setCustomId(customIds.enterScoreTeam1)
    .setLabel('Enter Score (Team 1)')
    .setStyle(ButtonStyle.Primary);

  const enterScoreTeam2Button = new ButtonBuilder()
    .setCustomId(customIds.enterScoreTeam2)
    .setLabel('Enter Score (Team 2)')
    .setStyle(ButtonStyle.Primary);

  return {
    embeds: [await createTournamentMatchOrganizerEmbed(match)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        enterScoreTeam1Button,
        enterScoreTeam2Button,
        nextGameButton,
      ]),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  { match }: TournamentMatchOrganizerMessageCollectorParameters,
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    switch (interaction.customId) {
      case customIds.enterScoreTeam1:
        await handleScoreUpdate(interaction, match, 1);
        await updateMessage(interaction, message, match);
        break;

      case customIds.enterScoreTeam2:
        await handleScoreUpdate(interaction, match, 2);
        await updateMessage(interaction, message, match);
        break;

      case customIds.nextGameButton:
        const nextMatchGameResult = await getNextMatchGame(match.id);
        if (nextMatchGameResult.type === 'error') {
          await replyErrorFromResult(interaction, nextMatchGameResult);
          return;
        }

        if (!nextMatchGameResult.data) {
          return;
        }

        const game = nextMatchGameResult.data;
        if (
          game.opponent1Result === null ||
          game.opponent1Result.score === null ||
          game.opponent2Result === null ||
          game.opponent2Result.score === null
        ) {
          await reply(interaction, {
            content: 'Not all Team scores are filled out.',
            ephemeral: true,
          });
          return;
        }

        const isDraw =
          game.opponent1Result.score === game.opponent2Result.score;
        const opponent1Won =
          game.opponent1Result.score > game.opponent2Result.score;

        const updateResults = await Promise.all([
          updateMatchGameScore(
            game.id,
            1,
            game.opponent1Result.score,
            isDraw ? 'draw' : opponent1Won ? 'win' : 'loss',
          ),
          updateMatchGameScore(
            game.id,
            2,
            game.opponent2Result.score,
            isDraw ? 'draw' : !opponent1Won ? 'win' : 'loss',
          ),
        ]);

        if (updateResults.some((r) => r.type === 'error')) {
          await reply(interaction, {
            content: 'Could not update Match Game results.',
            ephemeral: true,
          });
          return;
        }

        await reply(interaction, {
          content: 'Successfully started next Game.',
          ephemeral: true,
        });

        await updateMessage(interaction, message, match);
        break;
    }
  });
}

type TournamentMatchOrganizerMessageCreateParameters = {
  match: Match & {
    opponent1Result:
      | ParticipantMatchResult & {
          participant:
            | Participant & {
                team: Team | null;
                brawlers: Brawler[];
              };
        };
    opponent2Result:
      | ParticipantMatchResult & {
          participant:
            | Participant & {
                team: Team | null;
                brawlers: Brawler[];
              };
        };
    games: (MatchGame & {
      opponent1Result: ParticipantMatchGameResult;
      opponent2Result: ParticipantMatchGameResult;
    })[];
  };
};

type TournamentMatchOrganizerMessageCollectorParameters = {
  match: Match & {
    opponent1Result:
      | ParticipantMatchResult & {
          participant:
            | Participant & {
                team: Team | null;
                brawlers: Brawler[];
              };
        };
    opponent2Result:
      | ParticipantMatchResult & {
          participant:
            | Participant & {
                team: Team | null;
                brawlers: Brawler[];
              };
        };
    games: (MatchGame & {
      opponent1Result: ParticipantMatchGameResult;
      opponent2Result: ParticipantMatchGameResult;
    })[];
  };
};

export const TournamentMatchOrganizerMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentMatchOrganizerMessageCreateParameters,
  TournamentMatchOrganizerMessageCollectorParameters
>;
