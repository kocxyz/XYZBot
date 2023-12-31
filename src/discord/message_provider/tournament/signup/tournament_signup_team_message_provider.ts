import {
  ActionRowBuilder,
  ComponentType,
  InteractionResponse,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { Brawler, Tournament, Team } from '@prisma/client';
import {
  MessageProvider,
  reply,
  replyErrorFromResult,
} from '../../../message_provider';
import { signupForTeamTournament } from '../../../../services/tournament';
import { TournamentSignupMessageProvider } from './tournament_signup_message_provider';

const customIds = {
  users: 'users',
} as const;

async function createMessage({
  tournament,
  team,
}: TournamentSignupTeamMessageCreateParameters) {
  const userSelect = new StringSelectMenuBuilder()
    .setCustomId(customIds.users)
    .setPlaceholder('Select members to signup:')
    .setMinValues(tournament.teamSize)
    .setMaxValues(tournament.teamSize)
    .addOptions([
      ...team.members.map((m) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(m.username)
          .setValue(m.discordId),
      ),
    ]);

  return {
    content: `Please select the ${tournament.teamSize} Team Members that should participate:`,
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(userSelect),
    ],
  };
}

async function collector(
  message: Message | InteractionResponse,
  {
    tournamentMessage,
    tournament,
    team,
  }: TournamentSignupTeamMessageCollectorParameters,
) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 3_600_000,
    max: 1,
  });

  collector.once('collect', async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const users = await Promise.all(
      interaction.values.map((uid) => interaction.client.users.fetch(uid)),
    );

    const signupResult = await signupForTeamTournament(
      tournament.id,
      interaction.user,
      users,
    );

    if (signupResult.type === 'error') {
      await replyErrorFromResult(interaction, signupResult);
      return;
    }

    await tournamentMessage
      .edit(
        await TournamentSignupMessageProvider.createMessage({
          tournament: signupResult.data,
        }).catch(),
      )
      .catch();

    await reply(interaction, {
      content: `Successully signed up Team (${team.name}) for: ${tournament.title}`,
      ephemeral: true,
    });
  });
}

type TournamentSignupTeamMessageCreateParameters = {
  tournament: Tournament;
  team: Team & {
    members: Brawler[];
  };
};

type TournamentSignupTeamMessageCollectorParameters = {
  tournament: Tournament;
  tournamentMessage: Message | InteractionResponse;
  team: Team & {
    members: Brawler[];
  };
};

export const TournamentSignupTeamMessageProvider = {
  createMessage,
  collector,
} satisfies MessageProvider<
  TournamentSignupTeamMessageCreateParameters,
  TournamentSignupTeamMessageCollectorParameters
>;
