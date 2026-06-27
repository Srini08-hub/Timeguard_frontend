import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit3,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
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
  const toast = useToast();
  const { data: employee, error, isLoading } = useEmployee(empId);

  const copyEmployeeId = async () => {
    if (!employee) return;

    try {
      await navigator.clipboard.writeText(employee.empId);
      toast.success('Employee ID copied.', 'Copied');
    } catch {
      toast.error('Unable to copy employee ID.', 'Copy failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/70 p-8 text-center dark:border-red-950/40 dark:bg-red-950/15">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
          Employee profile unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error?.message || 'The selected employee could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('..')}>
          Back to Employees
        </Button>
      </div>
    );
  }

  const initials = getInitials(employee.name);

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
          <Button
            type="button"
            variant="outline"
            icon={<Copy className="h-4 w-4" />}
            onClick={copyEmployeeId}
          >
            Copy ID
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

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-semibold text-white shadow-sm shadow-blue-600/25">
                {initials || <UserRound className="h-7 w-7" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                    {employee.name}
                  </h1>
                  <Badge variant={employee.isActive ? 'success' : 'neutral'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Employee ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-950 dark:text-white">
                {employee.empId}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Record status
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {employee.isAssigned ?'Already assigned' : 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {formatDate(employee.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Governance
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  Employee master record
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">
            Employee details
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{employee.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Employee ID</dt>
              <dd className="mt-1 font-mono text-sm font-medium text-gray-950 dark:text-white">{employee.empId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">
                {employee.isActive ? 'Active' : 'Inactive'}
              </dd>
            </div>
          </dl>
        </div>

        {/* <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">
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
