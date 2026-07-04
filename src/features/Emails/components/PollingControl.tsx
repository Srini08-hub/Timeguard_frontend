import { useEffect, useState } from 'react';
import { RefreshCw, RadioTower } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import pollingService, { type PollingStatusResponse } from '../services/pollingService';

const DEFAULT_POLL_INTERVAL_SECONDS = 30;

export const PollingControl = () => {
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(String(DEFAULT_POLL_INTERVAL_SECONDS));
  const [pollingStatus, setPollingStatus] = useState<PollingStatusResponse>({
    running: false,
    interval_seconds: null,
  });
  const [pollingMessage, setPollingMessage] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [pollingAction, setPollingAction] = useState<'start' | 'stop' | 'refresh' | null>(null);

  const loadPollingStatus = async () => {
    setPollingAction((current) => current ?? 'refresh');
    try {
      const status = await pollingService.getPollingStatus();
      setPollingStatus(status);
      if (status.interval_seconds !== null) {
        setPollIntervalSeconds(String(status.interval_seconds));
      }
      setPollingError(null);
    } catch (error) {
      setPollingError(error instanceof Error ? error.message : 'Failed to load polling status');
    } finally {
      setPollingAction((current) => (current === 'refresh' ? null : current));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialStatus = async () => {
      try {
        const status = await pollingService.getPollingStatus();
        if (!isMounted) return;

        setPollingStatus(status);
        if (status.interval_seconds !== null) {
          setPollIntervalSeconds(String(status.interval_seconds));
        }
      } catch (error) {
        if (!isMounted) return;
        setPollingError(error instanceof Error ? error.message : 'Failed to load polling status');
      }
    };

    void loadInitialStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePollingStatus = (status: PollingStatusResponse, message: string) => {
    setPollingStatus(status);
    setPollingMessage(message);
    setPollingError(null);
  };

  const handleStartPolling = async () => {
    const intervalSeconds = Number.parseInt(pollIntervalSeconds.trim(), 10);

    if (!Number.isInteger(intervalSeconds) || intervalSeconds < 1) {
      setPollingError('Enter a polling interval of at least 1 second.');
      setPollingMessage(null);
      return;
    }

    setPollingAction('start');
    setPollingError(null);

    try {
      const status = await pollingService.startPolling(intervalSeconds);
      updatePollingStatus(status, `Polling started every ${intervalSeconds} seconds.`);
    } catch (error) {
      setPollingError(error instanceof Error ? error.message : 'Failed to start polling');
      setPollingMessage(null);
    } finally {
      setPollingAction(null);
    }
  };

  const handleStopPolling = async () => {
    setPollingAction('stop');
    setPollingError(null);

    try {
      const status = await pollingService.stopPolling();
      updatePollingStatus(status, 'Polling stopped.');
    } catch (error) {
      setPollingError(error instanceof Error ? error.message : 'Failed to stop polling');
      setPollingMessage(null);
    } finally {
      setPollingAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <RadioTower className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Polling
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Start, stop, and monitor Gmail polling for inbound timesheet processing.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            icon={<RefreshCw className={'h-4 w-4 ' + (pollingAction === 'refresh' ? 'animate-spin' : '')} />}
            disabled={pollingAction !== null}
            onClick={loadPollingStatus}
          >
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {pollingStatus.running ? 'Active' : 'Stopped'}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Interval</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {pollingStatus.interval_seconds ?? pollIntervalSeconds}s
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Control</p>
            <div className="mt-3">
              <Badge variant={pollingStatus.running ? 'success' : 'neutral'}>
                {pollingStatus.running ? 'Polling active' : 'Polling stopped'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border-color)] bg-white px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Input
              type="number"
              min={1}
              step={1}
              label="Polling interval (seconds)"
              value={pollIntervalSeconds}
              onChange={(event) => setPollIntervalSeconds(event.target.value)}
              className="lg:max-w-sm"
              fullWidth
            />

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                type="button"
                onClick={handleStartPolling}
                isLoading={pollingAction === 'start'}
                disabled={pollingAction !== null}
              >
                Start Polling
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleStopPolling}
                isLoading={pollingAction === 'stop'}
                disabled={!pollingStatus.running || pollingAction !== null}
              >
                Stop Polling
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            {pollingMessage && <span>{pollingMessage}</span>}
            {pollingError && <span className="text-red-600">{pollingError}</span>}
            {!pollingMessage && !pollingError && <span>Polling controls are ready.</span>}
          </div>
        </div>
      </section>
    </div>
  );
};
