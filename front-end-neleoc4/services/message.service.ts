import { axiosClassic } from './api.service';

const MESSAGES = '/bot';

export const MessageService = {
  async sendAll(mess: string) {
    const res = await axiosClassic({
      method: 'POST',
      url: `${MESSAGES}/sendToUsers`,
      data: { message: mess }
    });
    return res;
  },

  async sendToUser(userId: number, mess: string) {
    const res = await axiosClassic({
      method: 'POST',
      url: `${MESSAGES}/sendToUser`,
      data: {   userId, message: mess }
    });
    return res;
  }
};
