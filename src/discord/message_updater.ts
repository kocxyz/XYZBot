import { Client } from "discord.js"

export type MessageUpdater<Parameters> = {
  update: (client: Client, params: Parameters) => Promise<void>
}