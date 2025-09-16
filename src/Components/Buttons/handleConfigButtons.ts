import config, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../../config.js";
import {
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    ButtonInteraction,
    AttachmentBuilder,
    GuildMember,
    PermissionFlagsBits,
} from "discord.js";
import { BInsufficientPermissionsFU } from "../../Functions/interactionReturns.js";

export default {
    customId: "t-setting-config.",

    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const attachment = new AttachmentBuilder(TROPICA_BANNER_PATH, {
            name: "tropica-banner.png",
        });

        const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
            name: "tropica-logo.png",
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setDescription(
                `Welcome to the next part in your server set up! Now, you will set up your embed color, banner, and tax percent! Select one of the dropdowns to begin.`
            )
            .setColor(0xffffff)
            .setFooter({
                text: `Tropica Configuration Panel | Powered by: Tropica`,
                iconURL: "attachment://tropica-logo.png",
            })
            .setImage("attachment://tropica-banner.png")
            .setTitle("Tropica Configuration | Panel 2: Basic Settings");

        try {
            await interaction.deferUpdate();
            if (interaction.customId.includes("t-setting-config.")) {

                const member = interaction.member as GuildMember;
                if (!member.permissions.has(PermissionFlagsBits.ManageGuild, true))
                    return await BInsufficientPermissionsFU(interaction);

                const files = [attachment, logo];

                switch (interaction.customId) {
                    // handle basic settings view
                    case "t-setting-config.start":
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId("t-m-basic-info")
                            .setPlaceholder("Select an option to continue!")
                            // .setDisabled(true)
                            .setMaxValues(1)
                            .addOptions([
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Embed Color")
                                    .setDescription("Customize the embed color of your server.")
                                    .setEmoji("<:customize:1287550530226225286>")
                                    .setValue("t-m-basic-info.color"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Banner Image")
                                    .setDescription("Customize the banner image for your embeds.")
                                    .setEmoji("<:image:1287551815235403786>")
                                    .setValue("t-m-basic-info.image"),

                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Tax Percentage")
                                    .setDescription("Customize your server's tax percentage.")
                                    .setEmoji("<:dollar:1296191281847861268>")
                                    .setValue("t-m-basic-info.tax"),
                            ]);

                        const designerRoleSelect = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.designer-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a designer role to begin!");

                        const designerRoleRow =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                designerRoleSelect
                            );

                        const continueButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.continue-1")
                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);

                        const basicInfoMenu =
                            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                                selectMenu
                            );
                        // console.log(`Basic menu: ${basicInfoMenu.components.length}`);

                        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            continueButton
                        );
                        // console.log(`buttons: ${buttons.components.length}`);

                        await interaction.editReply({
                            embeds: [embed],
                            components: [basicInfoMenu, designerRoleRow, buttons],
                            files,
                        });
                        break;

                    // Handle infraction settings view
                    case "t-setting-config.continue-1":
                        embed.setDescription(
                            `Great! Those settings will look amazing, now lets configure your infraction module. You will be able to set who can send infractions and where they are sent to! Check it out below.`
                        );
                        embed.setTitle(
                            "Tropica Configuration | Panel 3: Infraction Settings"
                        );

                        const roleSelection = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.infract-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a role to begin!");

                        const channelSelection = new ChannelSelectMenuBuilder()
                            .setChannelTypes(ChannelType.GuildText)
                            .setCustomId("t-setting-config.infract-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a channel to begin!")
                            .setChannelTypes(ChannelType.GuildText)
                            ;

                        const roleRow =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                roleSelection
                            );
                        // console.log(`Rolerow: ${roleRow.components.length}`);

                        const channelRow =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                channelSelection
                            );

                        // console.log(`ChannelRow: ${channelRow.components.length}`);

                        const infractContinueButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.continue-2")
                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);

                        const buttonRow2 =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                infractContinueButton
                            );

                        // console.log(`ButtonRow2: ${buttonRow2.components.length}`);
                        await interaction.editReply({
                            embeds: [embed],
                            files,
                            components: [roleRow, channelRow, buttonRow2],
                        });
                        break;

                    // Handle review settings view
                    case "t-setting-config.continue-2":
                        embed.setDescription(
                            `Amazing, just a few more to go. Now we will configure the review settings, you will be able to select what role can send reviews and the channel to send them to.`
                        );
                        embed.setTitle("Tropica Configuration | Panel 4: Review Settings");

                        const reviewRoleSelect = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.review-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Choose a reviewer role to continue!");

                        const reviewChannelSelect = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.review-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a review channel to continue!")
                            .setChannelTypes(ChannelType.GuildText);

                        const rRow1 =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                reviewRoleSelect
                            );

                        // console.log(`Rolerow1: ${rRow1.components.length}`);
                        const rRow2 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                reviewChannelSelect
                            );
                        // console.log(`Rolerow2: ${rRow2.components.length}`);

                        const reviewContinueButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.continue-3")
                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);
                        const rButtonRow =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                reviewContinueButton
                            );
                        // console.log(`ButtoRnRow3: ${rButtonRow.components.length}`);



                        await interaction.editReply({
                            content: `${config.emojis.checkemoji} Successfully configured the infraction settings!`,
                            embeds: [],
                            files: [],
                            components: [],
                        });
                        await interaction.editReply({
                            content: "",
                            embeds: [embed],
                            components: [rRow1, rRow2, rButtonRow],
                            files,
                        });
                        break;

                    // Handle order settings view
                    case "t-setting-config.continue-3":
                        embed.setDescription(
                            `Amazing! Almost to the end, now we are going to configure the order system's module. You will set the order logging channel! \n-# Please note that the designer role that you set in the basicInfo panel will be used for orders aswell.`
                        );
                        embed.setTitle("Tropica Configuration | Panel 5: Order Settings");

                        const orderChannelSelect = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.order-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a channel to log the orders!")
                            .setChannelTypes(ChannelType.GuildText);

                        // console.log(`oRow1: ${oRow1.components.length}`);
                        const oRow2 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                orderChannelSelect
                            );
                        // console.log(`oRow2: ${oRow2.components.length}`);

                        const orderContinueButton = new ButtonBuilder()

                            .setCustomId("t-setting-config.continue-4")

                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);
                        const oButtonRow =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                orderContinueButton
                            );

                        await interaction.editReply({
                            content: `${config.emojis.checkemoji} Successfully configured the review settings!`,
                            embeds: [],
                            files: [],
                            components: [],
                        });
                        // console.log(`oButtonRow: ${oButtonRow.components.length}`);
                        await interaction.editReply({
                            content: "",
                            embeds: [embed],
                            components: [oRow2, oButtonRow],
                            files,
                        });
                        break;

                    // Handle staff settings view
                    case "t-setting-config.continue-4":
                        embed.setDescription(
                            `Next we will be configuring the staff management system. You will set the channel to log promotions and demotions, as well as those who can add staff.`
                        );
                        embed.setTitle("Tropica Configuration | Panel 6: Staff Settings");

                        const staffManagerRole = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.staff-manager-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Choose the staff manager role to begin!");

                        const promotionLogs = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.promote-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a channel to log the promotions!")
                            .setChannelTypes(ChannelType.GuildText);
                        const demotionLogs = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.demote-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Select a channel to log the demotions!")
                            .setChannelTypes(ChannelType.GuildText);

                        const sRow1 =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                staffManagerRole
                            );
                        // console.log(`sRoFw1: ${sRow1.components.length}`);
                        const sRow2 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                promotionLogs
                            );
                        // console.log(`sRow2F: ${sRow2.components.length}`);
                        const sRow3 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                demotionLogs
                            );
                        // console.log(`sRow3F: ${sRow3.components.length}`);

                        const staffContinueButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.continue-5") // Fix the 'customId' to match the switch case
                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);
                        const sButtonRow =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                staffContinueButton
                            );
                        // console.log(`sButtonRowF: ${sButtonRow.components.length}`);
                        await interaction.editReply({
                            content: `${config.emojis.checkemoji} Successfully configured the order settings!`,
                            embeds: [],
                            files: [],
                            components: [],
                        })
                        await interaction.editReply({
                            content: "",
                            embeds: [embed],
                            components: [sRow1, sRow2, sRow3, sButtonRow],
                            files,
                        });
                        break;

                    // Handle quality control settings view
                    case "t-setting-config.continue-5":
                        embed.setDescription(
                            `Now we will configure your quality control system! This is the final step in your configuration, enjoy using Tropica!\n-# Please note that the designer role that you set in the order panel will be used for QC as well.`
                        );
                        embed.setTitle("Tropica Configuration | Panel 7: Quality Control");

                        const qcApprover = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.qc-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder(
                                "Choose the Quality Control Approver role to begin!!"
                            );

                        const qcChannel = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.qc-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder(
                                "Select a channel to log the quality control logs!"
                            )
                            .setChannelTypes(ChannelType.GuildText);

                        const qRow1 =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                qcApprover
                            );
                        // console.log(`qRow1: ${qRow1.components.length}`);
                        const qRow2 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                qcChannel
                            );
                        // console.log(`qRow2: ${qRow2.components.length}`);

                        const qcContinueButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.credit") // Fix the 'customId' to match the switch case
                            .setEmoji("<:rightarrow:1287542697334411325>")
                            .setLabel("Continue")
                            .setStyle(ButtonStyle.Success);
                        const qButtonRow =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                qcContinueButton
                            );
                        // console.log(`qButtonsdRow: ${qButtonRow.components.length}`);
                        await interaction.editReply({
                            content: `${config.emojis.checkemoji} Successfully configured the staff settings!`,
                            embeds: [],
                            files: [],
                            components: [],
                        });
                        await interaction.editReply({
                            content: "",
                            embeds: [embed],
                            components: [qRow1, qRow2, qButtonRow],
                            files,
                        });
                        break;

                    case "t-setting-config.credit":
                        embed.setDescription(
                            `Finally, came upon the credit module configuration! With this module, you will be able to set who can manage your server members credits, as well as the channel to log the credit changes!`
                        )
                            .setTitle("Tropica Configuration | Panel 8: Credit Settings");

                        const creditManagerRole = new RoleSelectMenuBuilder()
                            .setCustomId("t-setting-config.credit-role")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder(
                                "Choose the Credit Manager role to begin!"
                            );

                        const creditChannel = new ChannelSelectMenuBuilder()
                            .setCustomId("t-setting-config.credit-channel")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder(
                                "Select a channel to log the credit changes!"
                            )
                            .setChannelTypes(ChannelType.GuildText);

                        const cRow1 =
                            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                                creditManagerRole
                            );

                        const cRow2 =
                            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                                creditChannel
                            );

                        const creditFinishButton = new ButtonBuilder()
                            .setCustomId("t-setting-config.finish") // Fix the 'customId' to match the switch case
                            .setLabel("Finish") // TODO: Add emoji here
                            .setStyle(ButtonStyle.Success);

                        const cButtonRow =
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                creditFinishButton
                            );

                        await interaction.editReply({
                            content: `${config.emojis.checkemoji} Successfully configured the quality control settings!`,
                            embeds: [],
                            files: [],
                            components: [],
                        });
                        await interaction.editReply({
                            content: "",
                            embeds: [embed],
                            components: [cRow1, cRow2, cButtonRow],
                            files,
                        });
                        break;



                    case "t-setting-config.finish":
                        interaction.editReply({
                            content: `${config.emojis.confettiIcon} All configurations saved!`,
                            files: [],
                            embeds: [],
                            components: [],
                        });
                        break;
                }
            }
            else {
                console.log("Unable to handle custom ID:", interaction.customId);
            }
        } catch (err) {
            console.error(err);
            return await interaction.editReply({
                content:
                    `${config.emojis.xemoji} An error occurred while processing your request. Please try again later.`,
                embeds: [],
                components: [],
            });
        }
    },
};