import {
  SlashCommandBuilder
} from 'discord.js';
import { BasicDiscordCommand } from '../../command';
import { disbandTeam, findTeamByUser } from '../../../services/team';
import { findOrCreateBrawler } from '../../../services/brawler';
import { findTournamentsTeamIsSignedUpFor } from '../../../services/tournament';

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
      await interaction.reply({
        content: 'You are not in a team!',
        ephemeral: true
      })
      return;
    }

    const brawler = await findOrCreateBrawler(interaction.user);
    if (team.ownerId !== brawler.id) {
      await interaction.reply({
        content: 'Only the owner can disband the Team.',
        ephemeral: true
      })
      return;
    }

    const signupTournaments = await findTournamentsTeamIsSignedUpFor(team);
    if (signupTournaments.length > 0) {
      await interaction.reply({
        content: 'Your Team is currently still signed up for active Tournaments.',
        ephemeral: true
      })
      return;
    }

    const disbandedTeam = await disbandTeam(team.id);
    await interaction.reply({
      content: `Successfully disbanded Team '${disbandedTeam.name}'`,
      ephemeral: true
    })
  }
} satisfies BasicDiscordCommand
