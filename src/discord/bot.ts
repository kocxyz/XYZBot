import type { DiscordCommand } from './command';
import type { ModalHandler } from './modal_handler';
import {
  BaseInteraction,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { environment } from '../environment';
import * as Commands from './commands';
import { handleCommand, handleModal } from './event_handler';
import { findTournaments } from '../services/tournament';
import { TournamentOrganizerMessageProvider } from './message_provider/tournament/organize/tournament_organizer_message_provider';
import { TournamentSignupMessageProvider } from './message_provider/tournament/signup/tournament_signup_message_provider';
import { TwitchClient as TwitchTracker } from '../twitch/tracker';
import { handleTrackerGoOffline } from './event_handler/handle_tracker';
import { ContentSquadStatusMessageUpdater } from './message_updater/content_squad_status_message_updater';
import { ServerStatusMessageUpdater } from './message_updater/server_status_message_updater';
import { PermanentCollector } from './permanent_collector';
import { createLogger } from '../logging';
import { getMatchesForEmbedsWithDiscordId } from '../services/match';
import { TournamentMatchOrganizerMessageProvider } from './message_provider/tournament/organize/tournament_match_organizer_message_provider';

const logger = createLogger('Discord Bot');

export class DiscordBot {
  // Create a new client instance
  private client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // A Tracker for twitch events
  private twitchTracker = new TwitchTracker();

  // Collection of commands known to the Bot
  private commands = new Collection<string, DiscordCommand>();

  // Collection of modal handlers known to the Bot
  private modalHandlers = new Collection<string, ModalHandler>();

  constructor() {
    this.client.once(Events.ClientReady, (c) => {
      logger.info(`Ready! Logged in as ${c.user.tag}`);

      this.registerTrackerHandlers();
      this.twitchTracker.startTracking();

      this.registerMessageUpdaters();
      this.restoreCollectors();
    });

    this.registerCommands();
    this.registerEventHandlers();
  }

  private registerMessageUpdaters() {
    const handleUpdates = () => {
      ContentSquadStatusMessageUpdater.update(this.client, {
        members: this.twitchTracker.users,
      });

      ServerStatusMessageUpdater.update(this.client);
    };

    setInterval(handleUpdates, environment.DISCORD_MESSAGE_UPDATE_INTERVAL);

    handleUpdates();
  }

  private registerTrackerHandlers(): void {
    this.twitchTracker.on('live', (member) =>
      handleTrackerGoOffline(this.client, member),
    );

    this.twitchTracker.on('offline', (member) =>
      handleTrackerGoOffline(this.client, member),
    );
  }

  private registerCommands(): void {
    logger.info(`Registering command handlers...`);
    this.commands.clear();

    Object.values(Commands).forEach((command) => {
      logger.verbose(`Registering command handler for '${command.data.name}'`);

      switch (command.type) {
        case 'basic':
          this.commands.set(command.data.name, command);
          break;

        // case 'modal':
        //   this.commands.set(command.data.name, command)
        //   this.modalHandlers.set(command.customId, command)
        //   break;
      }
    });
  }

  private registerEventHandlers(): void {
    logger.info(`Registering event handlers...`);
    this.client.on(
      Events.InteractionCreate,
      async (interaction: BaseInteraction) => {
        if (interaction.isChatInputCommand()) {
          logger.verbose(`Got ChatInputCommand Interaction: ${interaction.id}`);
          return await handleCommand(this.commands, interaction);
        }

        if (interaction.isModalSubmit()) {
          logger.verbose(`Got ModalSubmit Interaction: ${interaction.id}`);
          return await handleModal(this.modalHandlers, interaction);
        }

        if (interaction.isMessageComponent()) {
          logger.verbose(`Got MessageComponent Interaction: ${interaction.id}`);
          return PermanentCollector.emitCollect(
            interaction.message,
            interaction,
          );
        }
      },
    );
  }

  private async restoreCollectors() {
    logger.info(`Restoring collectors...`);
    const organizerChannel = await this.client.channels.fetch(
      environment.DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID,
    );

    const signupsChannel = await this.client.channels.fetch(
      environment.DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID,
    );

    const tournamentsResult = await findTournaments();
    if (tournamentsResult.type === 'error') {
      logger.error(`Could not find Tournaments: ${tournamentsResult.message}`);
      return;
    }

    tournamentsResult.data.forEach(async (tournament) => {
      if (
        organizerChannel &&
        organizerChannel.isTextBased() &&
        tournament.discordOrganizerMessageId !== null
      ) {
        try {
          const message = await organizerChannel.messages.fetch(
            tournament.discordOrganizerMessageId,
          );

          await TournamentOrganizerMessageProvider.collector(message, {
            tournament,
          });

          logger.info(
            `Setup collector for Organizer Message: '${tournament.title}'`,
          );
        } catch (e: any) {
          logger.error(`(${tournament.title}): ${e.message}`);
        }
      }

      if (
        signupsChannel &&
        signupsChannel.isTextBased() &&
        tournament.discordSingupMessageId !== null
      ) {
        try {
          const message = await signupsChannel.messages.fetch(
            tournament.discordSingupMessageId,
          );

          await TournamentSignupMessageProvider.collector(message, {
            tournament,
          });

          logger.info(
            `Setup collector for Signups Message: '${tournament.title}'`,
          );
        } catch (e: any) {
          logger.error(`(${tournament.title}): ${e.message}`);
        }
      }
    });

    const matchesResult = await getMatchesForEmbedsWithDiscordId();
    if (matchesResult.type === 'error') {
      logger.error(`Could get Matches for embeds to restore collectors.`);
      return;
    }

    matchesResult.data.forEach(async (match) => {
      if (
        organizerChannel &&
        organizerChannel.isTextBased() &&
        match.discordMessageId !== null
      ) {
        try {
          const message = await organizerChannel.messages.fetch(
            match.discordMessageId,
          );

          await TournamentMatchOrganizerMessageProvider.collector(message, {
            match,
          });

          logger.info(
            `Setup collector for Organizer Match Message: '${match.id}'`,
          );
        } catch (e: any) {
          logger.error(e.message);
        }
      }
    });
  }

  async connect() {
    // Log in to Discord with your client's token
    await this.client.login(environment.DISCORD_BOT_TOKEN);
  }
}
