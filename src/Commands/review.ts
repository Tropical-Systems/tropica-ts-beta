import {
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
} from "discord.js";
import ServerConfig, { IConfig } from "../Models/Config.js";
import miscConfig, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config.js";
import {
  generateRandomId,
} from "../Functions/misc-functions.js";
import Review from "../Models/Review.js";
import { ActionRowBuilder } from "@discordjs/builders";
import ReviewVoid from "../Models/ReviewVoid.js";
import { CInsufficientPermissionsR, CInteractionNotInGuild, CMissingRequiredFieldsR, CNotConfiguredR, CNotTextChannelR } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("review")
    .setDescription("Review your designer and product.")
    // review Create
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Reveiew a designer and product.")
        .addUserOption((o) =>
          o
            .setName("designer")
            .setDescription("The designer who made your product.")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("product")
            .setDescription("The product you purchased.")
            .setRequired(true)
        )
        .addNumberOption((o) => {
          o.setName("rating")
            .setDescription("Your rating for the designer and product.")
            .setRequired(true);
          for (let i = 1; i <= 5; i++) {
            // Adding choices for ratings 1 to 5
            o.addChoices({
              name: `${"⭐".repeat(i)}`,
              value: i,
            });
          }
          return o;
        })
        .addStringOption((o) =>
          o
            .setName("comment")
            .setDescription("Any extra comments you want to add.")
            .setRequired(false)
        )
        .addNumberOption((o) =>
          o
            .setName("order_id")
            .setDescription("The ID of the order related to this review.")
            .setRequired(false)
        )
    )
    // review Void
    .addSubcommand((sc) =>
      sc
        .setName("void")
        .setDescription(
          "Does an review not meet your professional standards? Void it."
        )
        .addNumberOption((o) =>
          o
            .setName("id")
            .setDescription("The ID of the review you want to void.")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("reason")
            .setDescription("The reason for voiding this review.")
            .setRequired(true)
        )
    )

    // review server average
    .addSubcommand((sc) =>
      sc
        .setName("average")
        .setDescription("Get the average rating of all reviews in this server.")
    )
    // review designer average
    .addSubcommand((sc) =>
      sc
        .setName("designer-average")
        .setDescription("Get the average rating of a specific designer.")
        .addUserOption((o) =>
          o
            .setName("designer")
            .setDescription(
              "The designer you want to check their average rating for."
            )
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const subCommand = interaction.options.getSubcommand();

    if (!interaction.guild)
      return await CInteractionNotInGuild(interaction);

    const guildID = interaction.guild.id;
    const config = await ServerConfig.findOne({ guildId: guildID });

    if (!config) return await CNotConfiguredR(interaction);

    const requiredRole = (config && config.reviewerRole) || null;
    const requiredChannel = (config && config.reviewChannel) || null;

    if (!requiredRole || !requiredChannel)
      return await CNotConfiguredR(interaction);

    const member = interaction.member as GuildMember;

    if (!member.roles.cache.has(requiredRole)) return await CInsufficientPermissionsR(interaction);

    const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    switch (subCommand) {
      case "create":
        return await handleReviewCreate(
          interaction,
          guildID,
          config,
          requiredRole,
          requiredChannel,
          member,
          logo,
          banner
        );
        break;
      case "void":
        return await handleReviewVoid(
          interaction,
          guildID,
          logo,
          banner,
          config,
          member
        );
        break;
      case "average":
        return await handleReviewServerAverage(
          interaction,
          guildID,
          config,
          member,
          logo,
          banner
        );
        break;
      case "designer-average":
        return await handleReviewDesignerAverage(
          interaction,
          guildID,
          config,
          member,
          logo,
          banner
        );
        break;
      default:
        return await interaction.reply({
          content: `${miscConfig.emojis.alerttriangle} Invalid subcommand. `,
          flags: MessageFlags.Ephemeral,
        });
        break;
    }
  },
};

async function handleReviewVoid(
  interaction: ChatInputCommandInteraction,
  guildID: string,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  config: IConfig,
  member: GuildMember
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(`${config.reviewerRole}`))
    return await CInsufficientPermissionsR(interaction);

  const reviewId = interaction.options.getNumber("id", true);
  const reason = interaction.options.getString("reason", true);

  if (!reviewId || !reason)
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} Please provide a valid review ID and reason.`,
      flags: MessageFlags.Ephemeral,
    });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const review = await Review.findOne({
    guildId: guildID,
    reviewId: reviewId,
  });
  if (!review) {
    return await interaction.editReply({
      content: `No review found with ID \`${reviewId}\` in this server.`,
    });
  }
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Voiding Review Requested by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setTitle("Review Voiding")
    .setDescription(
      `You're about to void a review with the ID \`${reviewId}\`. Are you sure?\n\n**This will DM the reviewer about the voiding and its reason.**`
    )
    .addFields([
      {
        name: `${miscConfig.emojis.paperwriting} Reason for Voiding`,
        value: reason,
        inline: false,
      },
      {
        name: "Original Review Details",
        value: "\u200B",
        inline: false,
      },
      {
        name: `${miscConfig.emojis.badgeh} Designer`,
        value: `<@${review.designerId}>`,
        inline: true,
      },
      {
        name: `${miscConfig.emojis.user} Reviewer`,
        value: `<@${review.reviewerId}>`,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: `${miscConfig.emojis.star} Rating`,
        value: `${miscConfig.emojis.filledstar.repeat(
          review.rating
        )}${miscConfig.emojis.star.repeat(5 - review.rating)}`,
        inline: false,
      },
      {
        name: `${miscConfig.emojis.paperwriting} Comment`,
        value: review.comment || "No additional comments provided.",
        inline: false,
      },
      {
        name: `${miscConfig.emojis.customize} Related Order ID`,
        value: review.productId ? review.productId.toString() : "N/A",
        inline: true,
      },
    ])
    .setFooter({
      text: `Voiding Review ID: ${reviewId} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  const voidButton = new ButtonBuilder()
    .setCustomId(`t-void-review.${review.reviewId}.${interaction.user.id}`)
    .setLabel("Void Review")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(voidButton);

  const files = [logo];
  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && config.bannerUrl && !config.color) {
    embed.setImage(config.bannerUrl || "");
    embed.setColor("#000000");
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  try {
    ReviewVoid.insertOne({
      reviewId: review.reviewId,
      guildId: interaction.guild.id,
      reason: reason,
    })
    await interaction.editReply({
      content: "",
      embeds: [embed],
      components: [row],
      files,
    });
  } catch {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} An unexpected error occurred while executing this command. Please try again later.`,
    });
  }
}

async function handleReviewDesignerAverage(
  interaction: ChatInputCommandInteraction,
  guildID: string,
  config: any,
  member: GuildMember,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  const designer = interaction.options.getUser("designer", true);
  if (!designer) {
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} Please specify a designer.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!member.permissions.has(PermissionFlagsBits.SendMessages)) return await CInsufficientPermissionsR(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const reviews = await Review.find({
    guildId: guildID,
    designerId: designer.id,
  });

  if (!reviews || reviews.length === 0) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.alerttriangle} No reviews found for ${designer.username} in this server.`,
    });
  }

  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  const starCount = Math.round(averageRating);
  const starBar = `${miscConfig.emojis.filledstar.repeat(
    starCount
  )}${miscConfig.emojis.star.repeat(5 - starCount)} (${averageRating.toFixed(
    2
  )})`;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Average Rating for ${designer.username}`,
      iconURL: designer.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setTitle(`${designer.username || "Tropica"}'s Average Review Rating`)
    .addFields([
      {
        name: `${miscConfig.emojis.filledstar} Average Rating`,
        value: starBar,
        inline: true,
      },
    ])
    .setFooter({
      text: `Requested by ${interaction.user.username} | Powered by Tropica`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    });

  const files = [];

  if (!interaction.user.displayAvatarURL() || !designer.displayAvatarURL())
    files.push(logo);

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && config.bannerUrl && !config.color) {
    embed.setImage(config.bannerUrl || "");
    embed.setColor("#000000");
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

async function handleReviewServerAverage(
  interaction: ChatInputCommandInteraction,
  guildID: string,
  config: any,
  member: GuildMember,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.permissions.has(PermissionFlagsBits.SendMessages)) return await CInsufficientPermissionsR(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const reviews = await Review.find({ guildId: guildID });
  if (!reviews || reviews.length === 0) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.alerttriangle} No reviews found for this server.`,
    });
  }

  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating - fullStars >= 0.25 && averageRating - fullStars < 0.75 ? 1 : 0;
  const emptyStars = 5 - fullStars - hasHalfStar;

  const starBar = `${miscConfig.emojis.filledstar.repeat(fullStars)}${hasHalfStar ? miscConfig.emojis.halfstar : ''}${miscConfig.emojis.star.repeat(emptyStars)} (${averageRating.toFixed(2)})`;


  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Average Rating requested by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setTitle(`${interaction.guild.name || "Tropica"}'s Server Review Average`)
    .addFields([
      {
        name: `${miscConfig.emojis.filledstar} Average Rating`,
        value: starBar,
        inline: true,
      },
    ])
    .setFooter({
      text: `Review Module | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && config.bannerUrl && !config.color) {
    embed.setImage(config.bannerUrl || "");
    embed.setColor("#000000");
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

async function handleReviewCreate(
  interaction: ChatInputCommandInteraction,
  guildID: string,
  config: any,
  requiredRole: string,
  requiredChannel: string,
  member: GuildMember,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);


  const designer = interaction.options.getUser("designer", true);
  const product = interaction.options.getString("product", true);
  const rating = interaction.options.getNumber("rating", true);
  const comment =
    interaction.options.getString("comment") ||
    "No extra comments were provided.";
  const orderId = interaction.options.getNumber("order_id") || null;

  if (!designer || !product || !rating) return await CMissingRequiredFieldsR(interaction, ["designer", "product", "rating"]);

  if (member.id === designer.id) {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} You cannot review yourself.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const reviewChannel =
    interaction.guild.channels.cache.get(requiredChannel) ||
    (await interaction.guild.channels.fetch(requiredChannel));

  if (!reviewChannel || !reviewChannel.isTextBased())
    return CNotTextChannelR(interaction);

  const reviewID = generateRandomId();

  const newReview = new Review({
    designerId: designer.id,
    reviewerId: interaction.user.id,
    rating: rating.toFixed(0),
    comment: comment,
    product: product,
    guildId: guildID,
    productId: orderId,
    reviewId: reviewID,
  });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const fields = [
    {
      name: `${miscConfig.emojis.badgeh} Designer`,
      value: `${designer}`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.cart} Product`,
      value: product,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.star} Rating`,
      value: `${miscConfig.emojis.filledstar.repeat(
        rating
      )}${miscConfig.emojis.star.repeat(5 - rating)}`,
      inline: true,
    },
    {
      name: `${miscConfig.emojis.paperwriting} Additional Comments`,
      value: comment || "No additional comments provided.",
      inline: true,
    },
  ];

  if (orderId) {
    fields.push({
      name: `${miscConfig.emojis.customize} Order ID`,
      value: orderId.toString(),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Reviewed by ${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setTitle(`${interaction.guild.name || "Tropica's"} Designer Review`)
    .addFields(fields)
    .setFooter({
      text: `Review ID: ${reviewID} | Powered by Tropica`,
      iconURL: "attachment://tropica-logo.png",
    });

  const files = [logo];

  if (config && config.bannerUrl && config.color) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl);
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && config.bannerUrl && !config.color) {
    embed.setImage(config.bannerUrl);
    embed.setColor("#000000");
  } else {
    embed.setColor("#000000");
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  try {
    await newReview.save();
    await reviewChannel.send({
      content: `${designer}`,
      embeds: [embed],
      files: files,
    });
    return await interaction.editReply({
      content: `Your review has been successfully submitted in ${reviewChannel}! The team of ${interaction.guild.name} would like to thank you for leaving your review! \n ||Review ID: \`${reviewID}\`||`,
    });
  } catch {
    return await interaction.editReply({
      content:
        `${miscConfig.emojis.xemoji} There was an error submitting your review. Please try again later.`,
    });
  }
}
