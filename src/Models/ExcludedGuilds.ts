import mongoose, { Document } from "mongoose";

export interface IExcludedGuilds extends Document {
    guildId: string;
    reason: string;
    dateExcluded: Date;
    appealable: boolean;
}

const ExcludedGuildsSchema = new mongoose.Schema<IExcludedGuilds>({
    guildId: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    dateExcluded: { type: Date, default: Date.now },
    appealable: { type: Boolean, default: false },
});

const ExcludedGuilds = mongoose.model<IExcludedGuilds>("ExcludedGuilds", ExcludedGuildsSchema);
export default ExcludedGuilds;