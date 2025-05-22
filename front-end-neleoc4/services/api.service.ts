import axios from 'axios';
import { getSession } from 'next-auth/react';
import { getContentType } from './api.helper';

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://89.111.131.235:5000/';
// const SERVER_URL = process.env.API_URL || 'http://localhost:5000/';
console.log('SERVER_URL:', process.env.NEXT_PUBLIC_API_URL);

const axiosOptions = {
  baseURL: SERVER_URL,
  headers: getContentType()
};

export const instance = axios.create(axiosOptions);

export const axiosClassic = axios.create(axiosOptions);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response)
      return Promise.reject({
        message: error.response.data.message || 'Ошибка сервера'
      });
    else if (error.request)
      return Promise.reject({ message: 'Ошибка запроса' });
    else return Promise.reject({ message: error.message });
  }
);

axiosClassic.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

axiosClassic.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Error response:', error.response);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);
