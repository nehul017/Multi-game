import { BaseRepository } from './base.repository';
import { Report } from '../models/report.model';
import { IReportDocument } from '../interfaces/report.interface';

class ReportRepository extends BaseRepository<IReportDocument> {
  constructor() {
    super(Report);
  }

  async findPending(page: number, limit: number): Promise<{ data: IReportDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ status: 'pending' }, {
      page,
      limit,
      sort: '-createdAt',
      populate: 'reporter reported resolvedBy',
    });
  }

  async findByReporter(reporterId: string): Promise<IReportDocument[]> {
    return this.model.find({ reporter: reporterId }).populate('reported', 'username').exec();
  }

  async findByReported(reportedId: string): Promise<IReportDocument[]> {
    return this.model.find({ reported: reportedId }).populate('reporter', 'username').exec();
  }

  async resolve(reportId: string, resolvedBy: string, resolution: string, status: 'resolved' | 'dismissed'): Promise<IReportDocument | null> {
    return this.model
      .findByIdAndUpdate(reportId, { resolvedBy, resolution, status }, { new: true })
      .exec();
  }
}

export const reportRepository = new ReportRepository();
