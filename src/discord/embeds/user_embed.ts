import { APIEmbedField, BaseInteraction, EmbedBuilder, User } from 'discord.js';
import { KOCUser } from 'knockoutcity-auth-client';
import { findTeamByUser } from '../../services/team';
import moment from 'moment';
import { createLogger } from '../../logging';
import { environment } from '../../environment';
import { unwrapResult } from '../../result';

const logger = createLogger('User Embed');

async function getAdditionalInfo(
  interaction: BaseInteraction,
  user: User,
  userData: KOCUser,
): Promise<{
  color: number;
  description?: string | undefined;
  fields?: APIEmbedField[] | undefined;
}> {
  const member = await interaction.guild?.members
    .fetch(user.id)
    .catch((error) => {
      logger.error(`Could not fetch member: ${JSON.stringify(error)}`);
      return null;
    });

  if (userData.ownedServers && userData.ownedServers.length > 0) {
    return {
      color: 0x0000ff,
      description: 'This is a Server Owner',
      fields: [
        {
          name: 'Owned Servers',
          value: userData.ownedServers
            .map(
              (server) =>
                `**${server.name}** - \`${server.players}/${server.maxPlayers}\``,
            )
            .join('\n\n'),
        },
      ],
    };
  }

  if (member?.roles.cache.has(environment.DISCORD_CONTENT_SQUAD_ROLE_ID)) {
    return {
      color: 0xe8a0bf,
      description: 'This user is a Content Squad Member',
    };
  }

  if (member?.roles.cache.has(environment.DISCORD_DEVELOPER_ROLE_ID)) {
    return {
      color: 0xffd700,
      description: 'This user is a Developer',
    };
  }

  return {
    color: 0xa020f0,
  };
}

export async function createUserEmbed(
  interaction: BaseInteraction,
  user: User,
  userData: KOCUser,
): Promise<EmbedBuilder> {
  const additionalInfo = await getAdditionalInfo(interaction, user, userData);
  const team = unwrapResult(await findTeamByUser(user), null);

  return new EmbedBuilder()
    .setTitle('User Stats')
    .setDescription(additionalInfo.description ?? null)
    .setColor(additionalInfo.color)
    .setThumbnail(user.avatarURL())
    .setTimestamp()
    .addFields([
      {
        name: 'Username',
        value: userData.username,
      },
      {
        name: 'Team',
        value: team !== null ? team.name : '-',
      },
      {
        name: 'Registered At',
        value: `<t:${moment(Date.parse(userData.registeredat)).unix()}>`,
      },
      {
        name: 'Last Login',
        value: `<t:${moment(Date.parse(userData.lastlogin)).unix()}>`,
      },
      ...(additionalInfo.fields ?? []),
    ]);
}
