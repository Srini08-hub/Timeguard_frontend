import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { GetClient } from './GetClient';
import {
  useDeleteClient,
  useUpdateClient,
  useClients,
} from '../hooks/useClients';
import type { ClientResponse } from '../types';

interface GetAllClientsProps {
  onCreate?: () => void;
  onClientClick?: (client: ClientResponse) => void;
}

export const GetAllClients = ({ onCreate, onClientClick }: GetAllClientsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToUpdate, setClientToUpdate] =
    useState<ClientResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedDomain, setUpdatedDomain] = useState('');
  const [updateError, setUpdateError] = useState('');

  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: clients = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useClients();
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return clients;

    return clients.filter((client) =>
      client.client_name.toLowerCase().includes(normalizedSearch) ||
      client.sender_email.toLowerCase().includes(normalizedSearch),
    );
  }, [clients, searchTerm]);

  const openUpdateModal = (client: ClientResponse) => {
    setClientToUpdate(client);
    setUpdatedName(client.client_name);
    setUpdatedEmail(client.sender_email);
    setUpdatedDomain(client.sender_domain);
    setUpdateError('');
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientToUpdate) return;

    const trimmedName = updatedName.trim();
    const trimmedEmail = updatedEmail.trim();
    const trimmedDomain = updatedDomain.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDomain) {
      setUpdateError('All fields are required');
      toast.warning('Fill in all required fields.', 'Missing details');
      return;
    }

    updateClient(
      {
        clientId: clientToUpdate.client_id,
        clientData: {
          client_name: trimmedName,
          sender_email: trimmedEmail,
          sender_domain: trimmedDomain,
        },
      },
      {
        onSuccess: () => {
          setClientToUpdate(null);
          setUpdatedName('');
          setUpdatedEmail('');
          setUpdatedDomain('');
          toast.success(`Client was updated.`, 'Client updated');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Update failed');
        },
      },
    );
  };

  const handleDelete = async (client: ClientResponse) => {
    const confirmed = await confirm({
      title: 'Delete client?',
      message: `${client.client_name} will be removed from the active client list.`,
      confirmText: 'Delete',
      cancelText: 'Keep client',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteClient(client.client_id, {
      onSuccess: () => {
        toast.success(`${client.client_name} was deleted.`, 'Client deleted');
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
      },
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Available Clients ({filteredClients.length})
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search clients"
              icon={<Search className="h-4 w-4" />}
              fullWidth
            />
          </div>
          <Button
            type="button"
            variant="outline"
            icon={
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
              />
            }
            disabled={isLoading}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreate}
          >
            Create
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading clients...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-950/30 dark:bg-red-950/10">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">
            Failed to load clients
          </h3>
          <p className="mt-1 text-xs text-red-650 dark:text-red-500">
            {error.message}
          </p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
          <Building2 className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            No clients found
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create a client or adjust your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClients.map((client) => (
            <GetClient
              key={client.client_id}
              client={client}
              onUpdate={openUpdateModal}
              onDelete={handleDelete}
              onClientClick={onClientClick}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(clientToUpdate)}
        onClose={() => setClientToUpdate(null)}
        title="Update Client"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="update-client-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Client name
            </label>
            <Input
              id="update-client-name"
              value={updatedName}
              onChange={(event) => {
                setUpdatedName(event.target.value);
                if (updateError) setUpdateError('');
              }}
              error={updateError}
              placeholder="Client name"
              disabled={isUpdating}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-client-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Sender email
            </label>
            <Input
              id="update-client-email"
              value={updatedEmail}
              onChange={(event) => {
                setUpdatedEmail(event.target.value);
                if (updateError) setUpdateError('');
              }}
              placeholder="sender@example.com"
              disabled={isUpdating}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-client-domain"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Sender domain
            </label>
            <Input
              id="update-client-domain"
              value={updatedDomain}
              onChange={(event) => {
                setUpdatedDomain(event.target.value);
                if (updateError) setUpdateError('');
              }}
              placeholder="example.com"
              disabled={isUpdating}
              fullWidth
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClientToUpdate(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
