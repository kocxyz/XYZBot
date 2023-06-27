import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
} from 'discord.js';
import { createTournamentSignupEmbed } from '../../../embeds/tournament/tournament_signup_embed';
import { Participant, Tournament } from '@prisma/client';
import {
  MessageProvider,
  reply,
  replyErrorFromResult,
} from '../../../message_provider';
import {
  signupForSoloTournament,
  leaveSoloTournament,
  leaveTeamTournament,
  findTournamentById,
} from '../../../../services/tournament';
import { assertIsTeamOwner } from '../../../../services/team';
import { TournamentSignupTeamMessageProvider } from './tournament_signup_team_message_provider';
import { PermanentCollector } from '../../../permanent_collector';

const customIds = {
  signupButton: 'signup',
  leaveButton: 'leave',
} as const;

async function handleSoloInteraction(
  interaction: ButtonInteraction,
  { tournament }: TournamentSignupMessageCollectorParameters,
): Promise<void> {
  if (interaction.customId === customIds.signupButton) {
    const signupResult = await signupForSoloTournament(
      tournament.id,
      interaction.user,
    );

    if (signupResult.type === 'error') {
      await replyErrorFromResult(interaction, signupResult);
      return;
    }

    await reply(interaction, {
      content: `Successully signed up for: ${tournament.title}`,
      ephemeral: true,
    });
  } else if (interaction.customId === customIds.leaveButton) {
    const leaveResult = await leaveSoloTournament(
      tournament.id,
      interaction.user,
    );

    if (leaveResult.type === 'error') {
      await replyErrorFromResult(interaction, leaveResult);
      return;
    }

    await reply(interaction, {
      content: `Successully removed Tournament Entry for: ${tournament.title}`,
      ephemeral: true,
    });
  }
}

async function handleTeamInteraction(
  tournamentMessage: Message | InteractionResponse,
  interaction: ButtonInteraction,
  { tournament }: TournamentSignupMessageCollectorParameters,
): Promise<void> {
  if (interaction.customId === customIds.signupButton) {
    const ownerResult = await assertIsTeamOwner(interaction.user);

    if (ownerResult.type === 'error') {
      await replyErrorFromResult(interaction, ownerResult);
      return;
    }

    const [team] = ownerResult.data;
    if (team.members.length < tournament.teamSize) {
      await reply(interaction, {
        content:
          'Your Team has not enough members. Please invite some to join the Tournament.',
        ephemeral: true,
      });
      return;
    }

    const message = await reply(interaction, {
      ...(await TournamentSignupTeamMessageProvider.createMessage({
        team: team,
        tournament: tournament,
      })),
      ephemeral: true,
    });

    if (!message) {
      return;
    }

    await TournamentSignupTeamMessageProvider.collector(message, {
      team: team,
      tournament: tournament,
      tournamentMessage: tournamentMessage,
    });
    return;
  }

  if (interaction.customId === customIds.leaveButton) {
    const leaveResult = await leaveTeamTournament(
      tournament.id,
      interaction.user,
    );

    if (leaveResult.type === 'error') {
      await replyErrorFromResult(interaction, leaveResult);
      return;
    }

    await reply(interaction, {
      content: `Successully removed Team Tournament Entry for: ${tournament.title}`,
      ephemeral: true,
    });
  }
}

async function createMessage({
  tournament,
}: TournamentSignupMessageCreateParameters) {
  const embed = await createTournamentSignupEmbed(tournament);

  const signupInput = new ButtonBuilder()
    .setCustomId(customIds.signupButton)
    .setLabel(
      tournament.teamSize === 1
        ? 'I want to participate!'
        : 'We want to participate!',
    )
    .setStyle(ButtonStyle.Success);

  const leaveInput = new ButtonBuilder()
    .setCustomId(customIds.leaveButton)
    .setLabel(
      tournament.teamSize === 1
        ? 'I changed my mind.'
        : 'We changed our minds.',
    )
    .setStyle(ButtonStyle.Danger);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        signupInput,
        leaveInput,
      ),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  params: TournamentSignupMessageCollectorParameters,
) {
  const collector = PermanentCollector.createMessageComponentCollector({
    message,
    componentType: ComponentType.Button,
  });

  collector.on('collect', async (interaction) => {
    if (params.tournament.teamSize === 1) {
      await handleSoloInteraction(interaction, params);
    } else {
      await handleTeamInteraction(message, interaction, params);
    }

    const tournamentResult = await findTournamentById(params.tournament.id);
    if (tournamentResult.type === 'error') {
      await replyErrorFromResult(interaction, tournamentResult);
      return;
    }

    await message.edit(
      await createMessage({ tournament: tournamentResult.data }),
    );
  });
}

type TournamentSignupMessageCreateParameters = {
  tournament: Tournament & {
    participants: Participant[];
  };
};

type TournamentSignupMessageCollectorParameters = {
  tournament: Tournament & {
    participants: Participant[];
  };
};

export const TournamentSignupMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentSignupMessageCreateParameters,
  TournamentSignupMessageCollectorParameters
>;
