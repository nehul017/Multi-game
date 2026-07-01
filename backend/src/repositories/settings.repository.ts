import { BaseRepository } from './base.repository';
import { Settings } from '../models/settings.model';
import { ISettingsDocument } from '../interfaces/settings.interface';

class SettingsRepository extends BaseRepository<ISettingsDocument> {
  constructor() {
    super(Settings);
  }

  async getByKey(key: string): Promise<ISettingsDocument | null> {
    return this.model.findOne({ key }).exec();
  }

  async getByCategory(category: string): Promise<ISettingsDocument[]> {
    return this.model.find({ category }).exec();
  }

  async upsert(key: string, value: unknown, category: string, description?: string): Promise<ISettingsDocument> {
    return this.model.findOneAndUpdate(
      { key },
      { value, category, description: description || '' },
      { new: true, upsert: true, runValidators: true }
    ).exec() as Promise<ISettingsDocument>;
  }

  async getAll(): Promise<ISettingsDocument[]> {
    return this.model.find().sort({ category: 1, key: 1 }).exec();
  }
}

export const settingsRepository = new SettingsRepository();
