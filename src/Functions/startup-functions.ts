import mongoose from "mongoose";
import config from "../config";
import axios from "axios";

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
        console.log("[System]: Connected to MongoDB successfully.");
        // Immediately send first heartbeat
        await sendHeartbeat(DB_HEARTBEAT_URL, "database");
        // Schedule recurring heartbeat
        setInterval(() => sendHeartbeat(DB_HEARTBEAT_URL, "database"), PING_INTERVAL);

    } catch (err) {
        console.error("[System]: Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

export async function sendHeartbeat(url: string, type: string) {
    console.log(`Pinging BetterStack (${type})...`);
    try {
        await axios.get(url);
        console.log(`Successfully pinged BetterStack (${type})`);
    } catch (error) {
        console.error(`Failed to ping BetterStack (${type}):`, error);
    }
}

