import config, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../../config";
import {
    EmbedBuilder,
    ButtonInteraction,
    AttachmentBuilder,
    MessageFlags,
    PermissionFlagsBits,
    GuildMember,
    GuildChannel,

} from "discord.js";
import Review from "../../Models/Review";
import ReviewVoid from "../../Models/ReviewVoid";
import Infract from "../../Models/Infract";
import { BInsufficientPermissionsFU, BInteractionNotInGuildFU, BUnexpectedErrorFU } from "../../Functions/interactionReturns";

export default {
    customId: "t-void-",

    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const attachment = new AttachmentBuilder(TROPICA_BANNER_PATH, {
            name: "tropica-banner.png",
        });

        const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
            name: "tropica-logo.png",
        });

        if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

        if (
            interaction.member instanceof GuildMember &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) return await BInsufficientPermissionsFU(interaction);

        try {
            await interaction.deferUpdate();
            if (interaction.customId.includes("t-void-")) {
                switch (true) {

                    case interaction.customId.includes("t-void-review."):
                        if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

                        const [_, reviewIdRAW, userId] = interaction.customId.split(".");
                        const reviewId = parseInt(reviewIdRAW);

                        if (interaction.user.id !== userId) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} You cannot void this review as the voidance was not submitted by you.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        const member = await interaction.guild.members.fetch(
                            interaction.user.id
                        );

                        if (!member) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} You cannot void this review as the voidance was not submitted by you.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        if (!member.permissions.has(PermissionFlagsBits.Administrator))
                            return await BInsufficientPermissionsFU(interaction);

                        const review = await Review.findOne({
                            guildId: interaction.guildId,
                            reviewId: reviewId,
                        });
                        const reviewVoid = await ReviewVoid.findOne({
                            reviewId: reviewId,
                            guildId: interaction.guildId,
                        });


                        if (!review || !reviewVoid) {
                            return await interaction.editReply({
                                content: `${config.emojis.alerttriangle} Review not found. It may have already been deleted or does not exist.`,
                            });
                        }

                        try {
                            await Review.deleteOne({
                                reviewId: review.reviewId,
                                guildId: interaction.guildId,
                            });

                            const reviewUser = await interaction.guild.members.fetch(review.reviewerId);


                            try {
                                await ReviewVoid.deleteOne({
                                    reviewId: review.reviewId,
                                    guildId: interaction.guildId,
                                });
                            } catch { return await BUnexpectedErrorFU(interaction) }

                            if (reviewUser) {
                                try {
                                    const voidanceEmbed = new EmbedBuilder()
                                        .setTitle("Review Voided")
                                        .setDescription(
                                            `Your review with ID \`${review.reviewId}\` has been voided by <@${interaction.user.id}>.\n\n**Reason:** ${reviewVoid.reason}`
                                        )
                                        .setColor(0xed4245)
                                        .setFooter({
                                            text: `${interaction.guild.name} Review Voidance | Powered By Tropica`,
                                            iconURL: "attachment://tropica-logo.png",
                                        })
                                    await reviewUser.send({ content: `${reviewUser}\n Your Review was deleted in [${interaction.guild.name}](https://discord.com/channels/${interaction.guild.id})`, embeds: [voidanceEmbed] });
                                } catch { }
                            }

                            return await interaction.editReply({
                                content: `${config.emojis.checkemoji} Review with ID \`${review.reviewId}\` has been successfully voided.`,
                                embeds: [],
                                components: [],
                                files: [],
                            });
                        } catch { return await BUnexpectedErrorFU(interaction) }

                        break;
                    case interaction.customId.includes("t-void-infraction."):

                        if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

                        if (
                            interaction.member instanceof GuildMember &&
                            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
                        ) return await BInsufficientPermissionsFU(interaction);

                        const [____, iVoidId,] = interaction.customId.split(".");
                        const infractionId = parseInt(iVoidId);
                        if (!infractionId || isNaN(infractionId)) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} Invalid infraction ID provided.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        const infraction = await Infract.findOne({
                            guildId: interaction.guildId,
                            infractionId: infractionId,
                        });

                        if (!infraction) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} Infraction not found. It may have already been deleted or does not exist.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        if (infraction.infracteeId === interaction.user.id) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} You **cannot** void your own infractions.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        if (infraction.appealable === false) {
                            return await interaction.followUp({
                                content: `${config.emojis.alerttriangle} This infraction is not eligible for voidance as it is not appealable.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }

                        const user = await interaction.guild.members.fetch(`${infraction.infracteeId}`);

                        if (infraction.messageUrl !== null || infraction.messageUrl !== undefined) {
                            const linkData = pareMessageLink(`${infraction.messageUrl}`);

                            if (!linkData || linkData.guildId !== interaction.guild.id) {
                                return await interaction.followUp({
                                    content: `${config.emojis.alerttriangle} Invalid message URL provided in the infraction.`,
                                    flags: MessageFlags.Ephemeral,
                                });
                            }
                            try {
                                const channel = await interaction.guild.channels.fetch(linkData.channelId);
                                if (channel && channel instanceof GuildChannel && channel.isTextBased()) {
                                    const originalMessage = await channel.messages.fetch(linkData.messageId);
                                    await originalMessage.reply({
                                        content: `Infraction \`${infraction.infractionId}\` has been voided by ${interaction.user}.`,
                                    });
                                }
                            } catch { }
                        }
                        if (user) {
                            try {
                                const voidEmbed = new EmbedBuilder()
                                    .setTitle("Infraction Voided")
                                    .setDescription(
                                        `Your infraction with ID \`${infraction.infractionId}\` has been voided by <@${interaction.user.id}>.\n\n**Original Infraction Reason:** ${infraction.reason}`
                                    )
                                    .setColor(0xed4245)
                                    .setFooter({
                                        text: `${interaction.guild.name} Infraction Voidance | Powered By Tropica`,
                                        iconURL: "attachment://tropica-logo.png",
                                    });

                                await user.send({ content: `${user}`, embeds: [voidEmbed], files: [logo] });
                            } catch { }
                        }

                        try {
                            await Infract.deleteOne({
                                guildId: interaction.guildId,
                                infractionId: infractionId,
                            });
                            return await interaction.followUp({
                                content: `${config.emojis.checkemoji} Infraction with ID \`${infractionId}\` has been successfully voided.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        } catch { return await BUnexpectedErrorFU(interaction) }
                        break;

                    case interaction.customId.includes("t-void-order."):
                        if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

                        if (
                            interaction.member instanceof GuildMember &&
                            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
                        ) return await BInsufficientPermissionsFU(interaction);

                        const [__, voidId] = interaction.customId.split(".");
                        const voidType = interaction.customId.includes("t-void-infraction.") ? "infraction" : "order";

                        const voidEmbed = new EmbedBuilder()
                            .setTitle(`${config.emojis.checkemoji} Void Successful`)
                            .setDescription(`Successfully voided the ${voidType} with ID \`${voidId}\`.`)
                            .setColor(0x57F287)
                            .setFooter({
                                text: `${interaction.guild.name} Voidance | Powered By Tropica`,
                                iconURL: "attachment://tropica-logo.png",
                            });

                        return await interaction.editReply({
                            embeds: [voidEmbed],
                            files: [attachment],
                            components: [],
                        });
                        break;
                }
            }
            else {
                console.log("Unable to handle custom ID:", interaction.customId);
            }
        } catch { return await BUnexpectedErrorFU(interaction) }
    },
};

function pareMessageLink(url: string) {
    const parts = url.split("/").slice(-3);
    const [guildId, channelId, messageId] = parts;
    return { guildId, channelId, messageId };
}