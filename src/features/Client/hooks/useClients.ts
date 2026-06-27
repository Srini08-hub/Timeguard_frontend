import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientService } from '../services/clientService';
import type {
  ClientCreate,
  ClientResponse,
  ClientUpdate,
} from '../types';

export const clientQueryKeys = {
  all: ['clients'] as const,
  detail: (clientId: string) => ['clients', clientId] as const,
};

export const useClients = () => {
  return useQuery<ClientResponse[], Error>({
    queryKey: clientQueryKeys.all,
    queryFn: clientService.getClients,
  });
};

export const useClient = (clientId?: string) => {
  return useQuery<ClientResponse, Error>({
    queryKey: clientId ? clientQueryKeys.detail(clientId) : ['clients', 'detail'],
    queryFn: () => clientService.getClients().then((clients) => clients.find((client) => client.client_id === clientId)!),
    enabled: Boolean(clientId),
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation<ClientResponse, Error, ClientCreate>({
    mutationFn: clientService.createClient,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(client.client_id) });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ClientResponse,
    Error,
    { clientId: string; clientData: ClientUpdate }
  >({
    mutationFn: ({ clientId, clientData }) =>
      clientService.updateClient(clientId, clientData),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(client.client_id) });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: clientService.deleteClient,
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: ['employees', 'unassigned'] });
    },
  });
};
