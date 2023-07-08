import { DiscordBot } from './discord/bot';
import { createLogger } from './logging';

const logger = createLogger('Root');

const bot = new DiscordBot();
bot.connect();

process.on('uncaughtException', function (err) {
  logger.error(JSON.stringify(err));
});

process.on('unhandledRejection', function (err) {
  logger.error(JSON.stringify(err));
});
