import config from "../../config.js";
import {
    ActionRowBuilder,
    ButtonInteraction,
    GuildMember,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import { BInsufficientPermissionsFU } from "../../Functions/interactionReturns.js";

const TROPICA_Executive_Team_Role_ID = config.executive_team_role_id;

export default
    {
        customId: "t-exclusion-trigger",
        async execute(interaction: ButtonInteraction) {
            if (!interaction.guild || !interaction.member) return;
            const member = interaction.member as GuildMember;

            if (!interaction.isButton()) return;
            if (!interaction.customId.includes("t-exclusion-trigger")) return;

            if (!member.roles.cache.has(TROPICA_Executive_Team_Role_ID) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
                return BInsufficientPermissionsFU(interaction);
            }

            return;

            // const buttonfetchedGuildID = interaction.customId.split(".")[1];

            // const exclusionModal = new ModalBuilder()
            //     .setCustomId(`t-exclusionModal.reason.${buttonfetchedGuildID}`)
            //     .setTitle('Exclude Guild | Reason');

            // const textInput = new TextInputBuilder()
            //     .setCustomId(`t-exclusionModal.reasonInput`)
            //     .setLabel("Reason for excluding this guild")
            //     .setStyle(TextInputStyle.Paragraph)
            //     .setMinLength(10)
            //     .setMaxLength(200)
            //     .setPlaceholder("Enter the reason here...")
            //     .setRequired(true);

            // const row = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
            // exclusionModal.addComponents(row);
            // await interaction.showModal(exclusionModal);
        }
    }