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
  }
};
