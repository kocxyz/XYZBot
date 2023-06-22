import { CSMember } from "@prisma/client";
import { HelixStream } from "@twurple/api";
import { Client, TextBasedChannel } from "discord.js";
import { environment } from "../../environment";
import { createContentSquadLiveEmbed } from "../embeds/content_squad/content_squad_live_embed";
import { createLogger } from "../../logging";

const logger = createLogger('Twitch Tracking Handler')

async function getTwitchStreamChannel(
  client: Client
): Promise<TextBasedChannel | null> {
  const channel = await client.channels.fetch(
    environment.DISCORD_TWITCH_STREAM_CHANNEL_ID
  ).catch((error) => {
    logger.error(`Could not fetch Twitch Stream Channel: ${JSON.stringify(error)}`);
    return null;
  });

  if (!channel) {
    logger.error(`Could not find channel for stream status updates.`);
    return null;
  }

  if (!channel.isTextBased()) {
    logger.error(`Steam status update channel is not a Text Channel!`);
    return null;
  }

  return channel;
}


export async function handleTrackerGoLive(
  client: Client,
  member: (CSMember & { streamerData?: HelixStream | null })
): Promise<void> {
  logger.info(`${member.twitchName} just went live!`)

  const user = await client.users.fetch(member.discordId)
  const channel = await getTwitchStreamChannel(client)
    .catch(() => null)

  await channel?.send({
    content: `<@${environment.DISCORD_TWITCH_STREAM_NOTIFICATION_ROLE_ID}>`,
    embeds: [createContentSquadLiveEmbed(user, member)]
  }).catch((error) => {
    logger.error(`Could not send Content Squad Stream Notification message: ${JSON.stringify(error)}`)
  });
}

export async function handleTrackerGoOffline(
  client: Client,
  member: (CSMember & { streamerData?: HelixStream | null })
): Promise<void> {
  logger.info(`${member.twitchName} just went offline!`)

  const channel = await getTwitchStreamChannel(client)
    .catch(() => null)

  const messages = await channel?.messages.fetch({ limit: 100 })
    .catch((error) => {
      logger.error(`Could not fetch messages from Twitch Stream Channel: ${JSON.stringify(error)}`);
    }) ?? []

  for (const message of messages.values()) {
    if (
      message.author.id == client.user!.id &&
      message.embeds.length > 0 &&
      message.embeds[0].author!.name == member.twitchName
    ) {
      await message.delete()
        .catch((error) => {
          logger.error(`Could not delete Content Squad Stream Notification message: ${JSON.stringify(error)}`)
        });
    }
  }
}