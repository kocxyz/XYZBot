import { BaseInteraction } from "discord.js";
import { environment } from "../../environment";

export async function isOrganizer(interaction: BaseInteraction): Promise<boolean> {
  if (!interaction.guild) {
    return false;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id)
  return member.roles.cache.has(environment.DISCORD_TOURNAMENT_ORGANIZER_ROLE_ID)
}