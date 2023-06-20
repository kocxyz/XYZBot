import { environment } from "../../environment";
import { createServerStatusEmbed } from "../embeds/server_status_embed";
import { MessageUpdater } from "../message_updater";

export const ServerStatusMessageUpdater = {
  update: async (client) => {
    const channel = await client.channels.fetch(
      environment.DISCORD_SERVER_STATUS_CHANNEL_ID
    );

    if (!channel) {
      console.error(`Could not find channel for server status messages!`);
      return;
    }

    if (!channel.isTextBased()) {
      console.error(`Channel for server status messages is not a Text Channel!`);
      return;
    }

    const message = await channel.messages.fetch(
      environment.DISCORD_SERVER_STATUS_MESSAGE_ID
    ).catch(() => null);

    if (message === null || !message.id) {
      await channel.send({
        embeds: [
          await createServerStatusEmbed(client.user!.avatarURL()!)
        ]
      });
      return;
    }

    await message.edit({
      embeds: [
        await createServerStatusEmbed(client.user!.avatarURL()!)
      ]
    });
  }
} satisfies MessageUpdater<void>