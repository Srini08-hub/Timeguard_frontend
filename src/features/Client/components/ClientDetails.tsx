import { type FormEvent, useState } from 'react';
import { ArrowLeft, Building2, Mail, Plus, Globe } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../hooks/useToast';
import { GetAllDepartments } from '../../Department/components/GetAllDepartments';
import { DepartmentDetails } from '../../Department/components/DepartmentDetails';
import { useCreateDepartment } from '../../Department/hooks/useDepartments';
import type { ClientResponse } from '../types';
import type { DepartmentCreate } from '../../Department/types';
import type { DepartmentResponse } from '../../Department/types';

interface ClientDetailsProps {
  client: ClientResponse;
  onBack?: () => void;
}

type DepartmentView = 'details' | 'departments' | 'department-details';

export const ClientDetails = ({ client, onBack }: ClientDetailsProps) => {
  const [view, setView] = useState<DepartmentView>('details');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [error, setError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentResponse | null>(null);

  const toast = useToast();
  const { mutate: createDepartment, isPending } = useCreateDepartment();

  const handleCreateDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
          setView('departments');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  const handleDepartmentClick = (department: DepartmentResponse) => {
    setSelectedDepartment(department);
    setView('department-details');
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={onBack}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Client Details
          </h1>
        </div>

        {view === 'departments' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setView('details')}
          >
            Client Details
          </Button>
        )}

        {view === 'department-details' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setView('departments')}
          >
            Departments
          </Button>
        )}
      </div>

      {view === 'details' && (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/35 dark:text-blue-300">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
                    {client.client_name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Client information and department management
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                    Client ID
                  </label>
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {client.client_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                    Status
                  </label>
                  <Badge variant={client.is_active ? 'success' : 'neutral'}>
                    {client.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                    Sender Email
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    {client.sender_email}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                    Sender Domain
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Globe className="h-4 w-4" />
                    {client.sender_domain}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                    Created At
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(client.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Add Department
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  icon={<Building2 className="h-4 w-4" />}
                  onClick={() => setView('departments')}
                >
                  Get All Departments
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'departments' && (
        <GetAllDepartments
          clientId={client.client_id}
          onDepartmentClick={handleDepartmentClick}
        />
      )}

      {view === 'department-details' && selectedDepartment && (
        <DepartmentDetails
          department={selectedDepartment}
          clientId={client.client_id}
          onBack={() => setView('departments')}
        />
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Department"
        size="md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="department-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Department Name
            </label>
            <Input
              id="department-name"
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
          </div>

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
