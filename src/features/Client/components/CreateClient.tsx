import { type FormEvent, useState } from 'react';
import { ArrowLeft, Building2, Sparkles } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useCreateClient } from '../hooks/useClients';

interface CreateClientProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export const CreateClient = ({ onBack, onCreated }: CreateClientProps) => {
  const [clientName, setClientName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderDomain, setSenderDomain] = useState('');
  const [error, setError] = useState('');
  const { userId } = useAuth();
  const toast = useToast();
  const { mutate: createClient, isPending } = useCreateClient();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = clientName.trim();
    const trimmedEmail = senderEmail.trim();
    const trimmedDomain = senderDomain.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDomain) {
      setError('All fields are required');
      toast.warning('Fill in all required fields before creating.', 'Missing details');
      return;
    }

    createClient(
      {
        client_name: trimmedName,
        sender_email: trimmedEmail,
        sender_domain: trimmedDomain,
        created_by: userId,
      },
      {
        onSuccess: (client) => {
          setClientName('');
          setSenderEmail('');
          setSenderDomain('');
          setError('');
          toast.success(`${client.client_name} was added successfully.`, 'Client created');
          onCreated?.();
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full max-w-3xl animate-in fade-in duration-300">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
          className={onBack ? '' : 'invisible'}
        >
          Back
        </Button>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Client setup
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/35 dark:text-blue-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
                Create Client
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a new client to Timeguard for email assignments.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label
              htmlFor="client-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Client name
            </label>
            <Input
              id="client-name"
              name="client_name"
              value={clientName}
              onChange={(event) => {
                setClientName(event.target.value);
                if (error) setError('');
              }}
              error={error}
              placeholder="e.g. Acme Corporation"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sender-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Sender email
            </label>
            <Input
              id="sender-email"
              name="sender_email"
              value={senderEmail}
              onChange={(event) => {
                setSenderEmail(event.target.value);
                if (error) setError('');
              }}
              error={error}
              placeholder="e.g. notifications@acme.com"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sender-domain"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Sender domain
            </label>
            <Input
              id="sender-domain"
              name="sender_domain"
              value={senderDomain}
              onChange={(event) => {
                setSenderDomain(event.target.value);
                if (error) setError('');
              }}
              error={error}
              placeholder="e.g. acme.com"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              icon={<Building2 className="h-4 w-4" />}
            >
              Create Client
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
