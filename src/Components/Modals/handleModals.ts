import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  ModalSubmitInteraction,
  NewsChannel,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import config, { TROPICA_LOGO_PATH } from "../../config.js";
import ServerConfig from "../../Models/Config.js";
import { taxPrice } from "../../Functions/misc-functions.js";
import ExcludedGuilds from "../../Models/ExcludedGuilds.js";

export default {
  customId: "t",

  async execute(interaction: ModalSubmitInteraction) {

    if (!interaction.guild) {
      return await interaction.reply({
        content: `${config.emojis.alerttriangle} This command can only be used in a server.`,
        flags: MessageFlags.Ephemeral,
      })
    }
    const guildID = interaction.guild!.id;
    if (!guildID) return;

    const executor = interaction.member as GuildMember;

    if (interaction.guild.ownerId !== executor.id && !executor.permissions.has(PermissionFlagsBits.ManageGuild, true)) {
      return await interaction.reply({
        content: `${config.emojis.alerttriangle} Insufficient permissions to use this modal.`,
        flags: MessageFlags.Ephemeral,
      })
    }

    const attachment = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    if (interaction.customId.includes("t-exclusionModal.reason")) {
      return await handleExclusionModalInput(interaction);
    }

    switch (interaction.customId) {
      case "t-basic-info-modal.color":
        await handleColorChanges(interaction, attachment, guildID);
        break;
      case "t-basic-info-modal.image":
        await handleImageChanges(interaction, attachment, guildID);
        break;
      case "t-basic-info-modal.tax":
        await handleTaxInputChange(interaction, attachment, guildID);
        break;
    }
  },
};


async function handleExclusionModalInput(interaction: ModalSubmitInteraction) {
  const guildId = interaction.customId.split(".")[2];
  let reason: string;
  try {
    reason = interaction.fields.getTextInputValue("t-exclusionModal.reasonInput");
  } catch (err) {
    console.error("Failed to get modal input:", err);
    return interaction.reply({
      content: "❌ Something went wrong reading your input.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!reason || reason.length < 10) {
    return interaction.reply({
      content: `${config.emojis.alerttriangle} Please provide a valid reason for excluding this guild (minimum 10 characters).`,
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } catch (err) {
    console.error("Failed to defer reply:", err);
    return;
  }

  if (interaction.guild && interaction.guild.id !== config.tropica_main_id)
    return await interaction.editReply("goes wrong here");

  const member = interaction.member as GuildMember;
  if (!member.roles.cache.has(config.executive_team_role_id) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.editReply({
      content: `${config.emojis.alerttriangle} You do not have permission to exclude guilds.`,
    });
  }

  const alreadyExcluded = await ExcludedGuilds.findOne({ guildId: guildId });
  if (alreadyExcluded) {
    return interaction.editReply({
      content: `${config.emojis.alerttriangle} This guild is already excluded.`,
    });
  }

  const excludedGuild = await interaction.client.guilds.fetch(guildId).catch(() => null);

  try {
    const newExclusion = new ExcludedGuilds({ guildId, reason });
    await newExclusion.save();
  } catch (err) {
    console.error("Error while constructing/saving exclusion:", err);
    return interaction.editReply({
      content: `${config.emojis.alerttriangle} Failed to construct/save exclusion: ${err}`,
    });
  }


  let ownerNotified = true;
  if (excludedGuild) {
    const firstTextBased = excludedGuild.channels.cache.find(
      (c): c is TextChannel | NewsChannel =>
        (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
        c.permissionsFor(excludedGuild.members.me!)?.has(PermissionFlagsBits.SendMessages)
    );
    if (firstTextBased) {
      const embed = new EmbedBuilder()
        .setTitle("Tropica | Guild Excluded")
        .setDescription(
          `Dear <@${excludedGuild.ownerId}>,\n\nWe regret to inform you that your server, **${excludedGuild.name}**, has been excluded from using Tropica's services.\n\n**Reason for Exclusion:**\n${reason}\n\nIf you believe this decision was made in error or if you have any questions, please feel free to contact our support team via the invite in my bio.\n\n-# I will now kick myself from this server.\n\nBest regards,\nThe Tropica Team`
        )
        .setColor("#FF0000")
        .setFooter({
          text: `Tropica | Powered by Tropica`,
          iconURL: interaction.client.user?.displayAvatarURL() ?? undefined,
        })
        .setAuthor({
          name: "Tropica",
          iconURL: interaction.client.user?.displayAvatarURL() ?? undefined,
        })
        .setTimestamp();

      try {
        await firstTextBased.send({ content: `<@${excludedGuild.ownerId}>`, embeds: [embed] });
        await excludedGuild.leave();
      } catch (err) {
        ownerNotified = false;
      }
    }
  }

  return interaction.editReply({
    content: ownerNotified
      ? `${config.emojis.checkemoji} Successfully excluded the guild (ID: \`${guildId}\`).`
      : `${config.emojis.checkemoji} Successfully excluded the guild (ID: \`${guildId}\`), but I was unable to send a message to the server owner.`,
  });
}



async function handleTaxInputChange(
  interaction: ModalSubmitInteraction,
  attachment: AttachmentBuilder,
  guildID: string
) {
  const taxInput = interaction.fields.getTextInputValue("t-basic-info.tax");
  const taxPercent = await isValidTaxInput(taxInput);
  if (taxPercent !== null) {
    const taxMutiplier = 1 + taxPercent / 100;

    try {
      await ServerConfig.findOneAndUpdate(
        { guildId: guildID },
        { taxRate: taxMutiplier },
        { new: true, upsert: true }
      );
      const tax = taxPrice(100, taxMutiplier);

      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Tax Updated")
            .setDescription(`The tax rate has been updated to ${taxPercent}%.`)
            .setFields([
              {
                name: "Example Calculation",
                value: `If the price is \`100\` robux, the final price with tax will be \`${tax}\` robux.\n\n-# Tropica standardly applies a tax of \`30%\` to all prices, to counteract the Roblox tax. This tax rate only applies **after** applying a servers custom tax rate.`,
              },
            ])
            .setFooter({
              text: `Tropica Configuration Panel | Powered by Tropica`,
              iconURL: "attachment://tropica-logo.png",
            }),
        ],
        files: [attachment],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.warn(
        `[System | Modal]: Error updating tax in guild ${guildID}: ${err}`
      );
      await interaction.reply({
        content: `There was an error updating the tax. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
      setTimeout(() => interaction.deleteReply(), 5000);
      return;
    }
  } else {
    try {
      await ServerConfig.findOneAndUpdate(
        { guildId: guildID },
        { taxRate: 1.0 },
        { new: true, upsert: true }
      );
      const tax = (100 * 1.0) / 0.7;
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Tax Reset")
            .setDescription(
              `${interaction.guild!.name
              }'s tax rate has been reset to the default value of \`0%\`. Tropica's standard tax of \`30%\` will still be applied.`
            )
            .setFields([
              {
                name: "Example Calculation",
                value: `If the price is \`100\` robux, the final price with tax will be \`${tax.toFixed(
                  0
                )}\` robux.`,
              },
            ])
            .setFooter({
              text: `Tropica Configuration Panel | Powered by Tropica`,
              iconURL: "attachment://tropica-logo.png",
            }),
        ],
        files: [attachment],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.warn(
        `[System | Modal]: Error resetting tax in guild ${guildID}: ${err}`
      );
      await interaction.reply({
        content: `There was an error resetting the tax. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
      setTimeout(() => interaction.deleteReply(), 5000);
      return;
    }
  }
}

function isValidTaxInput(input: string): number | null {
  const trimmed = input.trim();
  const withoutPercent = trimmed.replace(/%/g, "");

  const cleaned = withoutPercent.split(",")[0];

  if (!/^\d{1,3}$/.test(cleaned)) return null;

  const number = Number(cleaned);

  if (isNaN(number) || number < 0 || number > 100) return null;

  return number;
}

function normaliseHexInput(input: string): string | null {
  let hex = input.trim().replace(/^#/, "");
  hex = hex.slice(0, 6).toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(hex)) return null;
  return hex;
}

async function handleImageChanges(
  interaction: ModalSubmitInteraction,
  attachment: AttachmentBuilder,
  guildID: string
) {
  try {
    const url = interaction.fields.getTextInputValue("t-basic-info.image");
    if (!url) {
      try {
        await ServerConfig.findOneAndUpdate(
          { guildId: guildID },
          { bannerUrl: null },
          { new: true, upsert: true }
        );
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Banner Removed")
              .setDescription(
                `Tropica's banner has been removed for your server.`
              )
              .setFooter({
                text: `Tropica Configuration Panel | Powered by Tropica`,
                iconURL: "attachment://tropica-logo.png",
              }),
          ],
          files: [attachment],
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        console.error(
          `[System | Modal]: Error removing banner in guild ${guildID}: ${err}`
        );
        return await interaction.reply({
          content: `There was an error removing the banner. Please try again later.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    const image = await validateImageUrl(url);

    try {
      await ServerConfig.findOneAndUpdate(
        { guildId: guildID },
        { bannerUrl: url },
        { new: true, upsert: true }
      );
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Banner Updated")
            .setDescription(
              `Tropica's banner has been updated for your server.`
            )
            .setImage(url)
            .setFooter({
              text: `Tropica Configuration Panel | Powered by Tropica`,
              iconURL: "attachment://tropica-logo.png",
            }),
        ],
        files: [attachment],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error(
        `[System | Modal]: Error updating banner in guild ${guildID}: ${err}`
      );
      return await interaction.reply({
        content: `There was an error updating the banner. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (err) {
    return await interaction.reply({
      content: `There was an error updating the image. Please ensure the URL is valid and points to an image file.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function validateImageUrl(url: string): Promise<void> {
  const res = await fetch(url, { method: "HEAD" });

  if (!res.ok) throw new Error("Invalid URL or image not found.");

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.startsWith("image/"))
    throw new Error("URL does not point to a valid image.");
}

async function handleColorChanges(
  interaction: ModalSubmitInteraction,
  attachment: AttachmentBuilder,
  guildID: string
) {
  const value = interaction.fields.getTextInputValue("t-basic-info.color");
  const colorValue = normaliseHexInput(value);
  const returnedColor =
    colorValue != null ? (colorValue as `#${string}`) : "ffffff";

  const embed = new EmbedBuilder()
    .setTitle("Embed Color Updated")
    .setDescription(
      `The embed color has been updated to \`#${returnedColor}\`.`
    )
    .setColor(`#${returnedColor}`)
    .setFooter({
      text: `Tropica Configuration Panel | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  try {
    await ServerConfig.findOneAndUpdate(
      { guildId: guildID },
      { color: returnedColor },
      { new: true, upsert: true }
    );
    await interaction.reply({
      embeds: [embed],
      files: [attachment],
      flags: MessageFlags.Ephemeral,
    });
    setTimeout(() => interaction.deleteReply(), 7000);
  } catch (err) {
    console.error(
      `[System | Modal]: Error updating color in guild ${guildID}: ${err}`
    );
    await interaction.reply({
      content: `There was an error updating the color. Please try again later.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
