import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Globe,
  Mail,
  Plus,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { GetAllDepartments } from '../../Department/components/GetAllDepartments';
import { useCreateDepartment } from '../../Department/hooks/useDepartments';
import { useClient } from '../hooks/useClients';

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'long',
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

export const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: client, error: clientError, isLoading: isClientLoading } = useClient(clientId);
  const { mutate: createDepartment, isPending } = useCreateDepartment();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [error, setError] = useState('');

  const handleCreateDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;

    const trimmedName = departmentName.trim();
    if (!trimmedName) {
      setError('Department name is required');
      toast.warning('Enter a department name.', 'Missing detail');
      return;
    }

    createDepartment(
      { client_id: client.client_id, department_name: trimmedName },
      {
        onSuccess: () => {
          setDepartmentName('');
          setError('');
          setIsCreateModalOpen(false);
          toast.success('Department created successfully.', 'Department created');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  if (isClientLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/70 p-8 text-center dark:border-red-950/40 dark:bg-red-950/15">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
          Client profile unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {clientError?.message || 'The selected client could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('/ops-admin/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/ops-admin/clients')}
        >
          Clients
        </Button>
        {/* <Button
          type="button"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Department
        </Button> */}
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-semibold text-white shadow-sm shadow-blue-600/25">
                {getInitials(client.client_name) || <Building2 className="h-7 w-7" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                    {client.client_name}
                  </h1>
                  <Badge variant={client.is_active ? 'success' : 'neutral'}>
                    {client.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  {client.sender_email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Client ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-950 dark:text-white">
                {client.client_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Sender domain
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {client.sender_domain}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Client status
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {client.is_active ? 'Operational' : 'Inactive record'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {formatDate(client.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GetAllDepartments
        clientId={client.client_id}
        onCreate={() => setIsCreateModalOpen(true)}
        onDepartmentClick={(department) => navigate('departments/' + department.department_id)}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Department"
        size="md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-5">
          <Input
            id="department-name"
            label="Department name"
            value={departmentName}
            onChange={(event) => {
              setDepartmentName(event.target.value);
              if (error) setError('');
            }}
            error={error}
            placeholder="e.g. Engineering, Marketing, HR"
            disabled={isPending}
            fullWidth
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
