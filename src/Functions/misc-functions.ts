import TropicaGuild from "../Models/Guild.js";
import {
  Guild,
  MessageFlags,
  Client,
  EmbedBuilder,
  AttachmentBuilder,
  AnySelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextChannel,
  NewsChannel,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import Config from "../Models/Config.js";
import config, { TROPICA_LOGO_PATH } from "../config.js";
import ExcludedGuilds from "../Models/ExcludedGuilds.js";

const attachment = new AttachmentBuilder(TROPICA_LOGO_PATH, {
  name: "tropica-logo.png",
});

export async function handleGuildConfigCreation(guildId: String) {
  var config = await Config.findOne({ guildId: guildId });
  if (!config) {
    const newConfig = new Config({
      guildId: guildId,
      bannerUrl: null,

      infractionRole: null,
      infractChannel: null,

      demotionChannel: null,
      promotionChannel: null,
      managementRole: null,

      reviewChannel: null,
      reviewerRole: null,

      orderLogChannel: null,
      orderLogRole: null,

      qcApprover: null,
      qcChannel: null,
    });
    console.log(
      `[System | GuildCreation]: Created config for guild ${guildId}`
    );
    await newConfig.save();
  } else {
    console.log(
      `[System | GuildCreation]: Config for guild ${guildId} already exists.`
    );
  }
}

export async function handleGuildCreation(guild: Guild) {
  const guildId = guild.id;
  const guildName = guild.name;
  const guildIcon = guild.iconURL() || null;
  const guildBanner = guild.bannerURL() || null;

  var existingGuild = await TropicaGuild.findOne({ guildId: guildId });
  if (!existingGuild) {
    const newGuild = new TropicaGuild({
      guildId: guildId,
      guildName: guildName,
      guildIcon: guildIcon,
      guildBanner: guildBanner,
    });
    console.log(`[System | GuildCreation]: Created guild ${guildName}`);
    await newGuild.save();
  } else {
    console.log(`[System | GuildCreation]: Guild ${guildName} already exists.`);
    existingGuild.guildName = guildName;
    existingGuild.guildIcon = guildIcon;
    existingGuild.guildBanner = guildBanner;
    await existingGuild.save();
    console.log(
      `[System | GuildCreation]: Updated guild ${guildName} information.`
    );
  }
}

export async function handleGuildDeletion(guildId: String) {
  const existingGuild = await TropicaGuild.findOne({ guildId: guildId });
  if (existingGuild) {
    await TropicaGuild.deleteOne({ guildId: guildId });
    console.log(`[System | GuildDeletion]: Deleted guild with ID ${guildId}`);
  } else {
    console.log(
      `[System | GuildDeletion]: Guild with ID ${guildId} does not exist.`
    );
  }
}

export async function handleGuildConfigDeletion(guildId: String) {
  const existingConfig = await Config.findOne({ guildId: guildId });
  if (existingConfig) {
    await Config.deleteOne({ guildId: guildId });
    console.log(
      `[System | GuildDeletion]: Deleted config for guild ${guildId}`
    );
  } else {
    console.log(
      `[System | GuildDeletion]: Config for guild ${guildId} does not exist.`
    );
  }
}

export async function logGuildCreation(guild: Guild, client: Client) {
  const TropicaMain = await client.guilds.cache.get(config.tropica_main_id);
  if (!TropicaMain) return;

  if ((await ExcludedGuilds.findOne({ guildId: guild.id })))
    return await handleGuildPossibleExclusion(guild);

  await handleGuildPossibleExclusion(guild);

  const logChannel = TropicaMain.channels.cache.find(
    (channel) => channel.id === config.tropica_main_join_logs_id
  );
  if (logChannel && logChannel.isTextBased()) {
    const embed = new EmbedBuilder()
      .setTitle("Tropica has joined a new server!")
      .setDescription(
        `**Name:** ${guild.name}\n**Owner ID:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n**Guild ID:** \`${guild.id}\`\n\n**Our new total servers:** ${client.guilds.cache.size}`
      )
      .setThumbnail(guild.iconURL() || "attachment://tropica-logo.png")
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId("t-exclusion-trigger." + guild.id)
      .setLabel("Exclude Guild (Executive Team Only)")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    if (!guild.iconURL()) {
      await logChannel.send({
        embeds: [embed],
        files: [attachment],
        components: [row],
      });
    } else {
      await logChannel.send({ embeds: [embed], files: [], components: [row] });
    }
  }
}

async function handleGuildPossibleExclusion(guild: Guild) {
  return;
//   try {
//     const excluded = await ExcludedGuilds.findOne({ guildId: guild.id });
//     if (!excluded) return;

//     const firstTextBased = guild.channels.cache.find(
//       (c): c is TextChannel | NewsChannel =>
//         (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
//         c.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
//     );

//     if (firstTextBased) {
//       const embed = new EmbedBuilder()
//         .setTitle("Tropica | Guild Excluded")
//         .setDescription(
//           `Dear members of **${guild.name}**,\n\nThis server has previously been excluded from using Tropica services.\n\n**Reason for Exclusion:**\n${excluded.reason}\n\nBest regards,\nThe Tropica Team`
//         )
//         .setColor("#FF0000")
//         .setFooter({
//           text: "Tropica | Powered by Tropica",
//           iconURL: "attachment://tropica-logo.png",
//         })
//         .setTimestamp();

//       const attachment = new AttachmentBuilder(TROPICA_LOGO_PATH, {
//         name: "tropica-logo.png",
//       })

//       await firstTextBased.send({ embeds: [embed], files: [attachment] });
//     }

//     await guild.leave();
//     console.log(`[System | GuildCreation | Excluded]: Left guild: ${guild.name} (${guild.id})`);
//   } catch (error) {
//     console.error(`[System | Failure]: Failed to handle excluded guild ${guild.id}:`, error);
//   }
// }

// export async function logGuildDeletion(guild: Guild, client: Client) {
//   const TropicaMain = client.guilds.cache.get(config.tropica_main_id);
//   if (!TropicaMain) return;

//   if ((await ExcludedGuilds.findOne({ guildId: guild.id }))) return;

//   const logChannel = TropicaMain.channels.cache.find(
//     (channel) => channel.id === config.tropica_main_leave_logs_id
//   );
//   if (logChannel && logChannel.isTextBased()) {
//     const embed = new EmbedBuilder()
//       .setTitle("Tropica has left a server!")
//       .setDescription(
//         `**Name:** ${guild.name}\n**Owner ID:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n**Guild ID:** ${guild.id}\n\n**Our new total servers:** ${client.guilds.cache.size}`
//       )
//       .setTimestamp()
//       .setThumbnail(guild.iconURL() || "attachment://tropica-logo.png");

//     if (!guild.iconURL()) {
//       await logChannel.send({
//         embeds: [embed],
//         files: [attachment],
//       });
//     } else {
//       await logChannel.send({ embeds: [embed], files: [] });
//     }
//   }
}

export async function handleUnauthorizedMenu(
  interaction: AnySelectMenuInteraction
) {
  return interaction.reply({
    content: `${config.emojis.alerttriangle} Insufficient permissions to use this menu.`,
    flags: MessageFlags.Ephemeral,
  });
}

export function taxPrice(price: number, taxRate: number): string {
  const tax = (price * taxRate) / 0.7;
  return tax.toFixed(0);
}

export function generateRandomId() {
  return Math.floor(Math.random() * 1000000);
}

export function formatDuration(duration: string): string | null {
  const match = duration.match(/^(\d+)\s?([dmywh])$/i);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const unitsMap: Record<typeof unit, String> = {
    h: "hour",
    d: "day",
    w: "week",
    m: "month",
    y: "year",
  };

  const unitFull = `${unitsMap[unit]}` || unit;

  // Pluralize if needed
  return `${amount} ${unitFull}${amount !== 1 ? "s" : ""}`;
}

export function handleStringFormattingToWithoutArrow(str: string): string {
  return str.replace("_", " ");
}