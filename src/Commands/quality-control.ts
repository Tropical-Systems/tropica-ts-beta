import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import ServerConfig from "../Models/Config.js";
import miscConfig, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config.js";
import {
  formatDuration,
} from "../Functions/misc-functions.js";
import Order from "../Models/Order.js";
import { CInteractionNotInGuild, CNotTextChannelR, CInsufficientPermissionsR, CNotConfiguredR } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("qc")
    .setDescription(
      "Manage quality control with Tropica's quality control system."
    )
    .addSubcommand((sc) =>
      sc
        .setName("check")
        .setDescription(
          "Get the quality control team to check the quality of your product."
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("The order channel you need approval for.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addAttachmentOption((o) =>
          o
            .setName("product_1")
            .setDescription("The product you need the quality checked of.")
            .setRequired(true)
        )
        .addNumberOption((o) =>
          o
            .setName("order_id")
            .setDescription("The order ID for the product.")
            .setRequired(false)
        )
        .addUserOption((o) =>
          o
            .setName("designer")
            .setDescription(
              "Running the command for someone else? Specify the designer."
            )
            .setRequired(false)
        )
        .addAttachmentOption((o) =>
          o
            .setName("product_2")
            .setDescription(
              "The second product you need the quality checked of."
            )
            .setRequired(false)
        )
        .addAttachmentOption((o) =>
          o
            .setName("product_3")
            .setDescription(
              "The third product you need the quality checked of."
            )
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const guild = interaction.guild;
    if (!guild) return await CInteractionNotInGuild(interaction);

    const guildId = guild.id;

    const config = await ServerConfig.findOne({ guildId: guildId });
    if (!config) return await CNotConfiguredR(interaction);

    const requiredRole = (config && config.qcApprover) || null;
    const requiredStaffRole = (config && config.designerRole) || null;
    const requiredChannel = (config && config.qcChannel) || null;

    if (!requiredRole || !requiredStaffRole || !requiredChannel)
      return await CNotConfiguredR(interaction);

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const orderId = interaction.options.getNumber("order_id") || null;
    const designerUser =
      interaction.options.getUser("designer") || interaction.user;
    const designer = guild.members.cache.get(designerUser.id);

    if (!designer) {
      return await interaction.reply({
        content: `${miscConfig.emojis.alerttriangle} The specified designer is not a member of this server.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    if (!channel || channel.type !== ChannelType.GuildText) {
      return await CNotTextChannelR(interaction);
    }

    const qcChannel = await guild.channels.cache.get(requiredChannel);
    const qcRole = await guild.roles.cache.get(requiredRole);
    if (!qcChannel || !qcChannel.isTextBased() || !qcRole) {
      return await interaction.reply({
        content: `${miscConfig.emojis.alerttriangle} The Quality Control Module is not set up correctly. Please contact your server administrators to resolve this issue.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    switch (interaction.options.getSubcommand()) {
      case "check":
        await handleQcCheck(
          interaction,
          guildId,
          channel.id,
          orderId,
          designer,
          qcChannel as TextChannel,
          qcRole,
          logo,
        );
        break;
      default:
        return await interaction.reply({
          content: `${miscConfig.emojis.shield} Unknown subcommand.`,
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};

async function handleQcCheck(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channel: string,
  orderId: number | null,
  designer: GuildMember,
  qcChannel: TextChannel,
  qcRole: Role,
  logo: AttachmentBuilder,
) {

  if (!interaction.guild) return CInteractionNotInGuild(interaction);

  if (!(interaction.member instanceof GuildMember)) {
    return await CInsufficientPermissionsR(interaction);
  }

  const executor = interaction.member; // GuildMember

  if (!designer) {
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} The specified designer is not a member of this server.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Case 1: executor is the designer themself
  if (executor.id === designer.id) {
    if (!designer.roles.cache.has(qcRole.id)) {
      return await CInsufficientPermissionsR(interaction);
    }
  } else {
    // Case 2: executor is management acting on a designer
    if (!executor.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await CInsufficientPermissionsR(interaction);
    }
    if (!designer.roles.cache.has(qcRole.id)) {
      return await interaction.reply({
        content: `${miscConfig.emojis.alerttriangle} The specified designer does not have the required QC role.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const mainEmbedFields = [
    {
      name: `${miscConfig.emojis.badgeh} Designer`,
      value: `${designer}`,
      inline: true,
    },
  ];

  const MainEmbed = new EmbedBuilder()
    .setTitle(`Quality Control Submission`)
    .setDescription(
      `${designer} has submitted their product for approval. Please asses their product(s) and ensure they meet your quality standards. If you have any questions, you can contact ${designer} via the thread below.`
    )
    .setFooter({
      text: `Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (orderId !== null) {
    const order = await Order.findOne({
      guildId: guildId,
      orderId: orderId,
    });

    if (order) {
      if (!order.completionDate || order.status === "prepared") {
        const relatedChannel = interaction.guild.channels.cache.get(order.orderChannelId);

        mainEmbedFields.push({
          name: `${miscConfig.emojis.ticket} Ticket:`,
          value: `<#${relatedChannel ?? channel}>`,
          inline: true,
        });

        mainEmbedFields.push({
          name: `${miscConfig.emojis.clockplay} Estimated Time:`,
          value: `\`${formatDuration(order.estimatedTime) || "N/A"}\``,
          inline: true,
        });
      } else {
        const timestamp = Math.floor(new Date(order.completionDate).getTime() / 1000);

        mainEmbedFields.push({
          name: `${miscConfig.emojis.clockplay} Completion Date:`,
          value: `<t:${timestamp}:R> (<t:${timestamp}:D>)`,
          inline: true,
        });

        mainEmbedFields.push({
          name: `Order ID:`,
          value: `\`${order.orderId}\``,
          inline: true,
        });

        mainEmbedFields.push({
          name: `${miscConfig.emojis.customize} Status:`,
          value: `${order.status}`,
          inline: true,
        });

        mainEmbedFields.push({
          name: `${miscConfig.emojis.paperwriting} Notes:`,
          value: `${order.notes || "No notes provided."}`,
          inline: false,
        });
      }
    } else {
      mainEmbedFields.push({
        name: `${miscConfig.emojis.ticket} Ticket:`,
        value: `${channel}`,
        inline: true,
      });
    }
  } else {
    mainEmbedFields.push({
      name: `${miscConfig.emojis.ticket} Ticket:`,
      value: `${channel}`,
      inline: true,
    });
  }

  MainEmbed.addFields(mainEmbedFields);

  const AcceptButton = new ButtonBuilder()
    .setLabel("Accept")
    .setEmoji(miscConfig.emojis.checkemoji)
    .setStyle(ButtonStyle.Success)
    .setCustomId("t-qc.accept");

  const RejectButton = new ButtonBuilder()
    .setLabel("Reject")
    .setEmoji(miscConfig.emojis.xemoji)
    .setStyle(ButtonStyle.Danger)
    .setCustomId("t-qc.reject");

  const QcActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    AcceptButton,
    RejectButton
  );

  const qcMessage = await qcChannel.send({
    content: `-# ${qcRole} & ${designer}`,
    embeds: [MainEmbed],
    files: [logo],
    components: [QcActionRow],
  });
  const thread = await qcMessage.startThread({
    name: `Quality Control ${orderId !== null ? `| ${orderId}` : ``} | ${designer.user.username
      }`,
    reason: `${designer.user.username} has submitted their product for quality control.`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
  });

  await interaction.editReply({
    content: `${miscConfig.emojis.checkemoji} Your product has been submitted for quality control. You can find it here: ${qcChannel} (${qcMessage.id})`,
  });

  const product1 = interaction.options.getAttachment("product_1");
  const product2 = interaction.options.getAttachment("product_2");
  const product3 = interaction.options.getAttachment("product_3");
  const attachments: AttachmentBuilder[] = [];
  if (product1)
    attachments.push(
      new AttachmentBuilder(product1.url, { name: product1.name })
    );
  if (product2)
    attachments.push(
      new AttachmentBuilder(product2.url, { name: product2.name })
    );
  if (product3)
    attachments.push(
      new AttachmentBuilder(product3.url, { name: product3.name })
    );

  await thread.send({ content: `${designer}'s uploaded files:`, files: attachments });

  return;
}
