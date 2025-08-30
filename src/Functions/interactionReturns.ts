import { ButtonInteraction, ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import config from "../config.js";

export async function CInteractionNotInGuild(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} This command can only be used in a server.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CInsufficientPermissionsR(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.shield} Insufficient permissions to execute this command. ${config.emojis.shield}`,
        flags: MessageFlags.Ephemeral,
    })
}

export async function CInsufficientPermissionsFU(interaction: ChatInputCommandInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.shield} Insufficient permissions to execute this command. ${config.emojis.shield}`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CInsufficientPermissionsER(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.shield} Insufficient permissions to execute this command. ${config.emojis.shield}`,
    });
}

export async function CNotConfiguredR(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CNotConfiguredER(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
    });
}

export async function CNotConfiguredFU(interaction: ChatInputCommandInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CUserNotInGuildR(interaction: ChatInputCommandInteraction, user: GuildMember) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} The user ${user} is not in this server.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CUnexpectedErrorR(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} An unexpected error occurred while executing this command. Please try again later.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CUnexpectedErrorER(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.xemoji} An unexpected error occurred while executing this command. Please try again later.`,
    });
}

export async function CProvideId(interaction: ChatInputCommandInteraction, type: string) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} Please provide a valid ${type} ID.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CNotTextChannelR(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.shield} This command can only be used in text channels. Make sure to use it in the correct channel.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CNotTextChannelERE(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.shield} This command can only be used in text channels. Make sure to use it in the correct channel.`,
    });
}

export async function CMissingRequiredFieldsR(interaction: ChatInputCommandInteraction, fields: string[]) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} Missing required fields: ${fields.join(", ")}. Please provide all necessary information.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CMissingRequiredFieldsFU(interaction: ChatInputCommandInteraction, fields: string[]) {
    return await interaction.followUp({
        content: `${config.emojis.xemoji} Missing required fields: ${fields.join(", ")}. Please provide all necessary information.`,
        components: [],
        flags: MessageFlags.Ephemeral,
    });
}

export async function CMissingRequiredFieldsER(interaction: ChatInputCommandInteraction, fields: string[]) {
    return await interaction.editReply({
        content: `${config.emojis.xemoji} Missing required fields: ${fields.join(", ")}. Please provide all necessary information.`,
        components: [],
    });
}

export async function CUserNotFoundR(interaction: ChatInputCommandInteraction, type: string) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} No ${type} found. Please ensure the user exists.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CUserNotFoundER(interaction: ChatInputCommandInteraction, type: string) {
    return await interaction.editReply({
        content: `${config.emojis.xemoji} No ${type} found. Please ensure the user exists.`,
    });
}

export async function CUserNotFoundFU(interaction: ChatInputCommandInteraction, type: string) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} No ${type} found. Please ensure the user exists.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CTypeNotAlreadyVoidedR(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Is it possible that this ${type} has already been voided?`,
    })
}

export async function CTypeNotAlreadyVoidedER(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.editReply({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Is it possible that this ${type} has already been voided?`,
    })
}

export async function CTypeNotAlreadyVoidedFU(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.followUp({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Is it possible that this ${type} has already been voided?`,
        flags: MessageFlags.Ephemeral,
    })
}

export async function CTypeNotFoundR(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Please ensure the ID is correct and the ${type} exists.`,
        flags: MessageFlags.Ephemeral,
    })
}

export async function CTypeNotFoundER(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.editReply({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Please ensure the ID is correct and the ${type} exists.`,
    })
}

export async function CTypeNotFoundFU(interaction: ChatInputCommandInteraction, type: string, id: string) {
    return await interaction.followUp({
        content: `${config.emojis.xemoji} No ${type} found with the ID \`${id}\`. Please ensure the ID is correct and the ${type} exists.`,
        flags: MessageFlags.Ephemeral,
    })
}

export async function CInvalidTimeFormatR(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.customize} Invalid duration format. Use 1d, 1w, or 1m.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function CInvalidTimeFormatER(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.customize} Invalid duration format. Use 1d, 1w, or 1m.`,
    });
}

export async function CInvalidTimeFormatFU(interaction: ChatInputCommandInteraction) {
    return await interaction.reply({
        content: `${config.emojis.customize} Invalid duration format. Use 1d, 1w, or 1m.`,
        flags: MessageFlags.Ephemeral,
    });
}
//

export async function BInsufficientPermissionsR(interaction: ButtonInteraction) {
    return await interaction.reply({
        content: `${config.emojis.shield} You do not have sufficient permissions to use this button.`,
        flags: MessageFlags.Ephemeral,
    })
}

export async function BInsufficientPermissionsFU(interaction: ButtonInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.shield} You do not have sufficient permissions to use this button.`,
        components: [],
        flags: MessageFlags.Ephemeral,
    });
}

export async function BUnexpectedErrorR(interaction: ButtonInteraction) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} An unexpected error occurred while processing your request. Please try again later.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function BUnexpectedErrorFU(interaction: ButtonInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.xemoji} An unexpected error occurred while processing your request. Please try again later.`,
        components: [],
        flags: MessageFlags.Ephemeral,
    });
}

export async function BInteractionNotInGuildR(interaction: ButtonInteraction) {
    return await interaction.reply({
        content: `${config.emojis.xemoji} This button can only be used in a server.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function BInteractionNotInGuildFU(interaction: ButtonInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.xemoji} This button can only be used in a server.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function BNotConfiguredR(interaction: ButtonInteraction) {
    return await interaction.reply({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
        flags: MessageFlags.Ephemeral,
    });
}

export async function BNotConfiguredFU(interaction: ButtonInteraction) {
    return await interaction.followUp({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
        components: [],
        flags: MessageFlags.Ephemeral,
    });
}

export async function BNotConfiguredER(interaction: ButtonInteraction) {
    return await interaction.editReply({
        content: `${config.emojis.alerttriangle} It seems like this feature is not configured yet. please set up your server configuration before using this command.\nYou can do this by using \`/config\`.`,
    });
}