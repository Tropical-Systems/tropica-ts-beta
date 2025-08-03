import config, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH, TROPICA_NBG_LOGO_PATH } from "../config";
import { EmbedBuilder } from "@discordjs/builders";
import {
  AttachmentBuilder,
  Client,
  CommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Replies with Tropica's information."),

  async execute(interaction: CommandInteraction, client: Client) {
    if (!client.readyTimestamp) {
      return await interaction.reply({
        content: "The bot is not ready yet. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const readySince = client.readyTimestamp / 1000;
    const serverSize = interaction.client.guilds.cache.size;
    const url = config.tropicaUrl;
    const guildId = interaction.guild!.id;
    const attachment = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });
    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const nonCircleLogo = new AttachmentBuilder(TROPICA_NBG_LOGO_PATH, {
      name: "tropica-logo-nbg.png",
    });

    const embed = new EmbedBuilder()
      .setTitle("Tropica Bot Information")
      .setAuthor({
        name: "Tropica",
        iconURL: "attachment://tropica-logo.png",
      })
      .setDescription(
        "**About**\nTropica is designed to be a versatile and helpfull bot to assist your design server."
      )
      .setFields([
        {
          name: "Bot Information",
          value: `**Version:** 1.0.1\n**Servers:** ${serverSize}\n**Online Since:** <t:${Math.floor(
            readySince
          )}:R>`,
          inline: true,
        },
        {
          name: "Links",
          value: `**[Dashboard](${url}{/dashboard/${guildId})\n[Support Server](${url}/support)\n[Invite Tropica](${url}/invite)\n[Get Premium](${url}/premium)**`,
          inline: true,
        },
      ])
      .setImage("attachment://tropica-banner.png")
      .setThumbnail("attachment://tropica-logo-nbg.png")
      .setFooter({
        text: `ID: ${config.clientId} | ${config.status}`,
        iconURL: "attachment://tropica-logo.png",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      files: [attachment, logo, nonCircleLogo],
      flags: MessageFlags.Ephemeral,
    });
  },
};
