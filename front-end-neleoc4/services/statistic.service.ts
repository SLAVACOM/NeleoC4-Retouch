import { axiosClassic } from './api.service';

const STATISTICS = '/statistics';

export const StatisticsService = {
  async getDiscount() {
    const res = await axiosClassic({
      method: 'GET',
      url: `${STATISTICS}`
    });
    return res;
  },

  async getStatistics(params?: Record<string, string>) {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = queryString ? `${STATISTICS}?${queryString}` : STATISTICS;
    
    const res = await axiosClassic({
      method: 'GET',
      url: url
    });
    return res;
  }
};
