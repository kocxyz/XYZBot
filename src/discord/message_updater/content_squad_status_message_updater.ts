import { CSMember } from "@prisma/client";
import { environment } from "../../environment";
import { createContentSquadStatusEmbed } from "../embeds/content_squad/content_squad_status_embed";
import { MessageUpdater } from "../message_updater";
import { HelixStream } from "@twurple/api";

export const ContentSquadStatusMessageUpdater = {
  update: async (client, { members }) => {
    const channel = await client.channels.fetch(
      environment.DISCORD_TWITCH_STREAM_CHANNEL_ID
    );

    if (!channel) {
      console.error(`Could not find channel for content squad status messages!`);
      return;
    }

    if (!channel.isTextBased()) {
      console.error(`Channel for content squad status messages is not a Text Channel!`);
      return;
    }

    const message = await channel.messages.fetch(
      environment.DISCORD_TWITCH_STREAM_MESSAGE_ID
    ).catch(() => null);

    if (message === null || !message?.id) {
      await channel.send({
        embeds: [
          createContentSquadStatusEmbed(
            client.user!.avatarURL()!,
            members
          )
        ]
      });
      return;
    }

    await message.edit({
      embeds: [
        createContentSquadStatusEmbed(
          client.user!.avatarURL()!,
          members
        )
      ]
    });
  }
} satisfies MessageUpdater<{
  members: (CSMember & { streamData?: HelixStream | null })[]
}>