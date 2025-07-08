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
  },

  async getMessages() {
    const res = await axiosClassic({
      method: 'GET',
      url: 'messages/localization'
    });
    return res;
  },

  async createMessage(message: Partial<IMessage>) {
    const res = await axiosClassic({
      method: 'POST',
      url: 'messages/localization',
      data: message
    });
    return res;
  },

  async updateMessage(message: Partial<IMessage>) {
    const res = await axiosClassic({
      method: 'PUT',
      url: `messages/localization`,
      data: message
    });
    return res;
  }
};
export interface IMessage {
  id: number;
  createdAt: string;
  updatedAt: string;
  messageName: string;
  messageText: string;
}

export interface GetMessages {
  messages: IMessage[];
  count: number;
  totalPages: number;
}
