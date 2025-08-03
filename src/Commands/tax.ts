import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  Client,
} from "discord.js";
import { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config";
import ServerConfig from "../Models/Config";
import { taxPrice } from "../Functions/misc-functions";
import miscConfig from "../config";
import { CInteractionNotInGuild } from "../Functions/interactionReturns";

export default {
  data: new SlashCommandBuilder()
    .setName("tax")
    .setDescription("Calculate the correct price with tax.")
    .addNumberOption((option) =>
      option
        .setName("price")
        .setDescription("The price before tax.")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    if (!interaction.guild) return await CInteractionNotInGuild(interaction);

    const price = interaction.options.getNumber("price");

    const attachment = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });
    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    if (price === null || price < 0) {
      return interaction.reply({
        content: `${miscConfig.emojis.customize} Please provide a valid price greater than or equal to 0.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const hasGuildIcon = !!interaction.guild?.iconURL();
    const files = [];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.guild?.name !== null ? interaction.guild.name : "Tropica"
          }'s Tax Calculator`,
        iconURL: hasGuildIcon
          ? (interaction.guild.iconURL() as string | undefined)
          : "attachment://tropica-logo.png",
      })
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    const config = await ServerConfig.findOne({
      guildId: interaction.guild.id,
    });

    if (!hasGuildIcon) files.push(logo);


    if (config && config.taxRate) {
      const tax = taxPrice(price, config.taxRate);
      embed.addFields([
        {
          name: `${miscConfig.emojis.dollar} Final Price`,
          value: `\`\`\`${tax}\`\`\``,
        },
        {
          name: `${miscConfig.emojis.filleddollar} Original Price`,
          value: `\`\`\`${price.toFixed(
            0
          )}\`\`\`\n\n-# **Note:** Tropica already applies a standard 30% tax to all prices to counteract the Roblox tax.`,
        },
      ]);
    } else {
      const taxRate = config && config.taxRate ? config.taxRate : 1.0;
      const tax = taxPrice(price, taxRate);
      embed.addFields([
        {
          name: `${miscConfig.emojis.dollar} Final Price`,
          value: `\`\`\`${tax}\`\`\``,
        },
        {
          name: `${miscConfig.emojis.filleddollar} Original Price`,
          value: `\`\`\`${price.toFixed(
            0
          )}\`\`\`\n\n-# **Note:** Tropica already applies a standard 30% tax to all prices to counteract the Roblox tax.`,
        },
      ]);
    }

    if (config && config.bannerUrl && config.color) {
      embed.setColor(`#${config.color || "000000"}`);
      embed.setImage(config.bannerUrl || "");
    } else if (config && config.bannerUrl && !config.color) {
      embed.setImage(config.bannerUrl || "");
      embed.setColor("#000000");
    } else if (config && !config.bannerUrl && config.color) {
      embed.setColor(`#${config.color || "000000"}`);
      embed.setImage("attachment://tropica-banner.png");
      files.push(attachment);
    } else {
      embed.setColor("#000000");
      embed.setImage("attachment://tropica-banner.png");
      files.push(attachment);
    }

    await interaction.reply({
      embeds: [embed],
      files,
    });
  },
};
