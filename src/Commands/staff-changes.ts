import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  GuildMember,
  AttachmentBuilder,
  Client,
} from "discord.js";

import ServerConfig, { IConfig } from "../Models/Config.js";
import { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config.js";
import miscConfig from "../config.js";
import { CInsufficientPermissionsR, CInteractionNotInGuild, CNotConfiguredR, CNotTextChannelR } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Promote and Demote staff with these commands!")
    // Promote
    .addSubcommand((subcommand) =>
      subcommand
        .setName("promote")
        .setDescription("Issue an promotion to one of your staff members.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you wish to promote")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("old-rank")
            .setDescription("The current rank of the staff member")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("new-rank")
            .setDescription("THe new rank of the staff member")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the promotion")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription("Any additional notes for the promotion")
            .setRequired(false)
        )
    )
    // Demote
    .addSubcommand((subCommand) =>
      subCommand
        .setName("demote")
        .setDescription("Issue a demotion for a staff member")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you wish to demote")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("old-rank")
            .setDescription("The current rank of the staff member")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("new-rank")
            .setDescription("The new rank of the staff member")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the demotion")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription("Any additional notes for the demotion")
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {

    if (!interaction.guild) return await CInteractionNotInGuild(interaction);

    const guildID = interaction.guild.id;

    const config = await ServerConfig.findOne({ guildId: guildID });

    if (!config) return await CNotConfiguredR(interaction);

    const requiredRole = (config && config.managementRole) || null;
    const requiredPromotionChannel =
      (config && config.promotionChannel) || null;
    const requiredDemotionChannel = (config && config.demotionChannel) || null;

    if (!requiredRole || !requiredPromotionChannel || !requiredDemotionChannel)
      return await CNotConfiguredR(interaction);

    const member = interaction.member as GuildMember;

    if (!member.roles.cache.has(requiredRole))
      return await CInsufficientPermissionsR(interaction);

    const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
      name: "tropica-logo.png",
    });

    const attachment = new AttachmentBuilder(TROPICA_BANNER_PATH, {
      name: "tropica-banner.png",
    });

    switch (interaction.options.getSubcommand()) {
      case "promote":
        await handlePromotion(
          interaction,
          config,
          requiredRole,
          requiredPromotionChannel,
          attachment,
          logo,
          member
        );
        break;
      case "demote":
        await handleDemotion(
          interaction,
          config,
          requiredRole,
          requiredDemotionChannel,
          attachment,
          logo,
          member
        );
        break;

      default:
        return await interaction.reply({
          content: `${miscConfig.emojis.shield} Invalid subcommand.`,
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};

async function handleDemotion(
  interaction: ChatInputCommandInteraction,
  config: IConfig,
  requiredRole: string,
  requiredDemotionChannel: string,
  bannerAttachment: AttachmentBuilder,
  logoAttachment: AttachmentBuilder,
  executor: GuildMember
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  if (!executor.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  const demoteUser = interaction.options.getUser("user", true);
  const oldRank = interaction.options.getRole("old-rank", true);
  const newRank = interaction.options.getRole("new-rank", true);
  const reason = interaction.options.getString("reason", true);
  const notes = interaction.options.getString("notes") || "No notes provided.";

  if (demoteUser.id === interaction.user.id) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** demote yourself.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (executor.roles.highest.position <= oldRank.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** demote someone whose current rank is higher than or equal to your highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (newRank.position >= oldRank.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** demote a user to a rank that is the same or higher than their current rank.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (newRank.position >= executor.roles.highest.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** demote a user to a role that is higher than or equal to your highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const botMember = interaction.guild.members.me;
  if (!botMember) {
    return await interaction.reply({
      content: `${miscConfig.emojis.xemoji} I am not a member of this server.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (botMember.roles.highest.position <= oldRank.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} I cannot remove the old rank because it is higher than or equal to my highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (botMember.roles.highest.position <= newRank.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} I cannot assign the new rank because it is higher than or equal to my highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  let targetMember: GuildMember;
  try {
    targetMember = await interaction.guild.members.fetch(demoteUser.id);
  } catch {
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} I could not fetch the target user. They might have left or their ID is invalid.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!targetMember.roles.cache.has(oldRank.id)) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} The user does not currently have the old rank ${oldRank}, so demotion can't proceed.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.guild.name} Demotion`)
    .setAuthor({
      name: `Demoted by @${interaction.user.username}`,
      iconURL:
        interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setDescription(
      `We regret to inform that ${demoteUser} has been demoted. You can see the details below.`
    )
    .addFields([
      { name: "Old Rank:", value: `${oldRank}`, inline: true },
      { name: "New Rank:", value: `${newRank}`, inline: true },
      { name: "Reason for Demotion:", value: reason, inline: true },
      { name: "Notes:", value: notes, inline: false },
    ]);

  const files: AttachmentBuilder[] = [];
  if (config?.color) {
    embed.setColor(`#${config.color}`);
  } else {
    embed.setColor("#000000");
  }

  if (config?.bannerUrl) {
    embed.setImage(config.bannerUrl);
  } else {
    embed.setImage("attachment://tropica-banner.png");
    files.push(bannerAttachment);
  }

  if (!interaction.user.displayAvatarURL()) {
    files.push(logoAttachment);
  }

  // Perform role swap with best-effort rollback logic
  let roleChangeStatus: string;
  try {
    await targetMember.roles.remove(oldRank.id);
    await targetMember.roles.add(newRank.id);
    roleChangeStatus = `${miscConfig.emojis.checkemoji} Successfully removed ${oldRank} and added ${newRank} to ${demoteUser}.`;
  } catch {
    const hasOld = targetMember.roles.cache.has(oldRank.id);
    const hasNew = targetMember.roles.cache.has(newRank.id);
    if (!hasOld && !hasNew) {
      roleChangeStatus = `${miscConfig.emojis.alerttriangle} Failed to remove the old rank and assign the new one. Manual intervention required.`;
    } else if (!hasOld && hasNew) {
      roleChangeStatus = `${miscConfig.emojis.checkemoji} I assigned the new rank but old rank removal state is ambiguous.`;
    } else if (hasOld && !hasNew) {
      roleChangeStatus = `${miscConfig.emojis.alerttriangle} Could not assign the new rank; the old rank remains.`;
    } else {
      roleChangeStatus = `${miscConfig.emojis.alerttriangle} Unexpected role state encountered; please verify manually.`;
    }
  }

  const channel = await interaction.guild.channels.fetch(requiredDemotionChannel);
  if (!channel || !channel.isTextBased()) {
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} The configured demotion channel is invalid or not text-based.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await channel.send({
      content: `${demoteUser}`,
      embeds: [embed],
      files,
    });
  } catch {
    return await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} Demotion applied but failed to post the announcement. ${roleChangeStatus}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  return await interaction.reply({
    content: `${miscConfig.emojis.checkemoji} **Demotion processed.** ${demoteUser} has been moved from ${oldRank} to ${newRank}. Announcement sent in <#${channel.id}>.\n${roleChangeStatus}`,
    flags: MessageFlags.Ephemeral,
  });
}


async function handlePromotion(
  interaction: ChatInputCommandInteraction,
  config: IConfig,
  requiredRole: string,
  requiredPromotionChannel: string,
  attachment: AttachmentBuilder,
  logo: AttachmentBuilder,
  member: GuildMember
) {
  if (!interaction.guild) return await CInteractionNotInGuild(interaction);

  // Permission guard
  if (!member.roles.cache.has(requiredRole))
    return await CInsufficientPermissionsR(interaction);

  const promoteUser = interaction.options.getUser("user", true);
  const oldRank = interaction.options.getRole("old-rank", true);
  const newRank = interaction.options.getRole("new-rank", true);
  const reason = interaction.options.getString("reason", true);
  const notes = interaction.options.getString("notes") || "No notes provided.";

  // Self-promotion guard
  if (promoteUser.id === interaction.user.id) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** promote yourself.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Role hierarchy guards
  if (newRank.position >= member.roles.highest.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** promote a user to a role that is higher than or equal to your highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (newRank.position <= oldRank.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} You **cannot** promote a user to a rank that is the same or lower than their old rank (${oldRank}).`,
      flags: MessageFlags.Ephemeral,
    });
  }

  let targetMember: GuildMember;
  try {
    targetMember = await interaction.guild.members.fetch(promoteUser.id);
  } catch (err) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} Could not fetch the target user. Are they in the server?`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const currentHighest = targetMember.roles.highest;

  if (!targetMember.roles.cache.has(oldRank.id)) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} The user does not currently have the old rank ${oldRank}, so promotion can't proceed.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const botMember = interaction.guild.members.me;
  if (!botMember) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} I'm not a member of this server.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (newRank.position >= botMember.roles.highest.position) {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} I **cannot** promote a user to a role that is higher than or equal to my highest role.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Build base embed
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Promoted by @${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL() || "attachment://tropica-logo.png",
    })
    .setTitle(
      `${miscConfig.emojis.confettiIcon} ${interaction.guild.name} Promotion ${miscConfig.emojis.confettiIcon}`
    )
    .setDescription(
      `Congratulations to ${promoteUser} on their promotion! React below to send your congratulations!`
    )
    .addFields([
      { name: "Old Rank:", value: `${oldRank}`, inline: true },
      { name: "New Rank:", value: `${newRank}`, inline: true },
      { name: "Reason for Promotion:", value: reason, inline: true },
      { name: "Notes:", value: notes, inline: false },
    ]);

  // Embed appearance logic
  const files: any[] = [];
  if (config?.color) {
    embed.setColor(`#${config.color}`);
  } else {
    embed.setColor("#000000");
  }

  if (config?.bannerUrl) {
    embed.setImage(config.bannerUrl);
  } else {
    embed.setImage("attachment://tropica-banner.png");
    files.push(attachment);
  }

  if (!interaction.user.displayAvatarURL()) {
    files.push(logo);
  }

  // Fetch the promotion channel
  let channel: any;
  try {
    channel = await interaction.guild.channels.fetch(requiredPromotionChannel);
  } catch {
    return await interaction.reply({
      content: `${miscConfig.emojis.shield} Could not fetch the promotion channel. Does it exist?`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!channel || !channel.isTextBased()) {
    return await CNotTextChannelR(interaction);
  }

  // Send promotion announcement
  let announcementMessage;
  try {
    announcementMessage = await channel.send({
      content: `${promoteUser}`,
      embeds: [embed],
      files,
    });
    try {
      await announcementMessage.react(miscConfig.emojis.confettiIcon);
    } catch {
      // swallow reaction failure but log if you have logging
    }
  } catch (err) {
    await interaction.reply({
      content: `${miscConfig.emojis.alerttriangle} Failed to send the promotion announcement.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Final reply to invoker
  await interaction.reply({
    content: `${miscConfig.emojis.checkemoji} **Promotion processed** for ${promoteUser} to ${newRank}. The promotion message has been sent in <#${channel.id}>.`,
    flags: MessageFlags.Ephemeral,
  });

  let extraMessage = "";
  try {
    await targetMember.roles.remove(oldRank.id);
  } catch (err) {
    extraMessage += `${miscConfig.emojis.alerttriangle} Failed to remove old rank ${oldRank}. `;
  }

  try {
    await targetMember.roles.add(newRank.id);
  } catch (err) {
    extraMessage += `${miscConfig.emojis.alerttriangle} Failed to add new rank ${newRank}. `;
  }

  if (!extraMessage) {
    extraMessage = `${miscConfig.emojis.checkemoji} Successfully removed the old rank and added the new rank to ${promoteUser}.`;
  } else if (extraMessage.includes("Failed to remove") && !extraMessage.includes("Failed to add")) {
    extraMessage = `${miscConfig.emojis.alerttriangle} Old rank removal failed; new rank may or may not have been added. Please verify manually.`;
  } else if (!extraMessage.includes("Failed to remove") && extraMessage.includes("Failed to add")) {
    extraMessage = `${miscConfig.emojis.alerttriangle} New rank addition failed; old rank was removed. Please fix manually.`;
  } else {
    extraMessage = `${miscConfig.emojis.alerttriangle} Both role (removing and adding) modifications failed. Please do it manually.`;
  }

  return await interaction.followUp({
    content: extraMessage,
    flags: MessageFlags.Ephemeral,
  });
}


