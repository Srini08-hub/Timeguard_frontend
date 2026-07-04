import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode, UIEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  IndianRupee,
  Search,
  UserPlus,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { assignmentService } from '../../Assignments/services/assignmentService';
import type { AssignmentCreate } from '../../Assignments/types';
import { clientService } from '../../Client/services/clientService';
import type { ClientResponse } from '../../Client/types';
import departmentService from '../../Department/services/departmentService';
import type { DepartmentResponse } from '../../Department/types';
import { useEmployee } from '../hooks/useEmployees';

const ROW_HEIGHT = 56;
const LIST_HEIGHT = 520;
const OVERSCAN_ROWS = 6;

type AssignmentListItem = {
  id: string;
  label: string;
  subLabel?: string;
};

interface VirtualSelectionListProps {
  items: AssignmentListItem[];
  emptyMessage: string;
  onSelect: (item: AssignmentListItem) => void;
}

const useFilteredItems = (items: AssignmentListItem[], searchTerm: string) => {
  return useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return items;

    return items.filter((item) => (
      [item.label, item.subLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    ));
  }, [items, searchTerm]);
};

const VirtualSelectionList = ({ items, emptyMessage, onSelect }: VirtualSelectionListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
  const visibleCount = Math.ceil(LIST_HEIGHT / ROW_HEIGHT) + OVERSCAN_ROWS * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  if (items.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center border-y border-[var(--border-color)] bg-white text-sm text-[var(--text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto border-y border-[var(--border-color)] bg-white"
      style={{ height: LIST_HEIGHT }}
      onScroll={handleScroll}
    >
      <div className="relative" style={{ height: totalHeight }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}
        >
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between gap-4 border-b border-[var(--border-color)] px-5 text-left transition-colors hover:bg-[var(--bg-card-soft)] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--primary)]"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onSelect(item)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </span>
                {item.subLabel && (
                  <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                    {item.subLabel}
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AssignmentPageShell = ({
  title,
  backLabel,
  onBack,
  searchTerm,
  onSearchChange,
  children,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
        >
          {backLabel}
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h1>
          </div>
        </div>

        <div className="px-5 py-4">
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={'Search ' + title.toLowerCase() + '...'}
            icon={<Search className="h-4 w-4" />}
            fullWidth
          />
        </div>

        {children}
      </section>
    </div>
  );
};

const isValidPayRate = (value: string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
};

export const EmployeeAssignmentClients = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [], error, isLoading } = useQuery<ClientResponse[], Error>({
    queryKey: ['employee-assignment', 'clients'],
    queryFn: clientService.getClients,
  });

  const clientItems = useMemo<AssignmentListItem[]>(() => (
    clients.map((client) => ({
      id: client.client_id,
      label: client.client_name,
      subLabel: client.sender_domain || client.sender_email,
    }))
  ), [clients]);
  const filteredClients = useFilteredItems(clientItems, searchTerm);

  return (
    <AssignmentPageShell
      title="Clients"
      backLabel="Employee"
      onBack={() => navigate('/ops-admin/employees/' + empId)}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    >
      {isLoading ? (
        <div className="flex h-56 flex-col items-center justify-center border-y border-[var(--border-color)] bg-white">
          <Spinner />
          <p className="mt-3 text-sm text-[var(--text-muted)]">Loading clients...</p>
        </div>
      ) : error ? (
        <div className="border-y border-red-200 bg-[var(--danger-bg)] px-5 py-8 text-center text-sm text-[var(--danger-text)]">
          {error.message}
        </div>
      ) : (
        <VirtualSelectionList
          items={filteredClients}
          emptyMessage="No clients match the current search."
          onSelect={(client) => navigate('/ops-admin/employees/' + empId + '/assign/' + client.id + '/departments')}
        />
      )}
    </AssignmentPageShell>
  );
};

export const EmployeeAssignmentDepartments = () => {
  const { empId, clientId } = useParams<{ empId: string; clientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<AssignmentListItem | null>(null);
  const [payRate, setPayRate] = useState('');
  const [payRateError, setPayRateError] = useState('');

  const { data: employee } = useEmployee(empId);
  const { data: departments = [], error, isLoading } = useQuery<DepartmentResponse[], Error>({
    queryKey: ['employee-assignment', 'departments', clientId],
    queryFn: () => departmentService.getDepartmentsByClient(clientId ?? ''),
    enabled: Boolean(clientId),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (assignment: AssignmentCreate[]) => assignmentService.createAssignment(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      if (empId) {
        queryClient.invalidateQueries({ queryKey: ['employees', empId] });
      }
      toast.success('Employee assignment was created.', 'Assignment complete');
      navigate('/ops-admin/employees/' + empId);
    },
    onError: (requestError: Error) => {
      toast.error(requestError.message, 'Assignment failed');
    },
  });

  const departmentItems = useMemo<AssignmentListItem[]>(() => (
    departments.map((department) => ({
      id: department.department_id,
      label: department.department_name,
      subLabel: 'Department',
    }))
  ), [departments]);
  const filteredDepartments = useFilteredItems(departmentItems, searchTerm);

  const closePayRateModal = () => {
    if (createAssignmentMutation.isPending) return;
    setSelectedDepartment(null);
    setPayRate('');
    setPayRateError('');
  };

  const handleSubmitAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!empId || !clientId || !selectedDepartment) return;
    if (!isValidPayRate(payRate)) {
      setPayRateError('Enter a pay rate greater than 0.');
      return;
    }

    createAssignmentMutation.mutate([
      {
        emp_id: empId,
        client_id: clientId,
        department_id: selectedDepartment.id,
        pay_rate: Number(payRate),
      },
    ]);
  };

  return (
    <>
      <AssignmentPageShell
        title="Departments"
        backLabel="Clients"
        onBack={() => navigate('/ops-admin/employees/' + empId + '/assign')}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      >
        {isLoading ? (
          <div className="flex h-56 flex-col items-center justify-center border-y border-[var(--border-color)] bg-white">
            <Spinner />
            <p className="mt-3 text-sm text-[var(--text-muted)]">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="border-y border-red-200 bg-[var(--danger-bg)] px-5 py-8 text-center text-sm text-[var(--danger-text)]">
            {error.message}
          </div>
        ) : (
          <VirtualSelectionList
            items={filteredDepartments}
            emptyMessage="No departments match the current search."
            onSelect={setSelectedDepartment}
          />
        )}
      </AssignmentPageShell>

      <Modal
        isOpen={Boolean(selectedDepartment)}
        onClose={closePayRateModal}
        title="Assign employee"
        size="md"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-5">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-4 py-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[var(--primary)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {selectedDepartment?.label}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {employee?.name || empId}
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Pay rate"
            type="number"
            min="0.01"
            step="0.01"
            value={payRate}
            onChange={(event) => {
              setPayRate(event.target.value);
              if (payRateError) setPayRateError('');
            }}
            placeholder="0.00"
            icon={<IndianRupee className="h-4 w-4" />}
            error={payRateError}
            disabled={createAssignmentMutation.isPending}
            fullWidth
            required
          />

          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={closePayRateModal}
              disabled={createAssignmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createAssignmentMutation.isPending}
            >
              Assign Employee
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
