import { CSMember } from "@prisma/client";
import { HelixStream } from "@twurple/api";
import { Client } from "discord.js";
import { environment } from "../../environment";
import { createContentSquadLiveEmbed } from "../embeds/content_squad/content_squad_live_embed";

export async function handleTrackerGoLive(
  client: Client,
  member: (CSMember & { streamerData?: HelixStream | null })
) {
  console.log(`${member.twitchName} just went live!`)

  const user = await client.users.fetch(member.discordId)
  const channel = await client.channels.fetch(
    environment.DISCORD_TWITCH_STREAM_CHANNEL_ID
  );

  if (!channel) {
    console.error(`Could not find channel for stream status updates.`);
    return;
  }

  if (!channel.isTextBased()) {
    console.error(`Steam status update channel is not a Text Channel!`);
    return;
  }

  await channel.send({
    content: `<@${environment.DISCORD_TWITCH_STREAM_NOTIFICATION_ROLE_ID}>`,
    embeds: [createContentSquadLiveEmbed(user, member)]
  });
}

export async function handleTrackerGoOffline(
  client: Client,
  member: (CSMember & { streamerData?: HelixStream | null })
) {
  console.log(`${member.twitchName} just went offline!`)

  const channel = await client.channels.fetch(
    environment.DISCORD_TWITCH_STREAM_CHANNEL_ID
  );

  if (!channel) {
    console.error(`Could not find channel for stream status updates.`);
    return;
  }

  if (!channel.isTextBased()) {
    console.error(`Steam status update channel is not a Text Channel!`);
    return;
  }

  const messages = await channel.messages.fetch({ limit: 100 })

  for (const message of messages.values()) {
    if (
      message.author.id == client.user!.id &&
      message.embeds.length > 0 &&
      message.embeds[0].author!.name == member.twitchName
    ) {
      message.delete();
    }
  }
}