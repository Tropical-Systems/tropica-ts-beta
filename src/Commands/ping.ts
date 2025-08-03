import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import miscConfig from "../config";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings Tropica."),

  async execute(interaction: CommandInteraction, client: Client) {
    const wsPing = client.ws.ping;
    await interaction.reply(`${miscConfig.emojis.pingpong} ${wsPing}ms`);
  },
};
