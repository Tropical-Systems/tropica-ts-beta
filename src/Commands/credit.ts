import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import miscConfig from "../config.js";
import Credit, { ICredit } from "../Models/Credit.js";

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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    switch (subCommand) {
      case "create":
        const createdUser = interaction.options.getUser("user", true);
        const amount = interaction.options.getNumber("amount", true);
        const reason = interaction.options.getString("reason", false) || "No reason provided.";

        var credit = await Credit.findOne({ guildId: interaction.guild.id, userId: createdUser.id });

        if (amount <= 0) {
          return interaction.editReply("Amount of issued credits must be greater than 0.");
        }

        if (!credit) {
          const newCredit = new Credit({
            guildId: interaction.guild.id,
            userId: createdUser.id,
            amount: amount,

            lastEdit: new Date()
          });

          await newCredit.save();
        }

        credit = await Credit.findOne({ guildId: interaction.guild.id, userId: createdUser.id });

        const newAmount = (credit ? credit.creditPoints + amount : amount);

        credit!.creditPoints = newAmount;
        credit!.lastEdit = new Date();
        credit!.lastEditedCommand = "create";
        await credit!.save();

        const embed = new EmbedBuilder()
          .setTitle(`${interaction.guild.name || "Tropica"}'s | Credit Allocation`)
          .setDescription(`${interaction.user} has allocated ${miscConfig.emojis.filleddollar} \`${amount}\` credits to ${createdUser}.\n\n**Reason:** ${reason}\n\nTheir new total is \`${newAmount}\` credits.`)
          .setTimestamp();


        const userEmbed = new EmbedBuilder()
          .setTitle(`${interaction.guild.name} | Credit Allocation`)
          .setDescription(`Dear ${createdUser},\n\nYou have been allocated ${miscConfig.emojis.filleddollar} \`${amount}\` credits by ${interaction.user} in **${interaction.guild.name}**.\n\n**Reason:** ${reason}\n\nYou can view your credits by using the \`/credit view\` command.`)
          .addFields([
            {
              name: `${miscConfig.emojis.filleddollar} Total Credits in ${interaction.guild.name}`,
              value: `\`${newAmount}\``,
            },
            {
              name: "Link to Server",
              value: `[Click Here](https://discord.com/channels/${interaction.guild.id})`,
            }
          ])
          .setTimestamp();

        const user = await interaction.guild.members.fetch(createdUser.id).catch(() => null);
        if (user) {
          try {
            await user.send({ embeds: [userEmbed] });
          } catch { }
        }

        await interaction.editReply({ embeds: [embed] });

        break;

      case "remove":
        await interaction.editReply("Removing credits...");
        break;

      case "view":
        await interaction.editReply("Viewing credits...");
        break;

      default:
        await interaction.editReply("Invalid subcommand.");
    }
  },
};
