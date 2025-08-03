import mongoose, { Document } from "mongoose";

export interface IReview extends Document {
  designerId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  product: string;
  guildId: string;
  productId: number | null;
  reviewId: number | null;
}

const ReviewSchema = new mongoose.Schema<IReview>({
  designerId: { type: String, required: true },
  reviewerId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, default: null },
  product: { type: String, required: true },
  guildId: { type: String, required: true },
  productId: { type: Number, default: null },
  reviewId: { type: Number, default: null },
});

const Review = mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
