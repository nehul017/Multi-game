import mongoose, { Schema } from 'mongoose';
import { IReportDocument } from '../interfaces/report.interface';

const reportSchema = new Schema<IReportDocument>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reported: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: ['cheating', 'harassment', 'spam', 'inappropriate_content', 'other'],
    },
    description: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolution: { type: String, default: '' },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1 });
reportSchema.index({ reported: 1 });

export const Report = mongoose.model<IReportDocument>('Report', reportSchema);
