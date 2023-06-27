import { EmbedBuilder } from 'discord.js';
import { DEFAULT_AUTH_URL, getServers } from 'knockoutcity-auth-client';

export async function createServerStatusEmbed(avatarURL: string) {
  const servers = await getServers(DEFAULT_AUTH_URL);

  return new EmbedBuilder()
    .setColor(0x06b5c2)
    .setTitle('KoCity Servers')
    .setDescription(
      servers.data
        .map(
          (server) =>
            `${server.status == 'online' ? '🟢' : '🔴'} **${
              server.name
            }** - \`${server.region}\` - \`${server.players}/${
              server.maxPlayers
            }\``,
        )
        .join('\n\n'),
    )
    .setThumbnail(avatarURL)
    .setTimestamp();
}
