import "dotenv/config";
import { REST, Routes, type Client } from "discord.js";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";   // ✅ new
import config from "./config.js";

// ✅ Define __filename / __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

    // support default export OR direct export
    const cmd = commandFile.default ?? commandFile;

    if (!cmd.data || !cmd.execute) {
      skipped.push(`Command: ${command}`);
      continue;
    }

    const commandJSON = cmd.data.toJSON();
    client.slashCommands.set(commandJSON.name, cmd.execute);
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

    const btn = buttonFile.default ?? buttonFile;

    if (!btn.customId || !btn.execute) {
      skipped.push(`Button: ${button}`);
      continue;
    }

    client.buttons.set(btn.customId, btn.execute);
  }

  // --------------------------

  const menusFolder = fs
    .readdirSync(path.join(__dirname, "./Components/Menus"))
    .filter((file) => file.endsWith("ts") || file.endsWith("js"));

  for (const menu of menusFolder) {
    const menuFile = await import(`./Components/Menus/${menu}`);

    const m = menuFile.default ?? menuFile;

    if (!m.customId || !m.execute) {
      skipped.push(`Menu: ${menu}`);
      continue;
    }

    client.menus.set(m.customId, m.execute);
  }

  // --------------------------

  const modalsFolder = fs
    .readdirSync(path.join(__dirname, "./Components/Modals"))
    .filter((file) => file.endsWith("ts") || file.endsWith("js"));

  for (const modal of modalsFolder) {
    const modalFile = await import(`./Components/Modals/${modal}`);

    const mdl = modalFile.default ?? modalFile;

    if (!mdl.customId || !mdl.execute) {
      skipped.push(`Modal: ${modal}`);
      continue;
    }

    client.modals.set(mdl.customId, mdl.execute);
  }

  // --------------------------
  console.log(`Component registering has been completed.`);

  if (skipped.length >= 1) {
    console.log(`The following files were skipped:`, skipped);
  }
  // --------------------------
}
