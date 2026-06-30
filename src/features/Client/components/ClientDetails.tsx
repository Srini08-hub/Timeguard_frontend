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
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Client profile unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
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

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-semibold text-white shadow-sm shadow-blue-700/15">
                {getInitials(client.client_name) || <Building2 className="h-7 w-7" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {client.client_name}
                  </h1>
                  <Badge variant={client.is_active ? 'success' : 'neutral'}>
                    {client.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Mail className="h-4 w-4" />
                  {client.sender_email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Client ID
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
                {client.client_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Sender domain
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {client.sender_domain}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Client status
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {client.is_active ? 'Operational' : 'Inactive record'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
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

          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
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
