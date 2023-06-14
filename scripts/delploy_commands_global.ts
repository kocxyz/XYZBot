import type { DiscordCommand } from '../src/bot/command'
import { Collection, REST, Routes } from 'discord.js'
import { environment } from '../src/environment'
import * as Commands from '../src/bot/commands'

const commands = new Collection<string, DiscordCommand>()
Object.values(Commands).forEach((command) => {
  commands.set(command.data.name, command)
})

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(environment.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${commands.size} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(
        environment.DISCORD_BOT_CLIENT_ID,
      ),
      {
        body: commands.map(command => {
          return command.data
        })
      },
    );

    if (
      typeof data === 'object' &&
      data !== null &&
      'length' in data
    ) {
      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    }
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();