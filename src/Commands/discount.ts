// import { AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags, SlashCommandBuilder, Client } from "discord.js";
// import ServerConfig from "../Models/Config";
// import { TROPICA_BANNER_PATH, TROPICA_LOGO_PATH } from "../config";
// import miscConfig from "../config";
// import { CInsufficientPermissionsR, CInteractionNotInGuild, CNotConfiguredR } from "../Functions/interactionReturns";


// export default {
//     data: new SlashCommandBuilder()
//         .setName("discount")
//         .setDescription("Get a discount code for the server's store.")
//         .addNumberOption(o => o
//             .setName("price")
//             .setDescription("The price of the item you want a discount for.")
//             .setRequired(true)
//         )
//         .addNumberOption(o => o
//             .setName("percentage")
//             .setDescription("The percentage discount you want to apply.")
//             .setRequired(true)
//         )
//         .addStringOption(o => o
//             .setName("extra-tax")
//             .setDescription("Do you want to add the roblox tax to the equation?")
//             .setRequired(true)
//             .setChoices({
//                 name: "Yes",
//                 value: "yes"
//             },
//                 {
//                     name: "No",
//                     value: "no"
//                 })
//         ),


//     async execute(interaction: ChatInputCommandInteraction, client: Client) {
//         const guild = interaction.guild;

//         if (!guild) return await CInteractionNotInGuild(interaction);

//         const config = await ServerConfig.findOne({ guildId: guild.id });

//         if (!config) return await CNotConfiguredR(interaction);

//         const requiredRole = (config && config.designerRole) || null;
//         const member = interaction.member as GuildMember;

//         if (!requiredRole) return await CNotConfiguredR(interaction);

//         if (!member.roles.cache.has(requiredRole)) return await CInsufficientPermissionsR(interaction);

//         const logo = new AttachmentBuilder(TROPICA_LOGO_PATH, {
//             name: "tropica-logo.png",
//         });

//         const banner = new AttachmentBuilder(TROPICA_BANNER_PATH, {
//             name: "tropica-banner.png",
//         })


//         const price = interaction.options.getNumber("price", true);
//         const percentage = interaction.options.getNumber("percentage", true);
//         const extraTax = interaction.options.getString("extra-tax", true) === "yes";

//         const discount = (price * (percentage / 100));
//         const finalPrice = extraTax ? (price - discount) * miscConfig.standardTax : (price - discount);

//         const embed = new EmbedBuilder()
//             .setAuthor({
//                 name: `${interaction.guild.name !== null ? interaction.guild.name : "Tropica"}'s Discount Calculator`,
//                 iconURL: interaction.guild.iconURL() || "attachment://tropica-logo.png",
//             })
//             .setFooter({
//                 text: `Requested by ${interaction.user.username} | Powered by Tropica`,
//                 iconURL: interaction.user.displayAvatarURL(),
//             })
//             .setTimestamp();

//         const fields = [
//             {
//                 name: `${miscConfig.emojis.dollar} Original Price`,
//                 value: `\`\`\`${price.toFixed(0)}\`\`\``,
//                 inline: true,
//             },
//         ];

//         if (extraTax) {
//             fields.push({
//                 name: `Discounted Price`,
//                 value: `\`\`\`${(price - discount).toFixed(0)}\`\`\``,
//                 inline: true,
//             });
//             fields.push({
//                 name: `${miscConfig.emojis.filleddollar} Final Price`,
//                 value: `\`\`\`${finalPrice.toFixed(0)}\`\`\``,
//                 inline: true,
//             })
//             fields.push({
//                 name: `Discount Percentage`,
//                 value: `${percentage}%`,
//                 inline: true,
//             });
//             fields.push({
//                 name: `Note`,
//                 value: `The final price includes a 30% Roblox tax.`,
//                 inline: false,
//             });
//         } else {
//             fields.push({
//                 name: `${miscConfig.emojis.filleddollar} Discounted Price`,
//                 value: `\`\`\`${finalPrice.toFixed(0)}\`\`\``,
//                 inline: true,
//             });
//             fields.push(
//                 {
//                     name: `Discount Percentage`,
//                     value: `\`\`\`${percentage}%\`\`\``,
//                     inline: true,
//                 }
//             );
//         }

//         embed.addFields(fields);

//         const files = [];

//         if (
//             !interaction.guild.iconURL() ||
//             !interaction.user.displayAvatarURL()
//         ) files.push(logo);

//         if (config && config.bannerUrl && config.color) {
//             embed.setColor(`#${config.color || "000000"}`);
//             embed.setImage(`${config.bannerUrl || ""}`);
//         } else if (config && config.color && !config.bannerUrl) {
//             embed.setColor(`#${config.color || "000000"}`);
//             embed.setImage("attachment://tropica-banner.png");
//             files.push(banner);
//         } else if (config && !config.color && config.bannerUrl) {
//             embed.setImage(`${config.bannerUrl || ""}`);
//         } else {
//             embed.setImage("attachment://tropica-banner.png");
//             files.push(banner);
//         }

//         return await interaction.reply({
//             embeds: [embed],
//             files
//         });
//     }
// }