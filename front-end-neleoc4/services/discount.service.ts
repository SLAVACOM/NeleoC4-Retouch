import { axiosClassic } from './api.service';

const DISCOUNT = '/discount';

export const DiscountsService = {
  async getDiscount(): Promise<number> {
    const res = await axiosClassic({
      method: 'GET',
      url: `${DISCOUNT}`
    });
    return res.data as number;
  },

  async updateDiscount(newDiscount: number) {
    const res = await axiosClassic({
      method: 'PATCH',
      url: `${DISCOUNT}`,
      data: { discountPercentage: newDiscount }
    });
    return res;
  },

  async getGenerationCount(): Promise<number> {
    const res = await axiosClassic({
      method: 'GET',
      url: `freeGenerationCount`
    });
    return +res.data;
  },

  async updateGenerationCount(newCount: number) {
    const res = await axiosClassic({
      method: 'PUT',
      url: `freeGenerationCount`,
      data: { count: newCount }
    });
    return res;
  }
};
