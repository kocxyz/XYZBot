import { BaseInteraction } from 'discord.js';
import { environment } from '../../environment';
import { createLogger } from '../../logging';

const logger = createLogger('Role Guards');

export async function isOrganizer(
  interaction: BaseInteraction,
): Promise<boolean> {
  if (!interaction.guild) {
    return false;
  }

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch((error) => {
      logger.error(`Could not fetch member: ${JSON.stringify(error)}`);
      return null;
    });

  return (
    member?.roles.cache.has(environment.DISCORD_TOURNAMENT_ORGANIZER_ROLE_ID) ??
    false
  );
}
