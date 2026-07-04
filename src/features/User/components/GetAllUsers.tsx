import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Edit3,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUsers';
import type { UserInfo, UserRole } from '../types';

interface GetAllUsersProps {
  onBack?: () => void;
  onCreate?: () => void;
}

const USERS_PER_PAGE = 10;
type UserRoleFilter = 'all' | UserRole;

const roleFilterOptions: { value: UserRoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'OpsAdmin', label: 'OpsAdmin' },
  { value: 'reviewer', label: 'Reviewer' },
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getRoleBadgeVariant = (role: string) => {
  if (role === 'OpsAdmin') return 'info';
  if (role === 'reviewer') return 'success';
  return 'neutral';
};

export const GetAllUsers = ({ onCreate }: GetAllUsersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRoleFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToUpdate, setUserToUpdate] = useState<UserInfo | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedRole, setUpdatedRole] = useState<UserRole>('reviewer');
  const [updateError, setUpdateError] = useState('');

  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: users = [],
    error,
    isLoading,
  } = useUsers();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      if (user.role !== 'OpsAdmin' && user.role !== 'reviewer') return false;
      if (selectedRoleFilter !== 'all' && user.role !== selectedRoleFilter) return false;
      if (!normalizedSearch) return true;
      return [user.name, user.email, user.role, user.user_id]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [users, searchTerm, selectedRoleFilter]);

  const opsAdminCount = users.filter((user) => user.role === 'OpsAdmin').length;
  const reviewerCount = users.filter((user) => user.role === 'reviewer').length;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * USERS_PER_PAGE,
    safeCurrentPage * USERS_PER_PAGE,
  );

  const openUpdateModal = (user: UserInfo) => {
    setUserToUpdate(user);
    setUpdatedName(user.name);
    setUpdatedEmail(user.email);
    setUpdatedRole(user.role);
    setUpdateError('');
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userToUpdate) return;

    const trimmedName = updatedName.trim();
    const trimmedEmail = updatedEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setUpdateError('All fields are required');
      toast.warning('Fill in all required fields.', 'Missing details');
      return;
    }

    updateUser(
      {
        userId: userToUpdate.user_id,
        userData: {
          name: trimmedName,
          email: trimmedEmail,
          role: updatedRole,
        },
      },
      {
        onSuccess: () => {
          setUserToUpdate(null);
          setUpdatedName('');
          setUpdatedEmail('');
          setUpdatedRole('reviewer');
          toast.success('User was updated.', 'User updated');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Update failed');
        },
      },
    );
  };

  const handleDelete = async (user: UserInfo) => {
    const confirmed = await confirm({
      title: 'Delete user?',
      message: user.name + ' will be permanently removed from the system.',
      confirmText: 'Delete',
      cancelText: 'Keep user',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingUserId(user.user_id);
    deleteUser(user.user_id, {
      onSuccess: () => {
        toast.success(user.name + ' was deleted.', 'User deleted');
        setDeletingUserId(null);
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
        setDeletingUserId(null);
      },
    });
  };

  const columns: TableColumn<UserInfo>[] = [
    {
      key: 'user',
      header: 'User',
      accessor: (user) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)] ring-1 ring-blue-100">
            {getInitials(user.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {user.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role}
        </Badge>
      ),
    },
   
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Edit ' + user.name}
            className="h-9 w-9"
            onClick={() => openUpdateModal(user)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Delete ' + user.name}
            className="h-9 w-9 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
            isLoading={deletingUserId === user.user_id}
            onClick={() => handleDelete(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <section className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                User Management
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Manage user accounts, roles, and account access.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={onCreate}
            >
              Create New User
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Total users
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {users.length}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Ops admins
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {opsAdminCount}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Reviewers
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {reviewerCount}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl">
            <div className="w-full sm:flex-1">
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, role, or ID"
                icon={<Search className="h-4 w-4" />}
                fullWidth
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedRoleFilter}
                options={roleFilterOptions}
                onChange={(event) => {
                  setSelectedRoleFilter(event.target.value as UserRoleFilter);
                  setCurrentPage(1);
                }}
                fullWidth
              />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {filteredUsers.length} user records visible
          </p>
        </div>
      </section>

      <Table
        data={paginatedUsers}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No users match the current search."
        rowKey="user_id"
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      <Modal
        isOpen={Boolean(userToUpdate)}
        onClose={() => setUserToUpdate(null)}
        title="Update User"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            id="update-user-name"
            label="Full name"
            value={updatedName}
            onChange={(event) => {
              setUpdatedName(event.target.value);
              if (updateError) setUpdateError('');
            }}
            error={updateError}
            placeholder="Full name"
            disabled={isUpdating}
            fullWidth
          />

          <Input
            id="update-user-email"
            label="Email"
            type="email"
            value={updatedEmail}
            onChange={(event) => {
              setUpdatedEmail(event.target.value);
              if (updateError) setUpdateError('');
            }}
            placeholder="user@example.com"
            disabled={isUpdating}
            fullWidth
          />

          <Select
            id="update-user-role"
            label="Role"
            value={updatedRole}
            onChange={(event) => setUpdatedRole(event.target.value as UserRole)}
            options={[
              { value: 'OpsAdmin', label: 'OpsAdmin' },
              { value: 'reviewer', label: 'Reviewer' },
            ]}
            disabled={isUpdating}
            fullWidth
          />

          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToUpdate(null)}
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
