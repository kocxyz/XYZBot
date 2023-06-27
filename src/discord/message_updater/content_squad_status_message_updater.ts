import { CSMember } from '@prisma/client';
import { environment } from '../../environment';
import { createContentSquadStatusEmbed } from '../embeds/content_squad/content_squad_status_embed';
import { MessageUpdater } from '../message_updater';
import { HelixStream } from '@twurple/api';
import { createLogger } from '../../logging';

const logger = createLogger('Content Squad Status Message Updater');

export const ContentSquadStatusMessageUpdater = {
  update: async (client, { members }) => {
    const channel = await client.channels
      .fetch(environment.DISCORD_TWITCH_STREAM_CHANNEL_ID)
      .catch((error) => {
        logger.error(
          `Could not fetch Twitch Stream Channel: ${JSON.stringify(error)}`,
        );
        return null;
      });

    if (!channel) {
      logger.error(`Could not find channel for content squad status messages!`);
      return;
    }

    if (!channel.isTextBased()) {
      logger.error(
        `Channel for Content Squad status messages is not a Text Channel!`,
      );
      return;
    }

    const message = await channel.messages
      .fetch(environment.DISCORD_TWITCH_STREAM_MESSAGE_ID)
      .catch((error) => {
        logger.error(
          `Could not fetch messages from Twitch Stream Channel: ${JSON.stringify(
            error,
          )}`,
        );
      });

    if (!message?.id) {
      await channel
        .send({
          embeds: [
            createContentSquadStatusEmbed(client.user!.avatarURL()!, members),
          ],
        })
        .catch((error) => {
          logger.error(
            `Could not send Twitch Stream status message: ${JSON.stringify(
              error,
            )}`,
          );
        });
      return;
    }

    await message
      .edit({
        embeds: [
          createContentSquadStatusEmbed(client.user!.avatarURL()!, members),
        ],
      })
      .catch((error) => {
        logger.error(
          `Could not edit Twitch Stream status message: ${JSON.stringify(
            error,
          )}`,
        );
      });
  },
} satisfies MessageUpdater<{
  members: (CSMember & { streamData?: HelixStream | null })[];
}>;
