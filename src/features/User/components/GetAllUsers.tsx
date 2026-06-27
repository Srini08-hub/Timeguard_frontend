import {  useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { GetUser } from './GetUser';
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUsers';
import type { UserInfo, UserRole } from '../types';

interface GetAllUsersProps {
  onBack?: () => void;
  onCreate?: () => void;
}

export const GetAllUsers = ({ onCreate }: GetAllUsersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
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
    isRefetching,
    refetch,
  } = useUsers();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) =>
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch),
    );
  }, [users, searchTerm]);

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
          toast.success(`User was updated.`, 'User updated');
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
      message: `${user.name} will be permanently removed from the system.`,
      confirmText: 'Delete',
      cancelText: 'Keep user',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteUser(user.user_id, {
      onSuccess: () => {
        toast.success(`${user.name} was deleted.`, 'User deleted');
        setDeletingUserId(null);
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
        setDeletingUserId(null);
      },
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            All Users ({filteredUsers.length})
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search users"
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
            Loading users...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-950/30 dark:bg-red-950/10">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">
            Failed to load users
          </h3>
          <p className="mt-1 text-xs text-red-650 dark:text-red-500">
            {error.message}
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
          <UserRound className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            No users found
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create a user or adjust your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <GetUser
              key={user.user_id}
              user={user}
              onUpdate={openUpdateModal}
              onDelete={handleDelete}
              // isDeleting={isDeleting}
              isDeleting={deletingUserId === user.user_id}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(userToUpdate)}
        onClose={() => setUserToUpdate(null)}
        title="Update User"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="update-user-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Full name
            </label>
            <Input
              id="update-user-name"
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
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-user-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Email
            </label>
            <Input
              id="update-user-email"
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
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-user-role"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Role
            </label>
            <Select
              id="update-user-role"
              value={updatedRole}
              onChange={(event) => setUpdatedRole(event.target.value as UserRole)}
              options={[
                { value: 'OpsAdmin', label: 'OpsAdmin' },
                { value: 'reviewer', label: 'Reviewer' },
              ]}
              disabled={isUpdating}
              fullWidth
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
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
