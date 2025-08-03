import mongoose, { Document } from "mongoose";

interface IGuild extends Document {
  guildId: String;
  guildName: String;
  guildIcon: String | null;
  guildBanner: String | null;
}

const guildSchema = new mongoose.Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, required: true },
  guildIcon: { type: String, default: null },
  guildBanner: { type: String, default: null },
});

const Guild = mongoose.model<IGuild>("guilds", guildSchema);
export default Guild;
