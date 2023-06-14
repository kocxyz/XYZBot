import { load } from 'ts-dotenv';

export const environment = load({
  DISCORD_BOT_CLIENT_ID: String,
  DISCORD_BOT_TOKEN: String,
  DISCORD_GUILD_ID: String,
  DISCORD_ORGANIZER_CHANNEL_ID: String,
  DISCORD_SIGNUP_CHANNEL_ID: String,
  DISCORD_ORGANIZER_ROLE_ID: String
});
