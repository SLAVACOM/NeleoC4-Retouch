import { axiosClassic } from './api.service';

const SETTINGS = '/settings';

export interface Settings {
  id: number;
  settings: string;
}

interface BaseSettings {
  id: number;
  name: string;
  settings: Settings;
}

export interface GetSettings {
  settings: Settings[];
  baseSettings: BaseSettings[];
}

export const RetouchSettingsService = {
  async getSettings(): Promise<GetSettings> {
    const res = await axiosClassic({
      method: 'GET',
      url: `${SETTINGS}`
    });
    return res.data;
  },

  async updateSetting(setting: Settings): Promise<any> {
    const res = await axiosClassic({
      method: 'PUT',
      url: `${SETTINGS}/${setting.id}`,
      data: setting
    });
    return res.data;
  },

  async createSetting(setting: Settings): Promise<any> {
    const res = await axiosClassic({
      method: 'POST',
      url: `${SETTINGS}`,
      data: setting
    });
    return res.data;
  },

  async updateBase(setting: BaseSettings): Promise<any> {
    const res = await axiosClassic({
      method: 'PUT',
      url: `${SETTINGS}/base/${setting.id}`,
      data: setting
    });
    return res.data;
  }
};


