import { settingsRepository } from '../repositories/settings.repository';
import { SETTING_DEFINITIONS } from '../utils/settings.constants';

class SettingsService {
  async getPlatformStatus(): Promise<{ maintenanceMode: boolean }> {
    const maintenance = await settingsRepository.getByKey('maintenance_mode');

    return {
      maintenanceMode: Boolean(
        maintenance?.value ?? SETTING_DEFINITIONS.maintenanceMode.defaultValue
      ),
    };
  }
}

export const settingsService = new SettingsService();
