import { axiosClassic } from './api.service';

const PAYMENTS = '/payments';

export const PaymentsService = {
  async getPayments(params?: Record<string, string>): Promise<GetPayments> {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      url: `${PAYMENTS}/get?${queryString}`,
      method: 'GET'
    });
    return res.data as GetPayments;
  }
};

export interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  generationCount: number;
  user: {
    id: number;
    telegramUsername: string;
    telegramId: number;
  };

  promoCode: string | null;
}

export interface GetPayments {
  payments: Payment[];
  totalPayments: number;
  pagesCount: number;
}
