import { type Guild, type Client } from "discord.js";
import {
  handleGuildConfigCreation,
  handleGuildCreation,
  logGuildCreation,
} from "../Functions/misc-functions.js";

export default {
  event: "guildCreate",
  execute: async (guild: Guild, client: Client) => {
    await handleGuildCreation(guild);
    await handleGuildConfigCreation(guild.id);
    await logGuildCreation(guild, client);
  },
};
