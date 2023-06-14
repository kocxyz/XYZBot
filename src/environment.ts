import { load } from 'ts-dotenv';

export const environment = load({
  DISCORD_BOT_CLIENT_ID: String,
  DISCORD_BOT_TOKEN: String,
  DISCORD_GUILD_ID: String,
  DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID: String,
  DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID: String,
  DISCORD_TOURNAMENT_ORGANIZER_ROLE_ID: String,
  DATABASE_URL: String
});
