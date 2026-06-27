import { type FormEvent, useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';

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
        created_by: userId ?? '',
      },
      {
        onSuccess: (client) => {
          setClientName('');
          setSenderEmail('');
          setSenderDomain('');
          setError('');
          toast.success(client.client_name + ' was added successfully.', 'Client created');
          onCreated?.();
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  return (
    <section className="space-y-5">
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
        >
          Back
        </Button>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">
              Add client record
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a sender identity and client workspace for department operations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="client-name"
          name="client_name"
          label="Client name"
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

        <Input
          id="sender-email"
          name="sender_email"
          label="Sender email"
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

        <Input
          id="sender-domain"
          name="sender_domain"
          label="Sender domain"
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
    </section>
  );
};
