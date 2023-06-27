import {
  BaseInteraction,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessageCreateOptions,
} from 'discord.js';
import { createLogger } from '../logging';
import { FailureResult } from '../result';

export type CollectorFunction<CollectorParameters> = (
  message: Message | InteractionResponse,
  params: CollectorParameters,
) => Promise<void>;

export type MessageProvider<CreateParameters, CollectorParameters> = {
  createMessage: (params: CreateParameters) => Promise<MessageCreateOptions>;
  collector: CollectorFunction<CollectorParameters>;
};

const logger = createLogger('Message Provider');

export async function reply(
  interaction: BaseInteraction,
  options: InteractionReplyOptions,
): Promise<Message | InteractionResponse<boolean> | null> {
  if (!interaction.isRepliable()) {
    return Promise.resolve(null);
  }

  const message = !interaction.replied
    ? interaction.reply(options)
    : interaction.followUp(options);

  return await message.catch((error) => {
    logger.error(
      `An error occured when sending a reply: ${JSON.stringify(error)}`,
    );
    return null;
  });
}

export function replyError(
  interaction: BaseInteraction,
): Promise<Message | InteractionResponse<boolean> | null> {
  return reply(interaction, {
    content: 'An error occured. We are sorry 😔',
    ephemeral: true,
  }).catch((error) => {
    logger.error(
      `An error occured when sending a reply: ${JSON.stringify(error)}`,
    );
    return null;
  });
}

export function replyErrorFromResult(
  interaction: BaseInteraction,
  result: FailureResult<unknown>,
): Promise<Message | InteractionResponse<boolean> | null> {
  switch (result.error) {
    case 'internal':
      return replyError(interaction);

    default:
      return reply(interaction, {
        content: result.message,
        ephemeral: true,
      });
  }
}
