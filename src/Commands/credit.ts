import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import config from "../config";

export default {
    data: new SlashCommandBuilder()
        .setName("credit")
        .setDescription("View the credits for this bot.")
        // credit create
        .addSubcommand((sc) => sc
            .setName("create")
            .setDescription("Allocate server credits to a user for future purchases or orders.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("Tag a user to whom you want to grant credits to.")
                .setRequired(true)
            )
            .addNumberOption((o) => o
                .setName("amount")
                .setDescription("Specify the number of credits to be awarded.")
                .setRequired(true)
            )
            .addStringOption((o) => o
                .setName("reason")
                .setDescription("Provide a reason for the credit allocation, which will be visible to the user.")
                .setRequired(false)
            )
        )
        .addSubcommand((sc) => sc
            .setName("view")
            .setDescription("View the total credits of a user.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("Tag a user to view their credits.")
                .setRequired(false)
            )
        )
        .addSubcommand((sc) => sc
            .setName("remove")
            .setDescription("Remove credits from a user.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("Tag a user to whom you want to remove credits from.")
                .setRequired(true)
            )
            .addNumberOption((o) => o
                .setName("amount")
                .setDescription("Specify the number of credits to be removed.")
                .setRequired(true)
            )
            .addStringOption((o) => o
                .setName("reason")
                .setDescription("Provide a reason for the credit removal, which will be visible to the user.")
                .setRequired(false)
            )
        )
    ,
}