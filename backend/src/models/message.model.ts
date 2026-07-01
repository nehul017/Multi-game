import mongoose, { Schema } from 'mongoose';
import { IMessageDocument } from '../interfaces/message.interface';

const messageSchema = new Schema<IMessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    room: { type: String, default: null, index: true },
    content: { type: String, required: [true, 'Message content is required'], maxlength: 2000 },
    type: { type: String, enum: ['text', 'emoji', 'system'], default: 'text' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
