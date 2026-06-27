import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Edit3,
  Globe,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { CreateClient } from './CreateClient';
import {
  useClients,
  useDeleteClient,
  useUpdateClient,
} from '../hooks/useClients';
import type { ClientResponse } from '../types';

const CLIENTS_PER_PAGE = 10;

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const GetAllClients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientToUpdate, setClientToUpdate] = useState<ClientResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedDomain, setUpdatedDomain] = useState('');
  const [updateError, setUpdateError] = useState('');

  const navigate = useNavigate();
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
      [client.client_name, client.sender_email, client.sender_domain, client.client_id]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [clients, searchTerm]);

  const activeClients = clients.filter((client) => client.is_active).length;
  const inactiveClients = clients.length - activeClients;
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedClients = filteredClients.slice(
    (safeCurrentPage - 1) * CLIENTS_PER_PAGE,
    safeCurrentPage * CLIENTS_PER_PAGE,
  );

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
          toast.success('Client was updated.', 'Client updated');
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
      message: client.client_name + ' will be removed from the active client list.',
      confirmText: 'Delete',
      cancelText: 'Keep client',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteClient(client.client_id, {
      onSuccess: () => {
        toast.success(client.client_name + ' was deleted.', 'Client deleted');
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
      },
    });
  };

  const columns: TableColumn<ClientResponse>[] = [
    {
      key: 'client',
      header: 'Client',
      accessor: (client) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
            {getInitials(client.client_name) || <Building2 className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-gray-950 dark:text-white">
                {client.client_name}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-gray-400">
              <Mail className="h-3.5 w-3.5" />
              {client.sender_email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      accessor: (client) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <Globe className="h-4 w-4 text-gray-400" />
          {client.sender_domain}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (client) => (
        <Badge variant={client.is_active ? 'success' : 'neutral'}>
          {client.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (client) => formatDate(client.created_at),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (client) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Edit ' + client.client_name}
            className="h-9 w-9"
            onClick={() => openUpdateModal(client)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Delete ' + client.client_name}
            className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/25"
            disabled={isDeleting}
            onClick={() => handleDelete(client)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-5 border-b border-gray-200 px-5 py-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                  Clients
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage client sender identities and open each client to review departments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
              disabled={isLoading}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Add Client
            </Button>
          </div>
        </div>

        <div className="grid border-b border-gray-200 dark:border-gray-800 md:grid-cols-3">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total clients
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {clients.length}
            </p>
          </div>
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Active clients
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {activeClients}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Inactive clients
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {inactiveClients}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by client, email, domain, or ID"
              icon={<Search className="h-4 w-4" />}
              fullWidth
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>{filteredClients.length} client records visible</span>
          </div>
        </div>
      </section>

      <Table
        data={paginatedClients}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No clients match the current search."
        rowKey="client_id"
        onRowClick={(client) => navigate(client.client_id)}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Client"
        size="lg"
      >
        <CreateClient onCreated={() => setIsCreateOpen(false)} />
      </Modal>

      <Modal
        isOpen={Boolean(clientToUpdate)}
        onClose={() => setClientToUpdate(null)}
        title="Update Client"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            id="update-client-name"
            label="Client name"
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

          <Input
            id="update-client-email"
            label="Sender email"
            value={updatedEmail}
            onChange={(event) => {
              setUpdatedEmail(event.target.value);
              if (updateError) setUpdateError('');
            }}
            placeholder="sender@example.com"
            disabled={isUpdating}
            fullWidth
          />

          <Input
            id="update-client-domain"
            label="Sender domain"
            value={updatedDomain}
            onChange={(event) => {
              setUpdatedDomain(event.target.value);
              if (updateError) setUpdateError('');
            }}
            placeholder="example.com"
            disabled={isUpdating}
            fullWidth
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClientToUpdate(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
