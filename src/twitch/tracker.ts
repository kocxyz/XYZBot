import { EventEmitter } from 'events';
import { AppTokenAuthProvider } from '@twurple/auth';
import { environment } from '../environment';
import { ApiClient, HelixStream } from '@twurple/api';
import { CSMember } from '@prisma/client';
import { prisma } from '../database/client';
import { createLogger } from '../logging';

const logger = createLogger('Twitch Client');

export class TwitchClient extends EventEmitter {
  // Auth Provider for Twitch
  private authProvider = new AppTokenAuthProvider(
    environment.TWITCH_ID,
    environment.TWITCH_SECRET,
  );
  // Api Client for Twitch
  private apiClient = new ApiClient({
    authProvider: this.authProvider,
  });
  // The Interval that check for stream updates
  private trackingInterval: NodeJS.Timer | undefined = undefined;
  // Users of the Content Squad
  public users: (CSMember & { streamData?: HelixStream | null })[] = [];

  /**
   * Start Tracking Streams
   */
  async startTracking(): Promise<void> {
    logger.info(`Start Tracking`);

    const handleUpdate = async () => {
      await this.updateCSMembers();
      this.updateStreamInformation();
    };

    await handleUpdate();
    this.trackingInterval = setInterval(
      handleUpdate,
      environment.TWITCH_TRACKING_UPDATE_INTERVAL,
    );
  }

  /**
   * Stop Tracking Streams
   */
  stopTracking(): void {
    logger.info(`Stop Tracking`);

    clearInterval(this.trackingInterval);
    this.trackingInterval = undefined;
  }

  private async updateCSMembers() {
    this.users = await prisma.cSMember.findMany({});
    logger.verbose(`Updated CS Members: ${JSON.stringify(this.users)}`);
  }

  /**
   * Update Stream information.
   *
   * Will emite `offline` and `live` events
   * with the respecive user when the status
   * changes.
   */
  private async updateStreamInformation(): Promise<void> {
    this.users = await Promise.all(
      this.users.map(async (user) => {
        const streamData = await this.getStreamData(user).catch(() => {
          logger.error(
            `Could not fetch Stream Data for user: ${user.twitchName}`,
          );
          return null;
        });

        // Stream data could not be retrieved
        // or streamer is not live.
        if (!streamData || streamData.type !== 'live' || streamData.gameId !== "1924769596") {
          if (user.live) {
            // User was previously live and switch to offline.
            // Let listeners know.
            this.emit('offline', user);

            // Update database entry
            await prisma.cSMember
              .update({
                where: { twitchName: user.twitchName },
                data: {
                  live: false,
                },
              })
              .catch((error: any) => {
                logger.error(
                  `Error updating CS Member: ${JSON.stringify(error)}`,
                );
              });
          }

          return {
            ...user,
            live: false,
          };
        }

        // If user wasn't live bevor
        if (!user.live && streamData.gameId === "1924769596") {
          // Let listeners know that they are live now.
          this.emit('live', user);

          // Update database entry
          await prisma.cSMember
            .update({
              where: { twitchName: user.twitchName },
              data: {
                live: true,
              },
            })
            .catch((error: any) => {
              logger.error(
                `Error updating CS Member: ${JSON.stringify(error)}`,
              );
            });
        }

        return {
          ...user,
          streamData,
          live: true,
        };
      }),
    );
  }

  /**
   * Get Streamer Data for a {@link CSMember}
   *
   * @param user The user to get the stream data for.
   *
   * @returns The Stream Data of the User
   */
  private async getStreamData(user: CSMember): Promise<HelixStream | null> {
    return this.apiClient.streams.getStreamByUserName(user.twitchName);
  }
}
