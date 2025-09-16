import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";
import miscConfig, { TROPICA_BANNER_PATH } from "../config.js";
import Credit, { ICredit } from "../Models/Credit.js";
import Config from "../Models/Config.js";
import { CExecutorNotInGuildER, CInsufficientPermissionsER, CInsufficientPermissionsFU, CInteractionNotInGuild, CInteractionNotInGuildER, CNotConfiguredER } from "../Functions/interactionReturns.js";

export default {
  data: new SlashCommandBuilder()
    .setName("credit")
    .setDescription("View or manage credits for this bot.")
    .addSubcommand(sc =>
      sc
        .setName("create")
        .setDescription("Allocate server credits to a user for future purchases or orders.")
        .addUserOption(o =>
          o.setName("user").setDescription("Tag a user to grant credits to.").setRequired(true)
        )
        .addNumberOption(o =>
          o.setName("amount").setDescription("Number of credits to award.").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("reason").setDescription("Reason for allocation.").setRequired(false)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName("view")
        .setDescription("View the total credits of a user.")
        .addUserOption(o =>
          o.setName("user").setDescription("Select a user to view credits.").setRequired(false)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName("remove")
        .setDescription("Remove credits from a user.")
        .addUserOption(o =>
          o.setName("user").setDescription("User to remove credits from.").setRequired(true)
        )
        .addNumberOption(o =>
          o.setName("amount").setDescription("Number of credits to remove.").setRequired(true)
        )
        .addStringOption(o =>
          o.setName("reason").setDescription("Reason for removal.").setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral
      });
    }

    const TropicaBanner = new AttachmentBuilder(TROPICA_BANNER_PATH, { name: "tropica-banner.png" });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const interactionUser = await interaction.guild.members.fetch(interaction.user.id).catch(() => null) as GuildMember;

    if (!interactionUser) return await CExecutorNotInGuildER(interaction);

    const guildConfig = await Config.findOne({ guildId: interaction.guild.id });
    if (!guildConfig) return await CNotConfiguredER(interaction);
    const requiredRole = guildConfig.creditManagerRole;
    const requiredChannel = guildConfig.creditLogChannel;
    if (!requiredRole) return await CNotConfiguredER(interaction);
    var errorMessage = "-# This server does not have a credit log channel set up. All credit allocations and removals will not be logged until one is configured.";
    const creditLogChannel = interaction.guild.channels.cache.find(c => c.id === requiredChannel);
    const creditManagerRole = interaction.guild.roles.cache.find(r => r.id === requiredRole);

    if (!creditManagerRole) return await CNotConfiguredER(interaction);
    if (requiredChannel && creditLogChannel) errorMessage = "";

    switch (subCommand) {
      case "create":
        const createdUser = interaction.options.getUser("user", true);
        const amount = interaction.options.getNumber("amount", true);
        const reason = interaction.options.getString("reason", false) || "No reason provided.";

        if (interaction.user.bot) return interaction.editReply("Bots cannot allocate credits.");
        if (!interactionUser.roles.cache.has(creditManagerRole.id)) return CInsufficientPermissionsER(interaction);
        if (!interaction.guild) return await CInteractionNotInGuildER(interaction);
        if (createdUser.bot) return interaction.editReply("You cannot allocate credits to bots.");

        if (amount <= 0) {
          return interaction.editReply("Amount of issued credits must be greater than 0.");
        }

        var credit = await Credit.findOne({ guildId: interaction.guild.id, userId: createdUser.id });

        if (!credit) {
          const newCredit = new Credit({
            guildId: interaction.guild.id,
            userId: createdUser.id,
            amount: amount,
            lastEdit: new Date(),
          });

          await newCredit.save();
        }

        credit = await Credit.findOne({ guildId: interaction.guild.id, userId: createdUser.id });

        const newAmount = (credit ? credit.creditPoints + amount : amount);

        credit!.creditPoints = newAmount;
        credit!.lastEdit = new Date();
        credit!.lastEditedCommand = "create";
        await credit!.save();

        const logEmbed = new EmbedBuilder()
          .setTitle(`Credit Allocation`)
          .setDescription(`A new allocation has been made.`)
          .addFields([
            {
              name: `${miscConfig.emojis.user} Allocated By`,
              value: `${interactionUser}`,
              inline: true
            },
            {
              name: `${miscConfig.emojis.user} Allocated To`,
              value: `${createdUser} (\`${createdUser.id}\`)`,
              inline: true
            },
            {
              name: `${miscConfig.emojis.paperwriting} Reason`,
              value: reason,
              inline: false
            },
            {
              name: `${miscConfig.emojis.dollar} Amount Allocated`,
              value: `\`${amount}\` credits`,
              inline: true
            },
            {
              name: `${miscConfig.emojis.filleddollar} New Total`,
              value: `\`${newAmount}\` credits`,
              inline: true
            }
          ]).setColor("Green")
          .setTimestamp();

        const userEmbed = new EmbedBuilder()
          .setTitle(`${interaction.guild.name} | Credit Allocation`)
          .setDescription(`Dear ${createdUser},\n\nYou have been allocated ${miscConfig.emojis.filleddollar} \`${amount}\` credits by ${interaction.user} in **${interaction.guild.name}**.\n\n**Reason:** ${reason}\n\nYou can view your credits by using the \`/credit view\` command.`)
          .addFields([
            {
              name: `${miscConfig.emojis.filleddollar} Total Credits in ${interaction.guild.name}`,
              value: `\`${newAmount}\``,
            },
          ])
          .setTimestamp()
          .setColor("Green");

        const linkButton = new ButtonBuilder()
          .setLabel("Go to Server")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}`);

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

        var executorResponse = `${miscConfig.emojis.confettiIcon} Allocation successfull!! You have allocated \`${amount}\` credits to ${createdUser}.`
        if (errorMessage) {
          executorResponse += `\n\n${miscConfig.emojis.alerttriangle} **Please note the following:**\n${errorMessage}`;
        }

        await createdUser.send({ embeds: [userEmbed], components: [buttonRow] }).catch(() => null);
        if (creditLogChannel && creditLogChannel.isTextBased()) await creditLogChannel.send({ embeds: [logEmbed] }).catch(() => null);
        return await interaction.editReply({ content: executorResponse });
        break;

      case "view":
        const viewedUser = interaction.options.getUser("user", false) || interaction.user;

        if (!interaction.guild) return await CInteractionNotInGuildER(interaction);

        if (viewedUser.bot) return interaction.editReply(`${miscConfig.emojis.xemoji} Bots do not have credit accounts.`);

        var viewedCredit = await Credit.findOne({ guildId: interaction.guild.id, userId: viewedUser.id }) as ICredit | null;

        const files = [];
        if (viewedUser === interaction.user) {

          const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name || "Tropica"} | Your Credits`)
            .setDescription(`You have \`${viewedCredit ? viewedCredit.creditPoints : 0}\` credits.`).setTimestamp()
            .setColor(guildConfig && guildConfig.color ? `#${guildConfig.color || "000000"}` : "#000000");

          if (guildConfig && guildConfig.bannerUrl) {
            embed.setImage(guildConfig.bannerUrl);
          } else {
            embed.setImage("attachment://tropica-banner.png");
            files.push(TropicaBanner);
          }

          await interaction.editReply({ embeds: [embed], files: files });
        } else {
          if (!interactionUser.roles.cache.has(creditManagerRole.id)) return CInsufficientPermissionsER(interaction);

          const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name || "Tropica"} | ${viewedUser.username}'s Credits`)
            .setDescription(`${viewedUser} has \`${viewedCredit ? viewedCredit.creditPoints : 0}\` credits.`).setTimestamp()
            .setColor(guildConfig && guildConfig.color ? `#${guildConfig.color || "000000"}` : "#000000");

          if (guildConfig && guildConfig.bannerUrl) {
            embed.setImage(guildConfig.bannerUrl);
          } else {
            embed.setImage("attachment://tropica-banner.png");
            files.push(TropicaBanner);
          }
          await interaction.editReply({ embeds: [embed], files: files });
        }
        break;
      case "remove":

      return await interaction.editReply("This subcommand is currently disabled for maintenance. Please try again later.");
        // const removedUser = interaction.options.getUser("user", true);
        // const removeAmount = interaction.options.getNumber("amount", true);
        // const removeReason = interaction.options.getString("reason", false) || "No reason provided.";

        // if (interaction.user.bot) return interaction.editReply(`${miscConfig.emojis.xemoji} Bots cannot remove credits.`);
        // if (!interactionUser.roles.cache.has(creditManagerRole.id)) return CInsufficientPermissionsER(interaction);
        // if (!interaction.guild) return await CInteractionNotInGuildER(interaction);
        // if (removedUser.bot) return interaction.editReply(`${miscConfig.emojis.xemoji} You cannot remove credits from bots.`);
        // if (removedUser.id === interaction.user.id) return interaction.editReply(`${miscConfig.emojis.alerttriangle} You cannot remove credits from yourself.`);
        // if (removeAmount <= 0) return interaction.editReply(`${miscConfig.emojis.alerttriangle} Amount of removed credits must be greater than 0.`);

        // var removedCredit = await Credit.findOne({ guildId: interaction.guild.id, userId: removedUser.id });
        
        // if (!removedCredit || removedCredit.creditPoints <= 0) return interaction.editReply(`${miscConfig.emojis.xemoji} This user does not have any credits to remove.`);
        // if (removeAmount > removedCredit.creditPoints) return interaction.editReply(`${miscConfig.emojis.alerttriangle} You cannot remove more credits than this user currently has.`);



        break;


      default:
        await interaction.editReply(`${miscConfig.emojis.alerttriangle} Invalid subcommand.`);
    }
  },
};





