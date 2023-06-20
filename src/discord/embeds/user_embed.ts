import { APIEmbedField, EmbedBuilder, User } from "discord.js";
import { KOCUser } from "knockoutcity-auth-client";
import moment from "moment";
import { findTeamByUser } from "../../services/team";

function getAdditionalInfo(
  user: User,
  userData: KOCUser,
): {
  color: number,
  description?: string,
  fields?: APIEmbedField[]
} {
  if (userData.ownedServers && userData.ownedServers.length > 0) {
    return {
      color: 0x0000FF,
      description: 'This user owns servers',
      fields: [{
        name: "Owned Servers",
        value: userData.ownedServers.map(server => `**${server.name}** - \`${server.players}/${server.maxPlayers}\``).join("\n\n")
      }],
    };
  }

  if (
    user.id === '579609384808873984' ||
    user.id === '127455308359532544'
  ) {
    return {
      color: 0xFFD700,
      description: 'This user is a developer',
    };
  }

  return {
    color: 0xA020F0
  };
}

export async function createUserEmbed(
  user: User,
  userData: KOCUser,
) {
  const additionalInfo = getAdditionalInfo(user, userData);
  const team = await findTeamByUser(user)

  return new EmbedBuilder()
    .setTitle("User Stats")
    .setDescription(additionalInfo.description ?? null)
    .setColor(additionalInfo.color)
    .setThumbnail(user.avatarURL())
    .setTimestamp()
    .addFields([
      {
        name: "Username",
        value: userData.username
      },
      {
        name: "Team",
        value: team !== null
          ? team.name
          : '-'
      },
      {
        name: "Registered At",
        value: `<t:${moment(Date.parse(userData.registeredat)).unix()}>`
      },
      {
        name: "Last Login",
        value: `<t:${moment(Date.parse(userData.lastlogin)).unix()}>`
      },
      ...additionalInfo.fields ?? [],
    ]);
}