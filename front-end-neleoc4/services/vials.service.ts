import { axiosClassic } from './api.service';

const VIALS = '/vials';

export const VialsService = {
  async getVials(params?: Record<string, string>) {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      url: `${VIALS}?${queryString}`,
      method: 'GET'
    });
    return res;
  },

  async createCollection(collection: VialCollection) {
    const res = await axiosClassic({
      url: `${VIALS}/collection`,
      method: 'POST',
      data: collection
    });
    return res;
  },

  async updateCollection(collection: VialCollection) {
    const res = await axiosClassic({
      url: `${VIALS}/collection/${collection.id}`,
      method: 'PUT',
      data: collection
    });
    return res;
  },

  async updateVial(vial: Vial) {
    const res = await axiosClassic({
      url: `${VIALS}/${vial.id}`,
      method: 'PUT',
      data: vial
    });
    return res;
  },

  async createVial(vial: Vial) {
    const res = await axiosClassic({
      url: `${VIALS}`,
      method: 'POST',
      data: vial
    });
    return res;
  }
};
