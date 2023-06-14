import { load } from 'ts-dotenv';

export const environment = load({
  // Discord Credentials
  DISCORD_BOT_CLIENT_ID: String,
  DISCORD_BOT_TOKEN: String,
  DISCORD_GUILD_ID: String,

  // Discord Tournament IDs
  DISCORD_TOURNAMENT_ORGANIZER_CHANNEL_ID: String,
  DISCORD_TOURNAMENT_SIGNUP_CHANNEL_ID: String,
  DISCORD_TOURNAMENT_ORGANIZER_ROLE_ID: String,

  // Discord Server Status
  DISCORD_SERVER_STATUS_CHANNEL_ID: String,
  DISCORD_SERVER_STATUS_MESSAGE_ID: String,

  // Discord Stream Status
  DISCORD_TWITCH_STREAM_CHANNEL_ID: String,
  DISCORD_TWITCH_STREAM_MESSAGE_ID: String,
  DISCORD_TWITCH_STREAM_NOTIFICATION_ROLE_ID: String,

  // Twitch Credentials
  TWITCH_ID: String,
  TWITCH_SECRET: String,

  // Postgres URL
  DATABASE_URL: String
});
