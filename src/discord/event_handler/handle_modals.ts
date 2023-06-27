import { Collection, ModalSubmitInteraction } from 'discord.js';
import { ModalHandler } from '../modal_handler';

export async function handleModal(
  modalHandlers: Collection<string, ModalHandler>,
  interaction: ModalSubmitInteraction,
) {
  const modalHandler = modalHandlers.get(interaction.customId);

  if (!modalHandler) {
    console.error(
      `No modalHandler matching ${interaction.customId} was found.`,
    );
    return;
  }

  try {
    await modalHandler.onSubmission(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
}
