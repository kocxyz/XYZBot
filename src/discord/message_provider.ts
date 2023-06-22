import { BaseInteraction, InteractionReplyOptions, InteractionResponse, Message, MessageCreateOptions } from "discord.js"
import { createLogger } from "../logging";

export type CollectorFunction<CollectorParameters> = (message: Message | InteractionResponse, params: CollectorParameters) => Promise<void>;

export type MessageProvider<CreateParameters, CollectorParameters> = {
  createMessage: (params: CreateParameters) => Promise<MessageCreateOptions>
  collector: CollectorFunction<CollectorParameters>
}

const logger = createLogger('Message Provider');

export function reply(
  interaction: BaseInteraction,
  options: InteractionReplyOptions,
): Promise<Message | InteractionResponse<boolean> | null> {
  if (!interaction.isRepliable()) {
    return Promise.resolve(null);
  }

  const message = !interaction.replied
    ? interaction.reply(options)
    : interaction.followUp(options);

  return message.catch((error) => {
    logger.error(
      `An error occured when sending a reply: ${JSON.stringify(error)}`
    );
    return null;
  });
}