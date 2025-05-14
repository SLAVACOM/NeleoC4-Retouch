import { axiosClassic } from './api.service';

const TARIFFS = '/products';

export const TariffService = {
  async getTariffs(params?: Record<string, string>): Promise<GetTariffs> {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      url: `${TARIFFS}?${queryString}`,
      method: 'GET'
    });
    console.log('res', res);
    return res.data as GetTariffs;
  },

  async createProduct(data: ITariff): Promise<ITariff> {
    const res = await axiosClassic({
      url: TARIFFS,
      method: 'POST',
      data
    });

    return res.data as ITariff;
  },

  async updateProduct(data: ITariff): Promise<ITariff> {
    const res = await axiosClassic({
      url: `${TARIFFS}`,
      method: 'PUT',
      data
    });
    return res.data as ITariff;
  }
};

export interface ITariff {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  generationCount: number;
  price: number;
  IsDelete: boolean;
}

export interface GetTariffs {
  products: ITariff[];
  count: number;
  totalPages: number;
}
