import { GetMyUsers, MyUser, UserMoreInfo } from 'types/user.interface';
import { axiosClassic } from './api.service';

const USERS = '/users';

export const UsersService = {
  async getUsers(params?: Record<string, string>): Promise<GetMyUsers> {
    const queryString = new URLSearchParams(params).toString();
    const res = await axiosClassic({
      url: `${USERS}?${queryString}`,
      method: 'GET'
    });
    return res.data as GetMyUsers;
  },

  async getUser(id: number): Promise<MyUser> {
    const res = await axiosClassic({
      url: `${USERS}/${id}`,
      method: 'GET'
    });
    return res.data;
  },

  async getUserMoreInfo(id: number): Promise<UserMoreInfo> {
    const res = await axiosClassic({
      url: `${USERS}/${id}/more`,
      method: 'GET'
    });
    return res.data;
  },

  async updateUser(user: MyUser) {
    const res = await axiosClassic({
      url: `${USERS}`,
      method: 'PUT',
      data: user
    });
    return res;
  }
};
