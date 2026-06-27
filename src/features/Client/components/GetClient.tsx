import { Edit3, Mail, Trash2, Building2 } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { ClientResponse } from '../types';

interface GetClientProps {
  client: ClientResponse;
  onUpdate: (client: ClientResponse) => void;
  onDelete: (client: ClientResponse) => void;
  onClientClick?: (client: ClientResponse) => void;
  isDeleting?: boolean;
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const GetClient = ({
  client,
  onUpdate,
  onDelete,
  onClientClick,
  isDeleting = false,
}: GetClientProps) => {
  const initials = client.client_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article
      className="group rounded-xl border border-gray-100 bg-white p-4 shadow-2xs transition-all hover:border-blue-200 hover:shadow-sm cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60"
      onClick={() => onClientClick?.(client)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
            {initials || <Building2 className="h-5 w-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-950 dark:text-white">
                {client.client_name}
              </h3>
              <Badge variant={client.is_active ? 'success' : 'neutral'}>
                {client.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-450">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {client.sender_email}
              </span>
              <span>{client.sender_domain}</span>
            </div>
            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Created {formatDate(client.created_at)}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:self-center" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => onUpdate(client)}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            isLoading={isDeleting}
            onClick={() => onDelete(client)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
};
