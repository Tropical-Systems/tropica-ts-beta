import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import ms from "ms";
import ServerConfig, { IConfig } from "../Models/Config.js";
import Order, { IOrder } from "../Models/Order.js";
import {
  formatDuration,
  generateRandomId,
  handleStringFormattingToWithoutArrow,
  taxPrice,
} from "../Functions/misc-functions.js";
import { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config.js";
import miscConfig from "../config.js";
import { CInsufficientPermissionsR, CInteractionNotInGuild, CInvalidTimeFormatER, CMissingRequiredFieldsR, CNotConfiguredR, CNotTextChannelERE, CNotTextChannelR, CProvideId, CTypeNotAlreadyVoidedER, CTypeNotFoundER, CUnexpectedErrorER, CUnexpectedErrorR, CUserNotFoundER, CUserNotFoundR } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("order")
    .setDescription("Prepare, start or log an order with these commands")
    // order prepare
    .addSubcommand((subCommand) =>
      subCommand
        .setName("prepare")
        .setDescription("Prepare your order, add a price an include notes")
        .addUserOption((option) =>
          option
            .setName("customer")
            .setDescription("The client for this order")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("product")
            .setDescription("The product for this order")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("price")
            .setDescription("The price for this order before tax")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("The duration of the order. Ex: 1d, 1w, 1m")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription("Add additional notes you may need for this order.")
            .setRequired(false)
        )
    )
    // order start
    .addSubcommand((subCommand) =>
      subCommand
        .setName("start")
        .setDescription(
          "Begin the order process for a previously prepared order"
        )
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription(
              "The ID provided when you prepared the order. Lost it? Check your DMs, the ID will be provided there."
            )
            .setRequired(true)
        )
    )
    // order update
    .addSubcommand((subCommand) =>
      subCommand
        .setName("update")
        .setDescription("Update your client on the order status")
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription(
              "The ID provided when you prepared the order. Lost it? Check your Dms, the ID will be provided there."
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription(
              "The current status your order has, your customer will be notified via their DMs."
            )
            .setRequired(true)
            .setChoices(
              { name: "In Progress", value: "in_progress" },
              { name: "On Hold", value: "on_hold" },
              { name: "Delayed", value: "delayed" },
              { name: "Canceled", value: "canceled" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("extra-time")
            .setDescription(
              "If you need to add extra time to the order, please specify it here. Ex: 1d, 1w, 1m"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription(
              "Any additional notes you may want or need to include in the update"
            )
            .setRequired(false)
        )
    )
    // order complete
    .addSubcommand((subCommand) =>
      subCommand
        .setName("complete")
        .setDescription("Complete the order and notify the customer")
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription(
              "Complete a current order by its ID, this will notify your client of the completion."
            )
            .setRequired(true)
        )
    )
    // Order log
    .addSubcommand((subCommand) =>
      subCommand
        .setName("log")
        .setDescription(
          "Want to skip the hassle of preparing an order? Log it directly!"
        )
        .addUserOption((option) =>
          option
            .setName("customer")
            .setDescription("The purchaser of the product")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("product")
            .setDescription("The product made for the customer")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("price")
            .setDescription("The price of the product")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription(
              "Any additional notes you may want or need to include in the log"
            )
            .setRequired(false)
        )
    )
    // Order void
    .addSubcommand((subCommand) =>
      subCommand
        .setName("void")
        .setDescription(
          "Made a mistake and want to void an order? Use /order void to void an order."
        )
        .addNumberOption((o) =>
          o
            .setName("id")
            .setDescription("The ID of the order you want to void.")
            .setRequired(true)
        )
    )
    // Order active
    .addSubcommand((subCommand) => subCommand.setName("active")
      .setDescription("Check on all the active order in this server.")
    )
    // Order search
    .addSubcommand((subcommand) => subcommand.setName("search")
      .setDescription("Search for an order by its ID.")
      .addNumberOption((o) => o.setName("id").setDescription("The ID of the order you want to search for.").setRequired(true)
      )),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {

    if (!interaction.guild) return await CInteractionNotInGuild(interaction);

    const guildId = interaction.guild.id;
    const config = await ServerConfig.findOne({ guildId: guildId });

    if (!config) return await CNotConfiguredR(interaction);

    const requiredRole = (config && config.designerRole) || null;
    const requiredChannel = (config && config.orderLogChannel) || null;
    const member = interaction.member as GuildMember;

    if (!requiredRole || !requiredChannel) return await CNotConfiguredR(interaction);

    if (!member.roles.cache.has(requiredRole)) return await CInsufficientPermissionsR(interaction);

    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    switch (interaction.options.getSubcommand()) {
      case "prepare":
        await handleOrderPrepare(
          interaction,
          member,
          requiredRole,
          logo,
          config,
          banner
        );
        break;
      case "start":
        await handleOrderStart(
          interaction,
          member,
          requiredRole,
          logo,
          config,
          banner
        );
        break;
      case "update":
        await handleOrderUpdate(
          interaction,
          member,
          requiredRole,
          logo,
          config,
          banner
        );
        break;
      case "complete":
        await handleOrderComplete(
          interaction,
          guildId,
          config,
          logo,
          banner,
          member,
          requiredRole
        );
        break;
      case "log":
        await handleOrderLog(
          interaction,
          guildId,
          config,
          logo,
          banner,
          requiredChannel,
          requiredRole,
          member
        );
        break;
      case "void":
        await handleOrderVoid(interaction, member, requiredRole, guildId);
        break;
      case "active":
        await handleOrderActive(
          interaction,
          guildId,
          config,
          logo,
          banner,
          requiredRole,
          member
        );
        break;
      case "search":
        await handleOrderSearch(
          interaction,
          guildId,
          config,
          logo,
          banner,
          requiredRole,
          member
        );
        break;
      default:
        return await interaction.reply({
          content: `${miscConfig.emojis.circleminus} Invalid subcommand.`,
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};

async function handleOrderSearch(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  requiredRole: string,
  member: GuildMember
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole)) return await CInsufficientPermissionsR(interaction);

  const orderId = interaction.options.getNumber("id", true);

  if (!orderId) return await CProvideId(interaction, "order");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const order = await Order.findOne({
    orderId: orderId,
    guildId: guildId,
  });

  if (!order) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} No order found with ID ${orderId}.`,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Order Details for ID ${orderId}`,
      iconURL: interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(`Details for order ID \`${orderId}\`, requested by ${interaction.user}.`)
    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  function checkCompletion(order: IOrder) {
    if (order.status === "completed") {
      return "Completion Date";
    } else {
      return "Estimated Completion Date";
    }
  }

  const fields = [
    {
      name: `${miscConfig.emojis.userdollar} Customer`,
      value: `${order.customerId ? `<@${order.customerId}>` : "Unknown"}`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.user} Designer`,
      value: `<@${order.designerId}>`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.ticket} Ticket`,
      value: `<#${order.orderChannelId}>`,
      inline: false,
    },
    {
      name: `${miscConfig.emojis.cart} Product`,
      value: `${order.product}`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.dollar} Price`,
      value: `\`\`\`${order.price}\`\`\``,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.shield} Status`,
      value: `${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.paperwriting} Notes`,
      value: order.notes || "No notes provided.",
      inline: false,
    },
    {
      name: `${miscConfig.emojis.clocksearch} ${checkCompletion(order)}`,
      value: order.completionDate ? `<t:${Math.floor(order.completionDate.getTime() / 1000)}:R> (<t:${Math.floor(order.completionDate.getTime() / 1000)}:D>)` : "Not set",
      inline: true,
    },
    {
      name: `${miscConfig.emojis.clockstop} Estimated Time Required`,
      value: order.estimatedTime || "Not set",
      inline: true,
    }
  ]
  embed.addFields(fields);

  const files = [logo];

  if (config && config.color && config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && !config.color && config.bannerUrl) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  return await interaction.editReply({
    embeds: [embed],
    files,
  });
}


async function handleOrderActive(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  requiredRole: string,
  member: GuildMember
) {
  if (!interaction.guild)
    return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const displayLimit = 20;

  const activeOrders = await Order.find({
    guildId: guildId,
    status: { $nin: ["completed", "canceled", "prepared"] },
  })
    .limit(displayLimit);

  if (activeOrders.length === 0) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.circleminus} No active orders found.`,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.guild.name || "Tropica"}'s Active Orders`)
    .setDescription(
      `Here are the active orders in this server. If you need to search, update or complete an order, please use the appropriate commands.`
    )
    .setFooter({
      text: `Total Active Orders: ${activeOrders.length} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    })

  // Format each order nicely
  const extraCount = activeOrders.length - displayLimit;

  activeOrders.slice(0, displayLimit).forEach((order) => {
    const estimatedCompletionDate = order.completionDate !== null ? `<t:${Math.floor(new Date(order.completionDate).getTime() / 1000)}:R> (<t:${Math.floor(new Date(order.completionDate).getTime() / 1000)}:D>)` : "Not set";
    embed.addFields({
      name: `${miscConfig.emojis.cart} #${order.orderId}`,
      value: `• **User:** <@${order.customerId}>\n• **Status:** ${handleStringFormattingToWithoutArrow(order.status)}\n• **Estimated Completion Date:** ${estimatedCompletionDate}\n• **Channel:** <#${order.orderChannelId}>\n• **Designer:** <@${order.designerId}>`,
      inline: false,
    });
  });

  if (extraCount > 0) {
    embed.addFields({
      name: `${miscConfig.emojis.circleplus} More Orders`,
      value: `...and **${extraCount}** more active order${extraCount === 1 ? "" : "s"} not shown here.`,
      inline: false,
    });
  }

  const files = [logo];

  if (config && config.color && config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && !config.color && config.bannerUrl) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  return await interaction.editReply({
    content: null,
    embeds: [embed],
    files,
  });
}

async function handleOrderLog(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  requiredChannel: string,
  designerRole: string,
  member: GuildMember
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(designerRole))
    return await CInsufficientPermissionsR(interaction);


  const customer = interaction.options.getUser("customer");
  const product = interaction.options.getString("product");
  const price = interaction.options.getNumber("price");
  const notes = interaction.options.getString("notes") || "No notes provided.";

  if (!customer || !product || !price) return await CMissingRequiredFieldsR(interaction, ["customer", "product", "price"]);

  const client = await interaction.guild.members.fetch(customer.id);
  if (!client) return await CUserNotFoundR(interaction, "customer");

  const orderId = generateRandomId();
  const taxRate = config.taxRate || 1.0;
  const taxed = taxPrice(price, taxRate);

  const newOrder = new Order({
    orderId: orderId,
    designerId: interaction.user.id,
    customerId: client.id,
    guildId: guildId,
    orderChannelId: requiredChannel,
    price: price,
    product: product,
    estimatedTime: "0s", // No estimated time for logged orders
    completionDate: new Date(),
    status: "completed",
    notes: notes,
  });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await newOrder.save();
  } catch {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} Failed to log the order. Please try again later.`,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Logged by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(`A new order has been logged by ${interaction.user}.`)
    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    })
    .addFields([
      {
        name: `${miscConfig.emojis.cart} Product:`,
        value: `${product}`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.userdollar} Customer:`,
        value: `${customer}`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.user} Designer:`,
        value: `<@${interaction.user.id}>`,
      },
      {
        name: `${miscConfig.emojis.dollar} Subtotal:`,
        value: `\`\`\`${price}\`\`\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.filleddollar} Total:`,
        value: `\`\`\`${taxed}\`\`\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Notes:`,
        value: notes,
        inline: false,
      },
    ]);

  const orderChannel = await interaction.guild.channels.fetch(
    `${config.orderLogChannel}`
  );

  if (
    !orderChannel ||
    !orderChannel.isTextBased() ||
    !(orderChannel instanceof TextChannel)
  ) {
    return await handleChannelIsNotTextBasedOrFoundER(interaction);
  }

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.bannerUrl && !config.color) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
  } else if (config && !config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  const markCompleteButton = new ButtonBuilder()
    .setCustomId(`t-order-log-paid.${orderId}`)
    .setLabel("Mark as Paid")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(markCompleteButton);


  await orderChannel.send({
    embeds: [embed],
    files,
    components: [row],
  });

  const thankyouMessage = `Hello <@${customer.id}> Thank you for ordering in ${interaction.guild.name}, your order has been logged in [${interaction.guild.name}](https://discord.com/channels/${interaction.guild.id}) by ${interaction.user}. Please find the order details below:`;

  try {
    await client.send({
      content: thankyouMessage,
      embeds: [embed],
      files,
    });

    return await interaction.editReply({
      content: `${miscConfig.emojis.checkemoji} Order logged successfully in ${orderChannel}!`,
      embeds: [embed],
      files,
    });
  } catch {
    return await interaction.editReply({
      content: `${miscConfig.emojis.checkemoji} Order logged successfully in ${orderChannel}! However I was unable to notify your customer. Please notify them manually.`,
    });
  }
}

async function handleOrderVoid(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  requiredRole: string,
  guildId: string
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  const id = interaction.options.getNumber("id", true);

  if (!id) return await CProvideId(interaction, "order");

  if (
    !member.roles.cache.has(requiredRole) &&
    !member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return await CInsufficientPermissionsR(interaction);
  }

  const orderToVoid = await Order.findOne({
    orderId: id,
    guildId: guildId,
  });

  if (!orderToVoid) return await CTypeNotAlreadyVoidedER(interaction, "order", `${id}`);

  try {
    await Order.deleteOne({
      orderId: id,
      guildId: guildId,
    });

    return await interaction.reply({
      content: `${miscConfig.emojis.checkemoji} Order with ID \`${id}\` has been voided successfully.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} An error occurred while voiding the order. Please try again later.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function handleOrderComplete(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  member: GuildMember,
  requiredRole: string
) {

  if (!interaction.guild) return CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole)) return await CInsufficientPermissionsR(interaction);

  const orderId = interaction.options.getNumber("id");

  if (!orderId) return await CProvideId(interaction, "order");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const order = await Order.findOne({
      orderId: orderId,
      guildId: guildId,
    });

    if (!order) return await CTypeNotFoundER(interaction, "order", `${orderId}`);

    const client = await interaction.guild.members.fetch(order.customerId);

    if (!client) return await CUserNotFoundER(interaction, "customer");

    switch (order.status) {
      case "prepared":
        return await interaction.editReply({
          content: `${miscConfig.emojis.shield} Order with ID \`${orderId}\` is still in the prepared state. Please start it before completing.`,
        });
      case "started":
        await handleCompletion(
          interaction,
          orderId,
          order,
          config,
          logo,
          banner,
          client as GuildMember
        );
        break;
      case "in_progress":
        await handleCompletion(
          interaction,
          orderId,
          order,
          config,
          logo,
          banner,
          client as GuildMember
        );
        break;
      case "on_hold":
        await handleCompletion(
          interaction,
          orderId,
          order,
          config,
          logo,
          banner,
          client as GuildMember
        );
        break;
      case "delayed":
        await handleCompletion(
          interaction,
          orderId,
          order,
          config,
          logo,
          banner,
          client as GuildMember
        );
        break;
      default:
        return await interaction.editReply({
          content: `${miscConfig.emojis.xemoji} Order with ID \`${orderId}\` is already completed or canceled.`,
        });
    }
  } catch { return await CUnexpectedErrorR(interaction) }
}

async function handleCompletion(
  interaction: ChatInputCommandInteraction,
  orderId: number,
  order: IOrder,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  client: GuildMember
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  const orderChannel = await interaction.guild.channels.fetch(
    order.orderChannelId
  );

  const orderLogChannel = await interaction.guild.channels.fetch(
    `${config.orderLogChannel}`
  );


  if (
    !orderChannel ||
    !orderChannel.isTextBased() ||
    !(orderChannel instanceof TextChannel)
  )
    return await handleChannelIsNotTextBasedOrFoundER(interaction);

  if (
    !orderLogChannel ||
    !orderLogChannel.isTextBased() ||
    !(orderLogChannel instanceof TextChannel)
  )
    return await handleChannelIsNotTextBasedOrFoundER(interaction);

  const now = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Order Completed by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(`The order with ID ${orderId} has been completed.`)
    .setFields([
      {
        name: `${miscConfig.emojis.books} Status`,
        value: "Completed",
        inline: false,
      },
      {
        name: "Order ID",
        value: `\`${orderId}\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.cart} Product`,
        value: `${order.product}`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.userdollar} Customer`,
        value: `<@${order.customerId}>`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.user} Designer`,
        value: `<@${order.designerId}>`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.dollar} Price`,
        value: `\`\`\`${order.price}\`\`\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.filleddollar} Total`,
        value: `\`\`\`${taxPrice(order.price, config.taxRate)}\`\`\``,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.confettiIcon} Completion Date`,
        value: `<t:${now}:R> (<t:${now}:D>)`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.clock} Original Completion Date`,
        value: `<t:${Math.floor(
          order.completionDate.getTime() / 1000
        )}:R> (<t:${Math.floor(order.completionDate.getTime() / 1000)}:D>)`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Notes`,
        value: order.notes || "No notes provided.",
        inline: false,
      },
    ])

    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  order.status = "completed";
  order.completionDate = new Date();
  await order.save();

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.bannerUrl && !config.color) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
  } else if (config && !config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  const markCompleteButton = new ButtonBuilder()
    .setCustomId(`t-order-log-paid.${order.orderId}`)
    .setLabel("Mark as Paid")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(markCompleteButton);

  await orderLogChannel.send({
    embeds: [embed],
    files,
    components: [row],
  });

  await orderChannel.send({
    content: `${miscConfig.emojis.checkemoji} Order completed successfully! \n-# CC: <@${order.customerId}> & <@${order.designerId}>`,
    embeds: [embed],
    files,
  });
  try {

    const thankyouMessage = `Hello <@${order.customerId}> Thank you for ordering in ${interaction.guild.name}, your order has been logged in [${interaction.guild.name}](https://discord.com/channels/${interaction.guild.id}/${order.orderChannelId}) by ${interaction.user}. Please find the order details below:`;

    await client.send({
      content: thankyouMessage,
      embeds: [embed],
      files: files,
    });

    return await interaction.editReply({
      content: `${miscConfig.emojis.checkemoji} Order completed successfully!`,
    });
  } catch {
    return await interaction.editReply({
      content: `${miscConfig.emojis.checkemoji} Order completed successfully! However I was unable to contact your customer. Please notify them manually.`,
    });
  }
}

async function handleOrderUpdate(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  requiredRole: string,
  logo: AttachmentBuilder,
  config: IConfig,
  banner: AttachmentBuilder
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  const orderId = interaction.options.getNumber("id");
  const status = interaction.options.getString("status");
  const extraTime = interaction.options.getString("extra-time");
  const reason =
    interaction.options.getString("reason") || "No reason provided.";

  if (!orderId || !status) return await CMissingRequiredFieldsR(interaction, ["id", "status"]);

  if (status === "canceled" && reason === "No reason provided.") {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} Please provide a reason for canceling the order. This is required when canceling an order.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const order = await Order.findOne({
    orderId: orderId,
    guildId: interaction.guild.id,
  });

  if (!order) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} No order found with ID \`${orderId}\`.`,
    });
  }

  const orderChannel = await interaction.guild.channels.fetch(
    order.orderChannelId
  );
  if (
    !orderChannel ||
    !orderChannel.isTextBased() ||
    !(orderChannel instanceof TextChannel)
  )
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} The order channel is not found or is not a text channel.`,
    });

  switch (order.status) {
    case "prepared":
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} Order with ID \`${orderId}\` is still in the prepared state. Please start it before updating.`,
      });

    case "completed":
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} Order with ID \`${orderId}\` has already been completed. No further updates can be made.`,
      });
  }

  const designer = await interaction.guild.members.fetch(order.designerId);

  const customer = await interaction.guild.members.fetch(order.customerId);
  if (!customer) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} Customer not found.`,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Order Update by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(
      "Your order has been updated! More information is listed below."
    )
    .setFields([
      {
        name: `${miscConfig.emojis.clock} Current Status`,
        value: `${handleStringFormattingToWithoutArrow(status)}`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Reason`,
        value: reason,
        inline: false,
      },
    ])
    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  order.status = status;
  await order.save();

  if (extraTime) {
    const durationRegex = /^\d+\s?[hdwmy]$/i;

    if (!durationRegex.test(extraTime)) return await CInvalidTimeFormatER(interaction);

    const formatedDuration = formatDuration(extraTime || "");
    const time = ms(order.estimatedTime as Parameters<typeof ms>[0]);

    if (formatedDuration && time) {
      const newCompletionDate = new Date(order.completionDate).getTime() + time;
      order.completionDate = new Date(Date.now() + time);
      await order.save();

      const unixTimeStamp = Math.floor(newCompletionDate / 1000);

      embed.addFields([
        {
          name: `${miscConfig.emojis.clockstop} Extra Time Added`,
          value: `\`\`\`${formatedDuration}\`\`\``,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.clocksearch} New Estimated Completion Date`,
          value: `<t:${unixTimeStamp}:R> (<t:${unixTimeStamp}:D>)`,
          inline: false,
        },
      ]);
    } else return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} An error occurred while calculating the new completion date. Please make sure to use the correct format: 1d, 2w, 3m, 4y`,
    });
  }
  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.bannerUrl && !config.color) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
  } else if (config && !config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  await handleCallBackToUser(
    interaction,
    order,
    order.orderId,
    embed,
    order.customerId,
    designer,
    files,
    orderChannel
  );

  return await interaction.editReply({
    content: `${miscConfig.emojis.checkemoji} Order with ID \`${orderId}\` updated successfully!`,
  });
}

async function handleOrderStart(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  requiredRole: string,
  logo: AttachmentBuilder,
  config: IConfig,
  banner: AttachmentBuilder
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  const orderId = interaction.options.getNumber("id");

  if (!orderId) return await CProvideId(interaction, "order");

  const order = await Order.findOne({
    orderId: orderId,
    guildId: interaction.guild.id,
  });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!order) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} No order found with ID \`${orderId}\`. Is it possible that this order has been voided?`,
    });
  }

  if (order.status !== "prepared") {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} Order with ID \`${orderId}\` is not in the "prepared" state. Are you sure this order isn't already being worked on?`,
    });
  }

  order.status = "started";
  const time = ms(order.estimatedTime as Parameters<typeof ms>[0]);
  const unixTimeStamp = Math.floor((Date.now() + time) / 1000);

  order.completionDate = new Date(Date.now() + time);

  try {
    await order.save();
  } catch { return await CUnexpectedErrorER(interaction) }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Started by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(`The order with ID \`${orderId}\` has been started.`)
    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    })
    .addFields([
      {
        name: `${miscConfig.emojis.cart} Product`,
        value: `${order.product}`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.user} Designer`,
        value: `<@${order.designerId}>`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.userdollar} Customer`,
        value: `<@${order.customerId}>`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.dollar} Subtotal`,
        value: `\`\`\`${order.price}\`\`\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.filleddollar} Total`,
        value: `\`\`\`${taxPrice(order.price, config.taxRate)}\`\`\``,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.clocksearch} Estimated Completion Date:`,
        value: `<t:${unixTimeStamp}:R> (<t:${unixTimeStamp}:D>)`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Notes`,
        value: order.notes || "No notes provided.",
        inline: false,
      },
    ])

    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  const orderChannel = await interaction.guild.channels.fetch(
    order.orderChannelId
  );
  if (
    !orderChannel ||
    !orderChannel.isTextBased() ||
    !(orderChannel instanceof TextChannel)
  )
    return await interaction.editReply({
      content: `${miscConfig.emojis.shield} Order channel not found or is not a text channel.`,
    });

  const designer = await interaction.guild.members.fetch(order.designerId);
  if (!designer)
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} Designer not found.`,
    });

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.bannerUrl && !config.color) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
  } else if (config && !config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  await handleCallBackToUser(
    interaction,
    order,
    orderId,
    embed,
    order.customerId,
    designer,
    files,
    orderChannel
  );

  return await interaction.editReply({
    content: `${miscConfig.emojis.checkemoji} Order with ID \`${orderId}\` started successfully!`,
  });
}

async function handleOrderPrepare(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  requiredRole: string,
  logo: AttachmentBuilder,
  config: IConfig,
  banner: AttachmentBuilder
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!member.roles.cache.has(requiredRole))
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} You do not have permission to prepare orders.`,
    });

  const customer = interaction.options.getUser("customer");
  const product = interaction.options.getString("product");
  const price = interaction.options.getNumber("price");
  const duration = interaction.options.getString("duration");
  const notes = interaction.options.getString("notes") || "No notes provided.";

  if (!customer || !product || !price || !duration) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.circleminus} Missing required fields.`,
    });
  }

  const durationRegex = /^\d+\s?[hdwmy]$/i;
  if (!durationRegex.test(duration)) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.customize} Invalid duration format. Use 1h, 1d, 1w, 1m or 1y.`,
    });
  }

  const orderId = generateRandomId();

  const taxRate = config.taxRate || 1.0;

  if (
    (interaction.channel && !interaction.channel.isTextBased()) ||
    !(interaction.channel instanceof TextChannel)
  ) return await CNotTextChannelERE(interaction);

  const newOrder = new Order({
    orderId: orderId,
    designerId: interaction.user.id,
    customerId: customer.id,
    guildId: interaction.guild.id,
    orderChannelId: interaction.channel!.id,
    price: price,
    product: product,
    estimatedTime: duration,
    completionDate: null, // Will be set when the order is started (/order start id: ...)
    status: "prepared",
    notes: notes,
  });

  const formatedDuration = formatDuration(duration);
  if (!formatedDuration) return await CInvalidTimeFormatER(interaction);

  try {
    await newOrder.save();
  } catch { return await CUnexpectedErrorR(interaction) }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Claimed by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(`A new order is being prepared by ${interaction.user}.`)
    .setFooter({
      text: `Order ID: ${orderId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    })
    .addFields([
      {
        name: `${miscConfig.emojis.cart} Product:`,
        value: `${product}`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.user} Designer:`,
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.userdollar} Customer:`,
        value: `${customer}`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.dollar} Subtotal:`,
        value: `\`\`\`${price}\`\`\``,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.filleddollar} Total:`,
        value: `\`\`\`${taxPrice(price, taxRate)}\`\`\``,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.clockstop} Estimated Time needed for Completion:`,
        value: `\`\`\`${formatedDuration}\`\`\``,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Notes:`,
        value: notes || "No notes provided.",
        inline: false,
      },
    ]);

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.bannerUrl && !config.color) {
    embed.setColor("#000000");
    embed.setImage(config.bannerUrl || "");
  } else if (config && !config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }
  await handleCallBackToUser(
    interaction,
    newOrder,
    orderId,
    embed,
    customer.id,
    member,
    files,
    interaction.channel as TextChannel
  );
  return await interaction.editReply({
    content: `${miscConfig.emojis.checkemoji} Order prepared successfully! \n-# Order ID: \`${orderId}\``,
  });
}

async function handleCallBackToUser(
  interaction: ChatInputCommandInteraction,
  order: IOrder,
  orderId: number,
  embed: EmbedBuilder,
  customerId: string,
  designer: GuildMember,
  files: AttachmentBuilder[],
  orderChannel: TextChannel
) {
  try {
    const customer = (await interaction.guild!.members.fetch(
      customerId
    )) as GuildMember;
    if (!customer) throw new Error("Customer not found");

    await customer.send({
      content: `Hello <@${order.customerId
        }>, your order with ID \`${orderId}\` has been updated by ${interaction.user
        } in [${interaction.guild!.name}](https://discord.com/channels/${interaction.guild!.id
        }). Please find the details below:`,
      embeds: [embed],
      files: files,
    });
    await orderChannel.send({
      content: `-# CC: ${customer} & ${designer}`,
      embeds: [embed],
      files: files,
    });
  } catch {
    await orderChannel.send({
      content: `Order updated successfully! \n-# CC: <@${customerId}> & ${designer}`,
      embeds: [embed],
      files: files,
    });
  }
}

async function handleChannelIsNotTextBasedOrFoundER(
  interaction: ChatInputCommandInteraction
) {
  return await interaction.editReply({
    content: `${miscConfig.emojis.shield} Order channel not found or is not a text channel.`,
  });
}