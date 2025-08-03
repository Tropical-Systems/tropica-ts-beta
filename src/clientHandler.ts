import "dotenv/config";
import { REST, Routes, type Client } from "discord.js";
import * as path from "node:path";
import * as fs from "node:fs";
import config from "./config";

export async function registerClientEvents(client: Client) {

  if (!config || !config.token || !config.clientId) {
    throw new Error("Configuration is missing or incomplete. Please check your config file.");
  }


  client.slashCommands = new Map();
  client.buttons = new Map();
  client.menus = new Map();
  client.modals = new Map();

  const rest = new REST({ version: "10" }).setToken(config.token);
  const commands = [];
  const skipped = [];

  const commandsFolder = fs
    .readdirSync(path.join(__dirname, "./Commands"))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const command of commandsFolder) {
    const commandFile = await import(`./Commands/${command}`);

    if (!commandFile.default.data || !commandFile.default.execute) {
      skipped.push(`Command: ${command}`);
      continue;
    }

    const commandJSON = commandFile.default.data.toJSON();
    client.slashCommands.set(commandJSON.name, commandFile.default.execute);
    commands.push(commandJSON);
  }

  await rest.put(Routes.applicationCommands(config!.clientId), {
    body: commands,
  });

  console.log(`Slash command registering has been completed.`);

  // --------------------------

  const buttonsFolder = fs
    .readdirSync(path.join(__dirname, "./Components/Buttons"))
    .filter((file) => file.endsWith("ts") || file.endsWith("js"));

  for (const button of buttonsFolder) {
    const buttonFile = await import(`./Components/Buttons/${button}`);

    if (!buttonFile.default.customId || !buttonFile.default.execute) {
      skipped.push(`Button: ${button}`);
      continue;
    }

    client.buttons.set(buttonFile.default.customId, buttonFile.default.execute);
  }

  // --------------------------

  const menusFolder = fs
    .readdirSync(path.join(__dirname, "./Components/Menus"))
    .filter((file) => file.endsWith("ts") || file.endsWith("js"));

  for (const menu of menusFolder) {
    const menuFile = await import(`./Components/Menus/${menu}`);

    if (!menuFile.default.customId || !menuFile.default.execute) {
      skipped.push(`Menu: ${menu}`);
      continue;
    }

    client.menus.set(menuFile.default.customId, menuFile.default.execute);
  }

  // --------------------------

  const modalsFolder = fs
    .readdirSync(path.join(__dirname, "./Components/Modals"))
    .filter((file) => file.endsWith("ts") || file.endsWith("js"));

  for (const modal of modalsFolder) {
    const modalFile = await import(`./Components/Modals/${modal}`);

    if (!modalFile.default.customId || !modalFile.default.execute) {
      skipped.push(`Modal: ${modal}`);
      continue;
    }

    client.modals.set(modalFile.default.customId, modalFile.default.execute);
  }

  // --------------------------
  console.log(`Component registering has been completed.`);

  if (skipped.length >= 1) {
    console.log(`The following files were skipped:`, skipped);
  }
  // --------------------------
}
