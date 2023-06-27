import {
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
} from 'discord.js';

export type ModalHandler = {
  customId: string;
  /**
   * The handler function that handles the
   * modal submission for the created modal.
   *
   * @param interaction
   * @returns
   */
  onSubmission: (interaction: ModalSubmitInteraction) => Promise<void>;
  /**
   * Create a Modal that can be handled by this handler.
   *
   * @param interaction
   * @returns
   */
  createModal: (
    interaction: ChatInputCommandInteraction,
  ) => Promise<ModalBuilder>;
};
