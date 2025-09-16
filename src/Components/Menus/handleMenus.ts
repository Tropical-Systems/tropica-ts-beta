import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  GuildMember,
  MessageFlags,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import ServerConfig from "../../Models/Config.js";
import { handleUnauthorizedMenu } from "../../Functions/misc-functions.js";

// When extra functionality requires additional Menu's use this file to copy and paste the layout. 
// You'll still need to change the customId on the export default object as otherwise errors can 
// happen that it can't find certain items.

export default {
  customId: "t",

  async execute(interaction: AnySelectMenuInteraction) {
    const guildID = interaction.guild!.id;
    if (!guildID) return;

    if (
      interaction.member instanceof GuildMember &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    )
      return await handleUnauthorizedMenu(interaction);

    if (!interaction.isAnySelectMenu()) return;
    

    switch (interaction.customId) {
      case "t-setting-config.infract-role":
        await handleConfigUpdatePanel(
          interaction,
          "infractionRole",
          "role",
          "infract"
        );
        break;
      case "t-setting-config.infract-channel":
        await handleConfigUpdatePanel(
          interaction,
          "infractChannel",
          "channel",
          "infract"
        );
        break;
      case "t-setting-config.review-role":
        await handleConfigUpdatePanel(
          interaction,
          "reviewerRole",
          "role",
          "review"
        );
        break;
      case "t-setting-config.review-channel":
        await handleConfigUpdatePanel(
          interaction,
          "reviewChannel",
          "channel",
          "review"
        );
        break;
      case "t-setting-config.designer-role":
        await handleConfigUpdatePanel(
          interaction,
          "designerRole",
          "role",
          "designer"
        );
        break;
      case "t-setting-config.order-channel":
        await handleConfigUpdatePanel(
          interaction,
          "orderLogChannel",
          "channel",
          "order"
        );
        break;
      case "t-setting-config.staff-manager-role":
        await handleConfigUpdatePanel(
          interaction,
          "managementRole",
          "role",
          "staff-manager"
        );
        break;
      case "t-setting-config.promote-channel":
        await handleConfigUpdatePanel(
          interaction,
          "promotionChannel",
          "channel",
          "promotion"
        );
        break;
      case "t-setting-config.demote-channel":
        await handleConfigUpdatePanel(
          interaction,
          "demotionChannel",
          "channel",
          "demotion"
        );
        break;
      case "t-setting-config.qc-role":
        await handleConfigUpdatePanel(interaction, "qcApprover", "role", "qc");
        break;
      case "t-setting-config.qc-channel":
        await handleConfigUpdatePanel(
          interaction,
          "qcChannel",
          "channel",
          "qc"
        );
        break;

      case "t-setting-config.credit-role":
        await handleConfigUpdatePanel(
          interaction,
          "creditManagerRole",
          "role",
          "credit"
        );
      break;
      case "t-setting-config.credit-channel":
        await handleConfigUpdatePanel(
          interaction,
          "creditLogChannel",
          "channel",
          "credit"
        );
      break;
      case "t-m-basic-info":
        switch (interaction.values[0]) {
          case "t-m-basic-info.color":
            const colorModal = new ModalBuilder()
              .setCustomId("t-basic-info-modal.color")
              .setTitle("Basic Information Panel: Color Customization");

            const colorInput = new TextInputBuilder()
              .setCustomId("t-basic-info.color")
              .setLabel("Embed color (e.g. #ffffff)")
              .setPlaceholder("Leave blank to reset to default")
              .setMinLength(0)
              .setMaxLength(7)
              .setRequired(false)
              .setStyle(TextInputStyle.Short);

            const one = new ActionRowBuilder<TextInputBuilder>().addComponents(
              colorInput
            );
            colorModal.addComponents(one);
            await interaction.showModal(colorModal);

            break;
          case "t-m-basic-info.image":
            const imageModal = new ModalBuilder()
              .setCustomId("t-basic-info-modal.image")
              .setTitle("Basic Information Panel: Banner Customization");

            const imageInput = new TextInputBuilder()
              .setCustomId("t-basic-info.image")
              .setLabel("Banner url (ex: https://your-link.com/...)")
              .setPlaceholder("Leave blank to reset to default")
              .setMinLength(0)
              .setRequired(false)
              .setStyle(TextInputStyle.Short);

            const two = new ActionRowBuilder<TextInputBuilder>().addComponents(
              imageInput
            );
            imageModal.addComponents(two);
            await interaction.showModal(imageModal);
            break;
          case "t-m-basic-info.tax":
            const taxModal = new ModalBuilder()
              .setCustomId("t-basic-info-modal.tax")
              .setTitle("Basic Information Panel: Banner Customization");

            const taxInput = new TextInputBuilder()
              .setCustomId("t-basic-info.tax")
              .setLabel("Tax percentage (0-100%)")
              .setPlaceholder(
                "Tropica standardly has 30% of already included tax. Leave blank to reset to default"
              )
              .setMinLength(0)
              .setMaxLength(3)
              .setRequired(false)
              .setStyle(TextInputStyle.Short);

            const three =
              new ActionRowBuilder<TextInputBuilder>().addComponents(taxInput);
            taxModal.addComponents(three);
            await interaction.showModal(taxModal);
            break;
          default:
            console.warn(
              `[System | SelectMenu]: Unknown menu value selected: ${interaction.values[0]}`
            );
            break;
        }
    }
  },
};

// Function to handle configuration updates based on the interaction
// This function updates the server configuration based on the selected role or channel
// It uses the interaction values to fetch the selected role or channel and updates the database accordingly.
async function handleConfigUpdatePanel(
  interaction: AnySelectMenuInteraction,
  configKey: string,
  type: "role" | "channel",
  panelType:
    | "infract"
    | "review"
    | "designer"
    | "order"
    | "staff-manager"
    | "promotion"
    | "demotion"
    | "qc"
    | "credit",
) {
  const guildID = interaction.guild!.id;
  let value = null;
  switch (type) {
    case "role":
      value = await interaction.guild!.roles.fetch(interaction.values[0]);
      break;
    case "channel":
      value = await interaction.guild!.channels.fetch(interaction.values[0]);
      break;
  }

  if (!guildID || !value) {
    console.warn(
      `Invalid guild ID or value for ${configKey} in guild: ${guildID}`
    );
    return await interaction.reply({
      content: `The ${type} you chose was not found in this server. If this is a mistake, please try again.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await ServerConfig.updateOne(
      { guildId: guildID },
      { [configKey]: value.id },
      { upsert: true }
    );
    await interaction.reply({
      content: `You selected ${value}. As your ${[
        checkPanelType(panelType),
      ]} ${type}`,
      flags: MessageFlags.Ephemeral,
    });
    setTimeout(() => interaction.deleteReply(), 5000);
  } catch (error) {
    console.warn(
      `Error updating configuration for ${configKey} in guild: ${guildID}`,
      error
    );

    await interaction.reply({
      content:
        "There was an error updating the configuration. Pleaes try again later.",
      flags: MessageFlags.Ephemeral,
    });
    setTimeout(() => {
      interaction.deleteReply(), 5000;
    });
  }
}

function checkPanelType(panelType: string) {
  if (panelType === "qc") {
    return "Quality Control";
  } else {
    return panelType;
  }
}
