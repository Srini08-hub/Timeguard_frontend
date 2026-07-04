import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import departmentService from '../../Department/services/departmentService';
import { useEmployee } from '../hooks/useEmployees';

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

export const GetEmployee = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate = useNavigate();
  const { data: employee, error, isLoading } = useEmployee(empId);

  // const copyEmployeeId = async () => {
  //   if (!employee) return;

  //   try {
  //     await navigator.clipboard.writeText(employee.empId);
  //     toast.success('Employee ID copied.', 'Copied');
  //   } catch {
  //     toast.error('Unable to copy employee ID.', 'Copy failed');
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Employee profile unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {error?.message || 'The selected employee could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('..')}>
          Back to Employees
        </Button>
      </div>
    );
  }

  const initials = getInitials(employee.name);

  const handleAssignEmployee = async () => {
    if (employee.isAssigned) {
      if (!employee.clientId) return;

      const departments = await departmentService.getDepartmentsByClient(employee.clientId);
      const assignedDepartment = departments.find((department) => department.department_id === employee.departmentId) ?? departments[0];
      console.log("hello")
      if (!assignedDepartment) return;
      navigate('/ops-admin/clients/' + employee.clientId + '/departments/' + assignedDepartment.department_id);
      return;
    }
    // console.log("hello2")
    navigate('assign');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('..')}
        >
          Employees
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* <Button
            type="button"
            variant="outline"
            icon={<Copy className="h-4 w-4" />}
            onClick={copyEmployeeId}
          >
            Copy ID
          </Button> */}
          <Button
            type="button"
            variant="outline"
            icon={<UserPlus className="h-4 w-4" />}
            disabled={!employee.isActive || employee.isAssigned}
            title={
              !employee.isActive
                ? 'Inactive employee cannot be assigned'
                : employee.isAssigned
                  ? 'Open assigned department'
                  : 'Assign employee'
            }
            onClick={handleAssignEmployee}
          >
            {/* {employee.isAssigned ? 'View Assignment' : 'Assign Employee'} */}
            Assign Employee
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => navigate('..')}
          >
            Manage Record
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-semibold text-white shadow-sm shadow-blue-700/15">
                {initials || <UserRound className="h-7 w-7" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {employee.name}
                  </h1>
                  <Badge variant={employee.isActive ? 'success' : 'neutral'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Employee ID
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
                {employee.empId}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Record status
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {employee.isAssigned ? 'Already assigned' : 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(employee.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Governance
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  Employee master record
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-[var(--border-color)] bg-white p-6 shadow-sm shadow-gray-950/5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Employee details
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Name</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{employee.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Email</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Employee ID</dt>
              <dd className="mt-1 font-mono text-sm font-medium text-[var(--text-primary)]">{employee.empId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {employee.isActive ? 'Active' : 'Inactive'}
              </dd>
            </div>
          </dl>
        </div>

        {/* <div className="rounded-lg border border-[var(--border-color)] bg-white p-6 shadow-sm shadow-gray-950/5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Next actions
          </h2>
          <div className="mt-5 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              icon={<Mail className="h-4 w-4" />}
              onClick={() => {
                window.location.href = 'mailto:' + employee.email;
              }}
            >
              Send email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={() => navigate('..')}
            >
              Manage assignment record
            </Button>
          </div>
        </div> */}
      </section>
    </div>
  );
};
