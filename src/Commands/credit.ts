import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    switch (subCommand) {
      case "create":
        const createdUser = interaction.options.getUser("user", true);
        const amount = interaction.options.getNumber("amount", true);
        const reason = interaction.options.getString("reason", false) || "No reason provided.";

        await interaction.editReply("Adding credits...");
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
