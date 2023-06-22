import { environment } from "../../environment";
import { createLogger } from "../../logging";
import { createServerStatusEmbed } from "../embeds/server_status_embed";
import { MessageUpdater } from "../message_updater";

const logger = createLogger('Server Status Message Updater')

export const ServerStatusMessageUpdater = {
  update: async (client) => {
    const channel = await client.channels.fetch(
      environment.DISCORD_SERVER_STATUS_CHANNEL_ID
    ).catch((error) => {
      logger.error(
        `Could not fetch Server Status Channel: ${JSON.stringify(error)}`
      );
      return null;
    });

    if (!channel) {
      logger.error(`Could not find channel for server status messages!`);
      return;
    }

    if (!channel.isTextBased()) {
      logger.error(`Channel for server status messages is not a Text Channel!`);
      return;
    }

    const message = await channel.messages.fetch(
      environment.DISCORD_SERVER_STATUS_MESSAGE_ID
    ).catch((error) => {
      logger.error(
        `Could not fetch messages from Server Status Channel: ${JSON.stringify(error)}`
      );
    });

    if (!message?.id) {
      await channel.send({
        embeds: [
          await createServerStatusEmbed(client.user!.avatarURL()!)
        ]
      }).catch((error) => {
        logger.error(
          `Could not send Server Status message: ${JSON.stringify(error)}`
        );
      });
      return;
    }

    await message.edit({
      embeds: [
        await createServerStatusEmbed(client.user!.avatarURL()!)
      ]
    }).catch((error) => {
      logger.error(
        `Could not edit Server Status message: ${JSON.stringify(error)}`
      );
    });
  }
} satisfies MessageUpdater<void>