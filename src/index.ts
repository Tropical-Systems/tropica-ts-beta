import "dotenv/config";
import {
  Client,
  ActivityType,
  type Interaction,
  MessageFlags,
} from "discord.js";
import { registerClientEvents } from "./clientHandler";
import mongoose from "mongoose";
import config from "./config";
import guildCreate from "./Events/guildCreate";
import guildDelete from "./Events/guildDelete";



const client = new Client({
  intents: ["Guilds", "GuildMembers"],
});

declare module "discord.js" {
  interface Client {
    slashCommands: Map<string, Function>;
    buttons: Map<string, Function>;
    menus: Map<string, Function>;
    modals: Map<string, Function>;
  }
}

client.slashCommands = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();

client.on("ready", () => {
  const totalServers = client.guilds.cache.size;
  client.user?.setActivity(`Powering ${totalServers} design servers!`, {
    type: ActivityType.Custom,
  });

  registerClientEvents(client);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    if (!interaction.guild) {
      return await interaction.reply({
        content: `This command can only be used in a server.\nInvite Tropica to your server [here](https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands).`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.user.bot) {
      return await interaction.reply({
        content: `${config.emojis.shield} Bots **cannot** use Tropica's commands.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const command = client.slashCommands.get(interaction.commandName);
    if (!command)
      return await interaction.reply({
        content: `There was an error while running the command. Please contact [Tropica Support](https://discord.gg/F5dwsrQyke) if this continues.`,
        flags: MessageFlags.Ephemeral,
      });

    await command(interaction, client);
  } else if (interaction.isAnySelectMenu()) {
    let handler = client.menus.get(interaction.customId);

    if (!handler) {
      const entry = Array.from(client.menus.entries()).find(([id]) =>
        interaction.customId.startsWith(id)
      );
      handler = entry?.[1];
    }
    if (!handler)
      return await interaction.reply({
        content: `There was an error while running the command. Please contact [Tropica Support](https://discord.gg/F5dwsrQyke) if this continues.`,
        flags: MessageFlags.Ephemeral,
      });

    await handler(interaction);
  } else if (interaction.isButton()) {
    let handler = client.buttons.get(interaction.customId);

    if (!handler) {
      const entry = Array.from(client.buttons.entries()).find(([id]) =>
        interaction.customId.startsWith(id)
      );
      handler = entry?.[1];
    }

    if (!handler)
      return await interaction.reply({
        content: `There was an error while running the command. Please contact [Tropica Support](https://discord.gg/F5dwsrQyke) if this continues.`,
        flags: MessageFlags.Ephemeral,
      });

    await handler(interaction);
  } else if (interaction.isModalSubmit()) {
    let handler = client.modals.get(interaction.customId);

    if (!handler) {
      const entry = Array.from(client.modals.entries()).find(([id]) =>
        interaction.customId.startsWith(id)
      );
      handler = entry?.[1];
    }

    if (!handler)
      return await interaction.reply({
        content: `There was an error while running the command. Please contact [Tropica Support](https://discord.gg/F5dwsrQyke) if this continues.`,
        flags: MessageFlags.Ephemeral,
      });

    await handler(interaction);
  }
});

client.on("guildCreate", async (guild) => guildCreate.execute(guild, client));
client.on("guildDelete", async (guild) => guildDelete.execute(guild, client));

(async () => {
  if (!config || !config.mongodbUri) {
    throw new Error("MongoDB URI is not defined in the config file.");
  }
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("[System]: Connected to MongoDB successfully.");
  } catch (err) {
    console.error("[System]: Failed to connect to MongoDB:", err);
    process.exit(1);
  }
})();

client.login(config!.token);
