import mongoose, { Document } from "mongoose";

export interface ICredit extends Document {
    guildId: string;
    userId: string;
    creditPoints: number;

    lastEdit: Date;
    lastEditedCommand: string;
}

const creditSchema = new mongoose.Schema<ICredit>({
    guildId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    creditPoints: { type: Number, required: true, default: 0 },

    lastEdit: { type: Date, required: false, default: null },
    lastEditedCommand: { type: String, required: false, default: null },
});

const Credit = mongoose.model<ICredit>("credits", creditSchema);
export default Credit;