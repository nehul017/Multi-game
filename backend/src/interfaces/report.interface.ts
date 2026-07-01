import { Document, Types } from 'mongoose';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IReport {
  _id: string;
  reporter: Types.ObjectId;
  reported: Types.ObjectId;
  reason: string;
  description: string;
  status: ReportStatus;
  resolvedBy: Types.ObjectId | null;
  resolution: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportDocument extends Omit<IReport, '_id'>, Document {}
