import config from "../../config.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
  PermissionFlagsBits,
  GuildMember,
  Message,
} from "discord.js";
import ServerConfig from "../../Models/Config.js";
import { BInsufficientPermissionsFU, BInteractionNotInGuildFU, BNotConfiguredFU } from "../../Functions/interactionReturns.js";
import { Logger, LogType } from "../../Functions/Logger.js";

export default {
  customId: "t-order-log",

  async execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    try {
      await interaction.deferUpdate();
      if (interaction.customId.includes("t-order-log-paid.")) {
        return await handleOrderLogPaid(interaction);
      } else {
        Logger.log(LogType.Error, `Unhandled custom ID: ${interaction.customId}`);
      }
    } catch (err) {
      Logger.log(LogType.Error, `Error processing interaction: ${err}`);
      return await interaction.editReply({
        content:
          `${config.emojis.xemoji} An error occurred while processing your request. Please try again later.`,
        embeds: [],
        components: [],
      });
    }
  },
};


async function handleOrderLogPaid(
  interaction: ButtonInteraction,
) {
  if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

  const member = interaction.member as GuildMember;

  const sConfig = await ServerConfig.findOne({
    guildId: interaction.guild.id
  });

  if (!sConfig) return await BNotConfiguredFU(interaction);

  const requiredRole = (sConfig && sConfig.managementRole) || null;

  if (!requiredRole) return await BNotConfiguredFU(interaction);

  if (
    !member.roles.cache.has(requiredRole) &&
    !member.permissions.has(PermissionFlagsBits.ManageGuild) &&
    member.id !== interaction.guild.ownerId
  ) return await BInsufficientPermissionsFU(interaction);

  const [_, orderId] = interaction.customId.split(".");

  const message = interaction.message as Message;
  const orderEmbed = EmbedBuilder.from(message.embeds[0])
    .setColor(0x57F287)
    .setTitle(`${config.emojis.checkemoji} Order Paid | Marked as Paid by ${member.user.username} (${member.id})`);

  const orderPaidRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`t-order-log-paid.${orderId}`)
      .setLabel("Paid")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
  );

  await message.edit({
    embeds: [orderEmbed],
    components: [orderPaidRow],
    files: [],
  });

  return await interaction.followUp({
    content: `${config.emojis.checkemoji} Successfully marked the order (ID: \`${orderId}\`) as paid!`,
    flags: MessageFlags.Ephemeral,
  })
}