import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { paginate, buildSortQuery } from '../utils/helpers';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findById(id: string, populate?: string): Promise<T | null> {
    const query = this.model.findById(id);
    if (populate) query.populate(populate);
    return query.exec();
  }

  async findOne(filter: FilterQuery<T>, populate?: string): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (populate) query.populate(populate);
    return query.exec();
  }

  async findMany(
    filter: FilterQuery<T>,
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      populate?: string;
      select?: string;
    } = {}
  ): Promise<{ data: T[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const { skip } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(options.sort ? buildSortQuery(options.sort) : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(options.populate || '')
        .select(options.select || '')
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async updateById(id: string, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true, ...options }).exec();
  }

  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, data, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount || 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }
}
