import { useState } from 'react';
import { Plus, Users } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { ClientDetails } from './ClientDetails';
import { CreateClient } from './CreateClient';
import { GetAllClients } from './GetAllClients';
import type { ClientResponse } from '../types';

type ClientView = 'options' | 'list' | 'create' | 'details';

export const Clients = () => {
  const [view, setView] = useState<ClientView>('options');
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);

  const showList = () => setView('list');
  const showCreate = () => setView('create');
  const showClientDetails = (client: ClientResponse) => {
    setSelectedClient(client);
    setView('details');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Clients
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Manage client records for email assignments and tracking.
          </p>
        </div>

        {view !== 'options' && (
          <Button type="button" variant="outline" onClick={() => setView('options')}>
            Client Options
          </Button>
        )}
      </div>

      {view === 'options' && (
        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={showList}
            className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/35 dark:text-blue-300">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-gray-950 dark:text-white">
              Get all clients
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              View all active clients, search the list, and manage client records.
            </p>
          </button>

          <button
            type="button"
            onClick={showCreate}
            className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-900/60 dark:hover:bg-emerald-950/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Plus className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-gray-950 dark:text-white">
              Create client
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Add a new client to the system for email assignments.
            </p>
          </button>
        </section>
      )}

      {view === 'create' && (
        <CreateClient
          onBack={() => setView('options')}
          onCreated={() => setView('list')}
        />
      )}

      {view === 'list' && (
        <GetAllClients
          onCreate={() => setView('create')}
          onClientClick={showClientDetails}
        />
      )}

      {view === 'details' && selectedClient && (
        <ClientDetails
          client={selectedClient}
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};
