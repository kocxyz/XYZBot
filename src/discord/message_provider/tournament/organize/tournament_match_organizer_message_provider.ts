import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
} from 'discord.js';
import { MessageProvider, reply } from '../../../message_provider';
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

const customIds = {
  nextGameButton: 'nextGame',
  nextMatchButton: 'nextMatch',
} as const;

async function createMessage({
  match,
}: TournamentMatchOrganizerMessageCreateParameters) {
  const nextGameButton = new ButtonBuilder()
    .setCustomId(customIds.nextGameButton)
    .setLabel('Next Game')
    .setStyle(ButtonStyle.Success);

  const nextMatchButton = new ButtonBuilder()
    .setCustomId(customIds.nextMatchButton)
    .setLabel('Next Match')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(match.status !== MatchStatus.COMPLETED);

  return {
    embeds: [await createTournamentMatchOrganizerEmbed(match)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        nextGameButton,
        nextMatchButton,
      ]),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  {}: TournamentMatchOrganizerMessageCollectorParameters,
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    await reply(interaction, {
      content: 'Next match',
    });
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
