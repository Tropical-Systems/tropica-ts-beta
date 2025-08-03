import mongoose, { Document } from "mongoose";

export interface I_Infract extends Document {
  infractionId: String;
  guildId: String;
  messageUrl: String;

  infracteeId: String;
  infractorId: String;

  reason: String;
  type: String;
  appealable: Boolean;
}

const infractSchema = new mongoose.Schema<I_Infract>({
  infractionId: { type: Number, required: true },
  guildId: { type: String, required: true },
  messageUrl: { type: String, required: false, default: null },

  infracteeId: { type: String, required: true },
  infractorId: { type: String, required: true },

  reason: { type: String, required: true },
  type: { type: String, required: true },
  appealable: { type: Boolean, default: true, required: true },
});

const Infract = mongoose.model<I_Infract>("infracts", infractSchema);
export default Infract;
