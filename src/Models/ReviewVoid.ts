import mongoose, { Document } from "mongoose";

export interface IReviewVoid extends Document {
    reviewId: number;
    guildId: string;
    reason: string;
}

const ReviewVoidSchema = new mongoose.Schema<IReviewVoid>({
    reviewId: { type: Number, required: true },
    guildId: { type: String, required: true },
    reason: { type: String, required: true },
});

const ReviewVoid = mongoose.model<IReviewVoid>("ReviewVoid", ReviewVoidSchema);
export default ReviewVoid;