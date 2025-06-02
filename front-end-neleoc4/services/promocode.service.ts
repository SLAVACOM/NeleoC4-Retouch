import { GetPromoCodes, IPromoCode } from 'types/promocodes.interface';
import { axiosClassic, instance } from './api.service';

const PROMOCODES = '/promocodes';
export const PromoCodeService = {
  async getPromoCodes(params?: Record<string, string>): Promise<GetPromoCodes> {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      method: 'GET',
      url: `${PROMOCODES}?${queryString}`
    });
    console.log(res.request);

    return res.data as GetPromoCodes;
  },

  async update(data: IPromoCode, code: string) {
    const res = await instance({
      method: 'PATCH',
      url: `${PROMOCODES}/update/${code}`,
      data
    });
    return res;
  },

  async create(data: IPromoCode) {
    const res = await instance({
      method: 'POST',
      url: PROMOCODES,
      data
    });
    return res;
  },

  async getPromoCode(id: number): Promise<IPromoCode> {
    const res = await axiosClassic({
      method: 'GET',
      url: `${PROMOCODES}/${id}`
    });
    return res.data;
  }
};
