import config, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config";
import {
  AttachmentBuilder,
  MessageFlags,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  GuildMember,
  ChatInputCommandInteraction,
  Client,
} from "discord.js";
import { CInsufficientPermissionsR, CInteractionNotInGuild } from "../Functions/interactionReturns";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure your server settings in our panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {

    if (!interaction.guild) return await CInteractionNotInGuild(interaction);

    if (
      interaction.member instanceof GuildMember &&
      !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
    )
      return await CInsufficientPermissionsR(interaction);

    const startPanel = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(0xf2f2ff)
      .setDescription(
        `**Welcome and thanks for choosing Tropica!**\n\n This is our configuration wizard. This will send you though a step by step process of setting up Tropica to your liking. After you have configured the system, you will be able to edit each module seperately by selecting the module. To start, click the **Start** button below!\n\n Thanks for chosing Tropica and enjoy the experience!`
      )
      .setFooter({
        text: `Tropica Configuration Panel | Powered by Tropica`,
        iconURL: "attachment://tropica-logo.png",
      })
      .setImage("attachment://tropica-banner.png");

    const startButton = new ButtonBuilder()
      .setCustomId("t-setting-config.start")
      .setEmoji(config.emojis.right)
      .setLabel("Start")
      .setStyle(ButtonStyle.Success);

    const startPanelButtonRow =
      new ActionRowBuilder<ButtonBuilder>().addComponents(startButton);

    const attachment = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    await interaction.reply({
      embeds: [startPanel],
      components: [startPanelButtonRow],
      files: [attachment, banner],
      flags: MessageFlags.Ephemeral,
    });
  },
};
