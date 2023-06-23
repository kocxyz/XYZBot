import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { disbandTeam, findTeamByUser } from '../../../services/team';
import { findOrCreateBrawler } from '../../../services/brawler';
import { findTournamentsTeamIsSignedUpFor } from '../../../services/tournament';
import { createLogger } from '../../../logging';
import { reply } from '../../message_provider';

const logger = createLogger('Disband Team Command');

export const DisbandTeamBasicCommand = {
  type: 'basic',

  data: new SlashCommandBuilder()
    .setName('disband-team')
    .setDescription('Disband the Team'),

  execute: async (interaction) => {
    const team = await findTeamByUser(interaction.user);
    // If a team already exists for that user
    // then he has to leave first
    if (!team) {
      await reply(
        interaction,
        {
          content: 'You are not in a team!',
          ephemeral: true
        }
      )
      return;
    }

    const brawler = await findOrCreateBrawler(interaction.user);
    if (team.ownerId !== brawler.id) {
      await reply(
        interaction,
        {
          content: 'Only the owner can disband the Team.',
          ephemeral: true
        }
      )
      return;
    }

    const signupTournaments = await findTournamentsTeamIsSignedUpFor(team);
    if (signupTournaments.length > 0) {
      await reply(
        interaction,
        {
          content: 'Your Team is currently still signed up for active Tournaments.',
          ephemeral: true
        }
      )
      return;
    }

    const disbandedTeam = await disbandTeam(team.id);
    await reply(
      interaction,
      {
        content: `Successfully disbanded Team '${disbandedTeam.name}'`,
        ephemeral: true
      }
    )
  }
} satisfies BasicDiscordCommand
