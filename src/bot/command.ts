import { ChatInputCommandInteraction, Interaction, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder } from "discord.js"

type BaseDiscordCommand = {
  type: 'basic' | 'modal',
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
}

export type BasicDiscordCommand = BaseDiscordCommand & {
  type: 'basic',
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export type ModalDiscordCommand = BaseDiscordCommand & {
  type: 'modal',

  customId: string,
  createModal: (interaction: ChatInputCommandInteraction) => Promise<ModalBuilder>,
  onSubmission: (Interaction: ModalSubmitInteraction) => Promise<void>
}

export type DiscordCommand = BasicDiscordCommand | ModalDiscordCommand