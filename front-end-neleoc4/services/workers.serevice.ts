import { GetWorkers, IWorker } from 'types/workers.interface';
import { axiosClassic } from './api.service';
const WORKERS = '/workers';

export const WorkersService = {
  async getWorkers(params?: Record<string, string>): Promise<GetWorkers> {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      method: 'GET',
      url: `${WORKERS}/?${queryString}`
    });
    return res.data;
  },

  async createWorker(data: IWorker) {
    const res = await axiosClassic({
      method: 'POST',
      url: `${WORKERS}/register`,
      data
    });
    return res;
  },

  async updateWorker(data: IWorker) {
    const res = await axiosClassic({
      method: 'PUT',
      url: WORKERS,
      data
    });
    return res;
  }
};
