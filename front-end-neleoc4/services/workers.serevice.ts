import { GetWorkers, IHelperWorker, IWorker } from 'types/workers.interface';
import { axiosClassic } from './api.service';

const WORKERS = '/workers';
const SUPPORT = '/support';

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
  },

  async getHelpers(): Promise<IHelperWorker[]> { 
    const res = await axiosClassic({
      method: 'GET',
      url: SUPPORT
    }) 
    return res.data;
  },

  async createHelper(data: IHelperWorker) {
    const res = await axiosClassic({
      method: 'POST',
      url: SUPPORT,
      data
    });
    return res;
  },

  async updateHelper(data: IHelperWorker) {
    const res = await axiosClassic({
      method: 'PUT',
      url: SUPPORT,
      data
    });
    return res;
  },
}
