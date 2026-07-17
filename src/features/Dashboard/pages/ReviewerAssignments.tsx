import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Building2, BriefcaseBusiness, Filter, Search, UserCheck, UsersRound } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useClients } from '../../Client/hooks/useClients';
import type { ClientResponse } from '../../Client/types';
import { departmentQueryKeys } from '../../Department/hooks/useDepartments';
import departmentService from '../../Department/services/departmentService';
import type { DepartmentResponse } from '../../Department/types';
import { useActiveEmployees } from '../../Employee/hooks/useEmployees';
import type { EmployeeResponse } from '../../Employee/types';

const PAGE_SIZE = 15;
type AssignmentStatusFilter = 'all' | 'assigned' | 'unassigned';

interface AssignmentRow {
  empId: string;
  employeeName: string;
  email: string;
  clientName: string;
  departmentName: string;
  isAssigned: boolean;
}

const statusFilterOptions: Array<{ value: AssignmentStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
];

const normalizeSearch = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

const buildClientLookup = (clients: ClientResponse[]) => {
  return new Map(clients.map((client) => [client.client_id, client]));
};

const buildDepartmentLookup = (departments: DepartmentResponse[]) => {
  return new Map(departments.map((department) => [department.department_id, department]));
};

const buildAssignmentRows = (
  employees: EmployeeResponse[],
  clients: ClientResponse[],
  departments: DepartmentResponse[],
): AssignmentRow[] => {
  const clientsById = buildClientLookup(clients);
  const departmentsById = buildDepartmentLookup(departments);

  return employees
    .map((employee) => {
      const department = employee.departmentId ? departmentsById.get(employee.departmentId) : undefined;
      const client = employee.clientId
        ? clientsById.get(employee.clientId)
        : department?.client_id
          ? clientsById.get(department.client_id)
          : undefined;

      return {
        empId: employee.empId,
        employeeName: employee.name,
        email: employee.email,
        clientName: client?.client_name ?? 'Unassigned',
        departmentName: department?.department_name ?? 'Unassigned',
        isAssigned: Boolean(employee.isAssigned && client && department),
      };
    })
    .sort((first, second) => first.employeeName.localeCompare(second.employeeName));
};

const filterRows = (rows: AssignmentRow[], query: string, statusFilter: AssignmentStatusFilter) => {
  const searchParts = query
    .split('+')
    .map((part) => normalizeSearch(part))
    .filter(Boolean);

  return rows.filter((row) => {
    if (statusFilter === 'assigned' && !row.isAssigned) return false;
    if (statusFilter === 'unassigned' && row.isAssigned) return false;
    if (searchParts.length === 0) return true;

    const searchableValues = [row.employeeName, row.clientName, row.departmentName]
      .map((value) => normalizeSearch(value));

    return searchParts.every((part) => searchableValues.some((value) => value.includes(part)));
  });
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) => (
  <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  </div>
);

export const ReviewerAssignments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const employeesQuery = useActiveEmployees();
  const clientsQuery = useClients();
  const clients = clientsQuery.data ?? [];

  const departmentQueries = useQueries({
    queries: clients.map((client) => ({
      queryKey: departmentQueryKeys.byClient(client.client_id),
      queryFn: () => departmentService.getDepartmentsByClient(client.client_id),
      enabled: clientsQuery.isSuccess,
    })),
  });

  const departments = useMemo(() => {
    return departmentQueries.flatMap((query) => query.data ?? []);
  }, [departmentQueries]);

  const assignmentRows = useMemo(() => {
    return buildAssignmentRows(employeesQuery.data ?? [], clients, departments);
  }, [clients, departments, employeesQuery.data]);

  const filteredRows = useMemo(() => {
    return filterRows(assignmentRows, searchTerm, statusFilter);
  }, [assignmentRows, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const assignedCount = assignmentRows.filter((row) => row.isAssigned).length;
  const clientCount = new Set(assignmentRows.filter((row) => row.isAssigned).map((row) => row.clientName)).size;
  const departmentCount = new Set(assignmentRows.filter((row) => row.isAssigned).map((row) => row.departmentName)).size;
  const isLoading = employeesQuery.isLoading || clientsQuery.isLoading || departmentQueries.some((query) => query.isLoading);
  const error = employeesQuery.error?.message || clientsQuery.error?.message || departmentQueries.find((query) => query.error)?.error?.message;

  const columns: TableColumn<AssignmentRow>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (row) => (
        <div className="pt-6 lg:pt-0">
          <p className="font-semibold text-[var(--text-primary)]">{row.employeeName}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Assigned Client',
      accessor: (row) => row.clientName,
    },
    {
      key: 'department',
      header: 'Assigned Department',
      accessor: (row) => row.departmentName,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isAssigned ? 'success' : 'warning'}>
          {row.isAssigned ? 'Assigned' : 'Unassigned'}
        </Badge>
      ),
    },
  ];

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== 'all');
  const resultSummary = hasActiveFilters
    ? `${filteredRows.length} matching employees${searchTerm.trim() ? ` for "${searchTerm.trim()}"` : ''}`
    : `${assignmentRows.length} active employees`;

  return (
    <section className="space-y-6 p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(420px,0.95fr)] lg:items-start">
        <div className="lg:pt-7">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Employee Assignments</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Active employees with their assigned client and department.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Input
            label="Search assignments"
            placeholder="Search employee, client, department, or use client+department"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<Search className="h-4 w-4" />}
            helperText="Use + to combine filters, for example: apex+production."
            fullWidth
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </span>
            {statusFilterOptions.map((option) => {
              const isSelected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border-color)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} label="Active Employees" value={assignmentRows.length} />
        <StatCard icon={UserCheck} label="Assigned" value={assignedCount} />
        <StatCard icon={Building2} label="Clients" value={clientCount} />
        <StatCard icon={BriefcaseBusiness} label="Departments" value={departmentCount} />
      </div>

      <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Assignment Directory</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{resultSummary}</p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-sm font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <Table
        data={paginatedRows}
        columns={columns}
        isLoading={isLoading}
        error={error}
        rowKey="empId"
        emptyMessage={hasActiveFilters ? 'No active employees match these filters.' : 'No active employees found.'}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </section>
  );
};
