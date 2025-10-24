import { loginFormType } from '@/types/login/loginSchema';
import apiClient from '@/utils/apiClient';
import { handleApiError } from '@/utils/handleApiError';

export async function isLoggedIn(): Promise<boolean> {
  try {
    const res = await apiClient.get('auth/isLoggedIn');
    return res.data.data.isLoggedIn;
  } catch (error) {
    handleApiError(error);
  }
}

export async function login(credentials: loginFormType) {
  try {
    const res = await apiClient.post('auth/login', credentials);
    return res.data.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function logout() {
  try {
    const res = await apiClient.post('auth/signout');
    return res.data.data;
  } catch (error) {
    handleApiError(error);
  }
}

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  phone: string;
  profilePic: string;
};
export async function getCurrentUser(): Promise<User> {
  try {
    const res = await apiClient.get('user/me');
    return res.data.data as User;
  } catch (error) {
    handleApiError(error);
  }
}
