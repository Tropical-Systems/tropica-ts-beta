import { type Guild, type Client } from "discord.js";
import {
  handleGuildConfigDeletion,
  handleGuildDeletion,
  logGuildDeletion,
} from "../Functions/misc-functions.js";

export default {
  event: "guildDelete",
  execute: async (guild: Guild, client: Client) => {
    await handleGuildConfigDeletion(guild.id);
    await handleGuildDeletion(guild.id);
    await logGuildDeletion(guild, client);
  },
};
