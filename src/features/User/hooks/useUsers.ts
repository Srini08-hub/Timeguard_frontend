import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import type { UpdateUserRequest, UserInfo } from '../types';

export const userQueryKeys = {
  all: ['users'] as const,
  detail: (userId: string) => ['users', userId] as const,
};

export const useUsers = () => {
  return useQuery<UserInfo[], Error>({
    queryKey: userQueryKeys.all,
    queryFn: userService.getUsers,
  });
};

export const useUser = (userId?: string) => {
  return useQuery<UserInfo, Error>({
    queryKey: userId ? userQueryKeys.detail(userId) : ['users', 'detail'],
    queryFn: () => userService.getUsers().then(users => users.find(u => u.user_id === userId)!),
    enabled: Boolean(userId),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserInfo,
    Error,
    { userId: string; userData: UpdateUserRequest }
  >({
    mutationFn: ({ userId, userData }) =>
      userService.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
};
