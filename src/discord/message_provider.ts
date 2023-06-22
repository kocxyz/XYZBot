import { InteractionResponse, Message, MessageCreateOptions } from "discord.js"

export type CollectorFunction<CollectorParameters> = (message: Message | InteractionResponse, params: CollectorParameters) => Promise<void>;

export type MessageProvider<CreateParameters, CollectorParameters> = {
  createMessage: (params: CreateParameters) => Promise<MessageCreateOptions>
  collector: CollectorFunction<CollectorParameters>
}