import config, { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../../config.js";
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    AttachmentBuilder,
    MessageFlags,
    GuildMember,
    Message,
} from "discord.js";
import ServerConfig, { IConfig } from "../../Models/Config.js";
import { BInsufficientPermissionsFU, BInteractionNotInGuildFU, BNotConfiguredFU, BUnexpectedErrorFU } from "../../Functions/interactionReturns.js";

export default {
    customId: "t-qc.",

    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const AcceptButton = new ButtonBuilder()
            .setLabel("Accept")
            .setEmoji(config.emojis.checkemoji)
            .setStyle(ButtonStyle.Success)
            .setCustomId("t-qc.accept")
            .setDisabled(true);
        const DenyButton = new ButtonBuilder()
            .setLabel("Deny")
            .setEmoji(config.emojis.xemoji)
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`t-qc.reject`)
            .setDisabled(true);

        try {
            await interaction.deferUpdate();
            if (interaction.customId.includes("t-qc.")) {
                const qcMessage = await interaction.message.fetch();
                if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

                const sConfig = await ServerConfig.findOne({
                    guildId: interaction.guild.id,
                });

                if (!sConfig) return await BNotConfiguredFU(interaction);

                if (!sConfig.qcApprover || !sConfig.qcChannel) return await BNotConfiguredFU(interaction);

                const member = interaction.member as GuildMember;

                if (!member.roles.cache.has(sConfig.qcApprover)) return await BInsufficientPermissionsFU(interaction);

                switch (interaction.customId) {
                    case "t-qc.accept":
                        await handleQcAccept(
                            interaction,
                            qcMessage,
                            AcceptButton,
                            DenyButton,
                            sConfig
                        );
                        break;
                    case "t-qc.reject":
                        await handleQcReject(
                            interaction,
                            qcMessage,
                            AcceptButton,
                            DenyButton,
                            sConfig
                        );
                        break;
                }
            }
            else {
                console.log("Unable to handle custom ID:", interaction.customId);
            }
        } catch (err) { 
            
            console.error("Error handling QC button interaction:", err);
            return await BUnexpectedErrorFU(interaction) }
    },
};

async function handleQcAccept(
    interaction: ButtonInteraction,
    qcMessage: Message,
    AcceptButton: ButtonBuilder,
    DenyButton: ButtonBuilder,
    sConfig: IConfig
) {
    if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

    const member = interaction.member as GuildMember;

    if (!member.roles.cache.has(`${sConfig.qcApprover}`)) return await BInsufficientPermissionsFU(interaction);

    const QCMessage = interaction.message;
    const thread = qcMessage.hasThread ? await qcMessage.thread!.fetch() : null;
    const QCEmbed = EmbedBuilder.from(QCMessage.embeds[0])
        .setColor(0x57F287)
        .setTitle(`${config.emojis.checkemoji} Accepted | Quality Control Submission`);

    const QcActionRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            AcceptButton,
            DenyButton
        );

    await QCMessage.edit({
        embeds: [QCEmbed],
        components: [QcActionRow],
        files: [],
    });

    if (thread) {
        await thread.send({
            content: `${config.emojis.checkemoji} This quality control submission has been accepted by ${member}.`,
            embeds: [
                new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle("Quality Control Submission Accepted")
                    .setDescription(`This submission has been accepted by ${member}.`)
                    .setImage("attachment://tropica_logo.png")
                    .setFooter({ text: "Thank you for your contribution!" }),
            ],
            files: [
                new AttachmentBuilder(TROPICA_BANNER_PATH, { name: "tropica_logo.png" }),
            ],
        })
        await thread.setArchived(true);
    }

    await interaction.followUp({
        content: `${config.emojis.checkemoji} Successfully accepted the quality control submission!`,
        flags: MessageFlags.Ephemeral,
    })
}

async function handleQcReject(
    interaction: ButtonInteraction,
    qcMessage: Message,
    AcceptButton: ButtonBuilder,
    DenyButton: ButtonBuilder,
    sConfig: IConfig
) {

    if (!interaction.guild) return await BInteractionNotInGuildFU(interaction);

    const member = interaction.member as GuildMember;

    if (!member.roles.cache.has(`${sConfig.qcApprover}`)) return await BInsufficientPermissionsFU(interaction);


    const rejectEmbed = EmbedBuilder.from(qcMessage.embeds[0])
        .setColor(0xed4245)
        .setTitle(`${config.emojis.xemoji} Rejected | Quality Control Submission`);
    const rejectActionRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            AcceptButton.setDisabled(true),
            DenyButton.setDisabled(true)
        );
    await qcMessage.edit({
        embeds: [rejectEmbed],
        components: [rejectActionRow],
        files: [],
    });
    await interaction.followUp({
        content: `${config.emojis.checkemoji} Successfully rejected the quality control submission.`,
        flags: MessageFlags.Ephemeral,
    })
}
