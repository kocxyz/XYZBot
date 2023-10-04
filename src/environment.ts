import { load } from 'ts-dotenv';

export const environment = load({
  BRAWLER_BASE_URL: String,

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

  DISCORD_CONTENT_SQUAD_ROLE_ID: String,
  DISCORD_DEVELOPER_ROLE_ID: String,
  DISCORD_LOG_BASEPATH: String,

  DISCORD_MAX_PARTICIPANTS_PER_EMBED: {
    type: Number,
    default: 5,
  },

  DISCORD_MESSAGE_UPDATE_INTERVAL: Number,

  // Twitch Credentials
  TWITCH_ID: String,
  TWITCH_SECRET: String,
  TWITCH_TRACKING_UPDATE_INTERVAL: Number,

  // Postgres URL
  DATABASE_URL: String,
});
