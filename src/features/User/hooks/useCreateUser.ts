import { useMutation, useQueryClient } from '@tanstack/react-query';
import  userService  from '../services/userService';
import type { CreateUserRequest, UserInfo } from '../types/index';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<UserInfo, Error, CreateUserRequest>({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
