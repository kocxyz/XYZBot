import { ChatInputCommandInteraction, Collection } from 'discord.js';
import { DiscordCommand } from '../command';
import { createLogger } from '../../logging';

const logger = createLogger('Command Handler');

export async function handleCommand(
  commands: Collection<string, DiscordCommand>,
  interaction: ChatInputCommandInteraction,
) {
  const command = commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    switch (command.type) {
      case 'basic':
        await command.execute(interaction);
        break;

      case 'modal':
        await interaction.showModal(await command.createModal(interaction));
        break;
    }
  } catch (error) {
    logger.error(`An error occured: ${JSON.stringify(error)}`);

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
