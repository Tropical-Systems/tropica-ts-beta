import mongoose, { Document } from "mongoose";
// Tax rate in 1.xx (for calculation: (price * taxRate) / 0.7)

export interface IConfig extends Document {
  guildId: string;
  bannerUrl: string | null;
  taxRate: number;

  color: string; // Hex color without the hash (#)

  designerRole: string | null;

  infractionRole: string | null;
  infractChannel: string | null;

  demotionChannel: string | null;
  promotionChannel: string | null;
  managementRole: string | null;

  reviewChannel: string | null;
  reviewerRole: string | null;

  orderLogChannel: string | null;
  orderLogRole: string | null;

  qcApprover: string | null;
  qcChannel: string | null;

  creditManagerRole: string | null;
  creditLogChannel: string | null;
}

const ConfigSchema = new mongoose.Schema<IConfig>({
  guildId: { type: String, required: true, unique: true },
  bannerUrl: { type: String, default: null },
  taxRate: { type: Number, default: 1.0 },

  color: { type: String, default: "000000" }, // Default color in hex format without the hash (#)

  designerRole: { type: String, default: null },

  infractionRole: { type: String, default: null },
  infractChannel: { type: String, default: null },

  demotionChannel: { type: String, default: null },
  promotionChannel: { type: String, default: null },
  managementRole: { type: String, default: null },

  reviewChannel: { type: String, default: null },
  reviewerRole: { type: String, default: null },

  orderLogChannel: { type: String, default: null },

  qcApprover: { type: String, default: null },
  qcChannel: { type: String, default: null },

  creditManagerRole: { type: String, default: null },
  creditLogChannel: { type: String, default: null }
});

const Config = mongoose.model<IConfig>("config", ConfigSchema);
export default Config;
