import mongoose from "mongoose";
import config from "../config.js";
import axios from "axios";
import { Logger, LogType } from "./Logger.js";

const PING_INTERVAL: number = 5 * 60 * 1000; // 5 minutes

if (!config.dbStatusUrl) {
    throw new Error("DB_HEARTBEAT_URL is not defined in the config file.");
}

const DB_HEARTBEAT_URL: string = config.dbStatusUrl;


export async function startStayAliveDb() {
    if (!config?.mongodbUri) {
        throw new Error("MongoDB URI is not defined in the config file.");
    }

    try {
        await mongoose.connect(config.mongodbUri);
        Logger.log(LogType.StartUp, "Connected to MongoDB successfully.");

        await sendHeartbeat(DB_HEARTBEAT_URL, "database");
        setInterval(() => sendHeartbeat(DB_HEARTBEAT_URL, "database"), PING_INTERVAL);

    } catch (err) {
        console.error("[System]: Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

export async function sendHeartbeat(url: string, type: string) {
    Logger.log(LogType.BetterStackStatusUpdate, `Pinging BetterStack (${type})...`);
    try {
        await axios.get(url);
        Logger.log(LogType.BetterStackStatusUpdate, `Successfully pinged BetterStack (${type})`);
    } catch (error) {
        Logger.log(LogType.BetterStackStatusUpdate, `Failed to ping BetterStack (${type}): ${error}`);
    }
}
