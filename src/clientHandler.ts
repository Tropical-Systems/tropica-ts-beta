import "dotenv/config";
import { REST, Routes, type Client } from "discord.js";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";   // ✅ new
import config from "./config.js";
import { Logger, LogType } from "./Functions/Logger.js";

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

  await syncApplicationCommands(commands, rest);

  Logger.log(LogType.StartUp, `Registered ${client.slashCommands.size} slash commands.`);
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
  Logger.log(LogType.StartUp, `Registered ${client.buttons.size} buttons.`);

  if (skipped.length >= 1) {
    Logger.log(LogType.Warning, `Some components were skipped during registration:\n${skipped.join("; ")}`);
  }
  // --------------------------
}


async function syncApplicationCommands(commands: any, rest: REST) {
  const clientId = config!.clientId!;

  const existing = await rest.get(Routes.applicationCommands(clientId)) as any[];

  const existingMap = new Map(existing.map(cmd => [cmd.name, cmd]));

  if (existingMap.keys.length === 0) {
    Logger.log(LogType.CommandSync, "No commands found to synchronize.");
  }

  for (const cmd of commands) {
    const previous = existingMap.get(cmd.name);

    if (!previous) {
      Logger.log(LogType.CommandSync, `Creating command - ${cmd.name}`);

      await rest.post(
        Routes.applicationCommands(clientId),
        { body: cmd }
      );
    } else {
      Logger.log(LogType.CommandSync, `Updating command - ${cmd.name}`);

      await rest.patch(
        Routes.applicationCommand(clientId, previous.id),
        { body: cmd }
      );
    }
  }

  Logger.log(LogType.CommandSync, "Checking for deleted commands...");

  for (const existingCmd of existing) {
    const isEntryPoint = existingCmd.application_command_entry_point;
    const stillExists = commands.some((cItem: any) => cItem.name === existingCmd.name);

    if (!stillExists && !isEntryPoint) {
      Logger.log(LogType.CommandSync, `Deleting command - ${existingCmd.name}`);
      await rest.delete(
        Routes.applicationCommand(clientId, existingCmd.id)
      );
    }
  }

  Logger.log(LogType.CommandSync, "Initial Command synchronization complete.");
}