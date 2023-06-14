import { InteractionResponse, Message, MessageCreateOptions } from "discord.js"

export type MessageProvider<CreateParameters, CollectorParameters> = {
  createMessage: (params: CreateParameters) => Promise<MessageCreateOptions>
  collector: (message: Message | InteractionResponse, params: CollectorParameters) => Promise<void>
}