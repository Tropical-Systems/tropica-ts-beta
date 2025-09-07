import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Channel,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import ServerConfig, { IConfig } from "../Models/Config.js";
import Infract, { I_Infract } from "../Models/Infract.js";
import { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config.js";
import {
  generateRandomId,
} from "../Functions/misc-functions.js";
import miscConfig from "../config.js";
import { CInsufficientPermissionsR, CInteractionNotInGuild, CNotConfiguredR, CProvideId, CUnexpectedErrorER, CUnexpectedErrorR, CUserNotFoundR, CUserNotInGuildR } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("infraction")
    .setDescription("Manage infractions for staff members.")
    // Create command
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new infraction for a staff member.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to create an infraction for.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription(
              "The type of infraction (e.g. warning, strike, etc.)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the infraction.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("appealable")
            .setDescription("Is the infraction appealable?")
            .setRequired(true)
            .addChoices(
              { name: "Yes", value: "yes" },
              { name: "No", value: "no" }
            )
        )
    )
    // Search command
    .addSubcommand((subCommand) =>
      subCommand
        .setName("search")
        .setDescription("View an infraction via the infraction ID.")
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the infraction to search for.")
            .setRequired(true)
        )
    )
    // void command
    .addSubcommand((subCommand) =>
      subCommand
        .setName("void")
        .setDescription("Delete an infraction by its ID.")
        .addNumberOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the infraction to delete.")
            .setRequired(true)
        )
    )
    // history command
    .addSubcommand((sc) => sc.setName("history").setDescription("Interested to know the infraction history of a staff member? Use this command to view it!")
      .addUserOption((o) =>
        o.setName("user")
          .setDescription("The user to view the infraction history for.")
          .setRequired(true)
      )
    )
  ,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const guildId = interaction.guild!.id;
    const config = await ServerConfig.findOne({ guildId: guildId });

    if (!config) return await CNotConfiguredR(interaction);

    const requiredRole = (config && config.infractionRole) || null;
    const requiredChannel = (config && config.infractChannel) || null;
    const member = interaction.member as GuildMember;

    if (!requiredRole || !requiredChannel)
      return await CNotConfiguredR(interaction);

    if (!member.roles.cache.has(requiredRole))
      return await CInsufficientPermissionsR(interaction);

    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    switch (interaction.options.getSubcommand()) {
      case "create":
        await handleCreateInfraction(
          interaction,
          member,
          requiredRole,
          requiredChannel,
          config,
          logo,
          banner
        );
        break;
      case "search":
        await handleSearchInfraction(
          interaction,
          guildId,
          requiredRole,
          config,
          logo,
          banner,
          member
        );
        break;
      case "void":
        await handleVoidInfraction(
          interaction,
          guildId,
          requiredRole,
          config,
          logo,
          banner,
          member
        );
        break;
      case "history":
        await handleHistoryInfraction(
          interaction,
          guildId,
          requiredRole,
          config,
          logo,
          banner,
          member
        );
        break;

      default:
        return await interaction.reply({
          content: `${miscConfig.emojis.xemoji} Invalid subcommand.`,
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};


async function handleCallback(
  userDM: boolean = false,
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  files: AttachmentBuilder[],
  infraction: I_Infract
) {
  if (userDM) {
    try {
      const user = interaction.guild?.members.cache.get(
        `${infraction.infracteeId}`
      );
      if (!user) throw new Error("User not found in cache");

      await user.send({
        embeds: [embed],
        files,
      });
      return await interaction.editReply({
        embeds: [embed],
        files,
      });
    } catch (err) {
      return await interaction.editReply({
        content: `${miscConfig.emojis.alerttriangle} The Infraction was successfully voided, however I could not DM the user about it. Please inform them manually.`,
        embeds: [embed],
        files,
      });
    }
  } else {
    return await interaction.editReply({
      embeds: [embed],
      files,
    });
  }
}

async function handleCallbackWithCreate(
  channel: Channel,
  user: GuildMember,
  embed: EmbedBuilder,
  files: AttachmentBuilder[],
  interaction: ChatInputCommandInteraction
) {
  try {
    await user.send({
      content: `${miscConfig.emojis.shieldCheckIcon} You have been infracted in **${interaction.guild?.name}**.`,
      embeds: [embed],
      files,
    });

    return await interaction.editReply({
      content: `${miscConfig.emojis.checkemoji} The infraction was **successful** and the user was messaged. You can see the infraction in <#${channel.id}>.`,
    });
  } catch {
    return await interaction.editReply({
      content: `${miscConfig.emojis.alerttriangle} The infraction was **successful** but I could not DM the user about it. You can see the infraction in <#${channel.id}>.`,
    });
  }
}

async function handleCreateInfraction(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  requiredRole: string,
  requiredChannel: string,
  config: IConfig | null,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  const option = interaction.options;
  const user = option.getUser("user");
  const reason = option.getString("reason") || "No reason provided";
  const type = option.getString("type");
  const appealable = option.getString("appealable") === "yes";
  const infractionId = generateRandomId();

  if (!user) return await CUserNotFoundR(interaction, "user");

  const infracteeMember =
    interaction.guild.members.cache.get(user.id) ??
    (await interaction.guild.members.fetch(user.id));

  const guildMember = interaction.guild.members.cache.get(user.id) as GuildMember;

  if (!infracteeMember || !guildMember)
    return CUserNotInGuildR(interaction, guildMember);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  if (member.id === infracteeMember.id)
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} You cannot infract yourself!`,
      flags: MessageFlags.Ephemeral,
    });

  if (infracteeMember.roles.highest.position >= member.roles.highest.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} You **cannot** infract a member with a higher or equal role than yours!`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const newInfraction = new Infract({
      infractionId: infractionId,
      guildId: interaction.guild!.id,
      infracteeId: infracteeMember.id,
      infractorId: interaction.user.id,
      reason: reason,
      type: type,
      appealable: appealable,
      messageUrl: null,
    });

    await newInfraction.save();

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Infracted by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(`<@${infracteeMember.id}> has been infracted.`)
      .addFields([
        {
          name: `${miscConfig.emojis.pencil} Type of infraction:`,
          value: `${type}`,
          inline: true,
        },
        {
          name: `${appealable ? miscConfig.emojis.checkemoji : miscConfig.emojis.xemoji
            } Appealable:`,
          value: `${appealable ? "Yes" : "No"}`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.paperwriting} Reason:`,
          value: `${reason}`,
          inline: false,
        },
      ])
      .setFooter({
        text: `Infraction ID: ${infractionId} | Powered by Tropica`,
        iconURL: "attachment://tropica-logo.png",
      });

    const channel = await interaction.guild.channels.fetch(requiredChannel);


    if (
      channel &&
      channel.isTextBased() &&
      "send" in channel &&
      typeof channel.send === "function"
    ) {
      const files = [logo];

      if (config && config.color && config.bannerUrl) {
        embed.setColor(`#${config.color || "000000"}`);
        embed.setImage(config.bannerUrl || "");
      } else if (config && config.color && !config.bannerUrl) {
        embed.setColor(`#${config.color || "000000"}`);
        embed.setImage("attachment://tropica-banner.png");
        files.push(banner);
      } else if (config && config.bannerUrl && !config.color) {
        embed.setImage(config.bannerUrl || "").setColor("#000000");
      }
      else {
        embed.setImage("attachment://tropica-banner.png").setColor("#000000");
        files.push(banner);
      }

      const message = await channel.send({
        content: `<@${user!.id}>`,
        embeds: [embed],
        files,
      });

      if (message) {
        newInfraction.messageUrl = message.url;
        await newInfraction.save();
      }


      return await handleCallbackWithCreate(
        channel,
        infracteeMember,
        embed,
        files,
        interaction
      );
    }
  } catch (err) {
    console.error("Error creating infraction:", err);
    return await CUnexpectedErrorER(interaction);
  }
}

async function handleSearchInfraction(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  requiredRole: string,
  config: IConfig | null,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  member: GuildMember
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  const optionSearch = interaction.options;
  const infractionIdSearch = optionSearch.getNumber("id");

  if (!infractionIdSearch) return await CProvideId(interaction, "infraction");

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const infraction = await Infract.findOne({
      infractionId: infractionIdSearch,
      guildId: guildId,
    });

    if (!infraction)
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} No infraction found with ID \`${infractionIdSearch}\`. Please check the ID and try again.`,
      });


    const infractee = await interaction.guild.members.fetch(
      `${infraction.infracteeId}`
    );
    const infractor = await interaction.guild.members.fetch(
      `${infraction.infractorId}`
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Original Infraction given by ${infractor?.user.username || infraction.infractorId
          }`,
        iconURL:
          interaction.user.displayAvatarURL() ||
          "attachment://tropica-logo.png",
      })
      .addFields([
        {
          name: `${miscConfig.emojis.user} Infractee:`,
          value: `<@${infractee?.id || infraction.infracteeId}>`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.user} Infractor:`,
          value: `<@${infractor?.id || infraction.infractorId}>`,
          inline: true,
        },
        {
          name: `${infraction.appealable
            ? miscConfig.emojis.checkemoji
            : miscConfig.emojis.xemoji
            } Appealable:`,
          value: `${infraction.appealable ? "Yes" : "No"}`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.pencil} Type of Infraction:`,
          value: `${infraction.type}`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.paperwriting} Reason:`,
          value: `${infraction.reason}`,
          inline: true,
        },
      ])
      .setFooter({
        text: `Infraction ID: ${infraction.infractionId} | Powered by Tropica`,
        iconURL: "attachment://tropica-logo.png",
      });


    const files = [logo];


    if (config && config.color && config.bannerUrl) {
      embed.setColor(`#${config.color || "000000"}`);
      embed.setImage(config.bannerUrl || "");
    } else if (config && config.color && !config.bannerUrl) {
      embed.setColor(`#${config.color || "000000"}`);
      embed.setImage("attachment://tropica-banner.png");
      files.push(banner);
    } else if (config && config.bannerUrl && !config.color) {
      embed.setImage(config.bannerUrl || "").setColor("#000000");
    } else {
      embed.setColor("#000000");
      embed.setImage("attachment://tropica-banner.png");
      files.push(banner);
    }

    return await handleCallback(
      false,
      interaction,
      embed,
      files,
      infraction
    );

  } catch { return await CUnexpectedErrorER(interaction) }
}

async function handleVoidInfraction(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  requiredRole: string,
  config: IConfig | null,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  member: GuildMember
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  const optionVoid = interaction.options;
  const infractionIdVoid = optionVoid.getNumber("id");
  if (!infractionIdVoid)
    return await CProvideId(interaction, "infraction");

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const infraction = await Infract.findOne({
      infractionId: infractionIdVoid,
      guildId: guildId,
    });

    if (!infraction) {
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} No infraction found to be deleted with the ID of \`${infractionIdVoid}\`. Please check the ID and try again.`,
      });
    }

    if (infraction.appealable === false) {
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} This infraction is not voidable as it is not appealable.`,
      });
    }

    if (infraction.infracteeId === interaction.user.id) {
      return await interaction.editReply({
        content: `${miscConfig.emojis.xemoji} You **cannot** void your own infraction!`,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Infraction Deleted")
      .setDescription(`Your about to delete the infraction with ID \`${infraction.infractionId}\`.\n**This action cannot be undone!** \n Are you sure?`)
      .setFields([
        {
          name: `${miscConfig.emojis.user} Infractee:`,
          value: `<@${infraction.infracteeId}>`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.user} Infractor:`,
          value: `<@${infraction.infractorId}>`,
          inline: true,
        },
        {
          name: `${infraction.appealable
            ? miscConfig.emojis.checkemoji
            : miscConfig.emojis.xemoji
            } Appealable:`,
          value: `${infraction.appealable ? "Yes" : "No"}`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.pencil} Type of Infraction:`,
          value: `${infraction.type}`,
          inline: true,
        },
        {
          name: `${miscConfig.emojis.paperwriting} Reason:`,
          value: `${infraction.reason}`,
          inline: true,
        },


      ])
      .setFooter({
        text: `Powered by Tropica`,
        iconURL: "attachment://tropica-logo.png",
      });

    const confirmButton = new ButtonBuilder()
      .setCustomId(`t-void-infraction.${infraction.infractionId}`)
      .setLabel("Confirm Voidance")
      .setStyle(ButtonStyle.Danger)

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

    const files = [logo];

    if (config && config.color && config.bannerUrl) {
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
      embed.setImage("attachment://tropica-banner.png");
      embed.setColor("#000000");
      files.push(banner);
    }

    return await interaction.editReply({
      embeds: [embed],
      components: [row],
      files,
    });

  } catch { return await CUnexpectedErrorER(interaction) }
}

async function handleHistoryInfraction(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  requiredRole: string,
  config: IConfig,
  logo: AttachmentBuilder,
  banner: AttachmentBuilder,
  member: GuildMember
) {

  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);


  const user = interaction.options.getUser("user", true);

  if (!user || user.bot) {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} Please provide a valid user.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const displayLimit = 10;

  const infractHistory = await Infract.find({
    guildId: guildId,
    infracteeId: user.id,
  }).limit(displayLimit);

  if (infractHistory.length === 0) {
    return await interaction.editReply({
      content: `${miscConfig.emojis.xemoji} No infractions found for ${user.username}.`,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${user.username}'s Infraction History`,
      iconURL: user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(
      `Here are the infractions for <@${user.id}> in this ${interaction.guild.name}:`
    )
    .setFooter({
      text: `Total Infractions: ${infractHistory.length}`,
      iconURL: "attachment://tropica-logo.png",
    });

  const extraCount = infractHistory.length - displayLimit;

  infractHistory.slice(0, displayLimit).forEach((i) => {
    embed.addFields({
      name: `${miscConfig.emojis.pencil} Id: \`${i.infractionId}\``,
      value: `**Type:** ${i.type}\n**Reason:** ${i.reason}\n**Appealable:** ${i.appealable ? "Yes" : "No"}\n**Infractor:** <@${i.infractorId}>`,
      inline: false,
    })
  })

  if (extraCount > 0) {
    embed.addFields({
      name: `${miscConfig.emojis.alerttriangle} Extra Infractions`,
      value: `There are **${extraCount}** more infractions that are not displayed here.`,
      inline: false,
    })
  }

  const files = [logo];

  if (config && config.color && config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage(config.bannerUrl || "");
  } else if (config && config.color && !config.bannerUrl) {
    embed.setColor(`#${config.color || "000000"}`);
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  } else if (config && config.bannerUrl && !config.color) {
    embed.setImage(config.bannerUrl || "").setColor("#000000");
  } else {
    embed.setImage("attachment://tropica-banner.png");
    files.push(banner);
  }

  return await interaction.editReply({
    content: null,
    embeds: [embed],
    files,
  })
}
