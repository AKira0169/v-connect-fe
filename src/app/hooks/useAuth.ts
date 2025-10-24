'use client';

import { getCurrentUser, login, logout, User } from '@/api/auth.api';
import { loginFormType } from '@/types/login/loginSchema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useLogin() {
  const queryClient = useQueryClient();
  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: async (credentials: loginFormType) => await login(credentials),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['isLoggedIn'] });
    },
    onError: () => {},
  });
  return { login: mutate, isPending, error, isError };
}
export function useLogout() {
  const queryClient = useQueryClient();
  const { mutate, isError, error, isPending } = useMutation({
    mutationFn: async () => await logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['isLoggedIn'] });
    },
    onError: () => {},
  });
  return { logout: mutate, isPending, error, isError };
}

export function useGetCurrentUser() {
  const { data, isError, error, isPending } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  return { currentUser: data, isError, error, isPending };
}
