import mongoose, { Document } from "mongoose";

export interface IOrder extends Document {
  designerId: string;
  customerId: string;
  orderId: number;
  guildId: string;
  orderChannelId: string;

  price: number;
  product: string;
  estimatedTime: string;
  completionDate: Date;
  status: string;
  notes: string;
}

const orderSchema = new mongoose.Schema<IOrder>({
  designerId: { type: String, required: true },
  customerId: { type: String, required: true },
  orderId: { type: Number, required: true },
  guildId: { type: String, required: true },
  orderChannelId: { type: String, required: true },

  price: { type: Number, required: true },
  product: { type: String, required: true },
  estimatedTime: { type: String, required: true },
  completionDate: { type: Date, required: false, default: null }, // Will only be set when the order is started by using the estimated time.
  status: { type: String, required: true },
  notes: { type: String, default: "", required: false },
});

const Order = mongoose.model<IOrder>("orders", orderSchema);
export default Order;
