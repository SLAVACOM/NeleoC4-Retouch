import { axiosClassic } from './api.service';

const MESSAGES = '/bot';

export const MessageService = {
  async sendAll(mess: string, files?: File[], pinned?: boolean) {
    const formData = new FormData();
    formData.append('message', mess);

    if (pinned !== undefined) {
      formData.append('pinned', pinned.toString());
    }

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`photo`, file);
      });
    }

    const res = await axiosClassic({
      method: 'POST',
      url: `${MESSAGES}/sendToUsers`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res;
  },

  async sendToUser(userId: number, mess: string) {
    const res = await axiosClassic({
      method: 'POST',
      url: `${MESSAGES}/sendToUser`,
      data: { userId, message: mess }
    });
    return res;
  }
};
