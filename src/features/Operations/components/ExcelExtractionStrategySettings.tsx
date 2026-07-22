import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import operationSettingsService, {
  type ExcelExtractionStrategy,
  type ExcelExtractionStrategyResponse,
} from '../services/operationSettingsService';

const STRATEGY_OPTIONS: { value: ExcelExtractionStrategy; label: string }[] = [
  { value: 'entire_sheet', label: 'Entire sheet' },
  { value: 'semantic_split', label: 'Semantic split' },
];

const formatStrategy = (strategy: ExcelExtractionStrategy) => {
  return strategy === 'semantic_split' ? 'Semantic split' : 'Entire sheet';
};

export const ExcelExtractionStrategySettings = () => {
  const [settings, setSettings] = useState<ExcelExtractionStrategyResponse | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ExcelExtractionStrategy>('entire_sheet');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await operationSettingsService.getExcelExtractionStrategy();
        if (!isMounted) return;
        setSettings(response);
        setSelectedStrategy(response.excel_extraction_strategy);
        setError(null);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError instanceof Error ? requestError.message : 'Failed to load extraction strategy');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await operationSettingsService.updateExcelExtractionStrategy(selectedStrategy);
      setSettings(response);
      setSelectedStrategy(response.excel_extraction_strategy);
      setMessage('Excel extraction strategy updated. New polling jobs will use this setting.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update extraction strategy');
    } finally {
      setIsSaving(false);
    }
  };

  const isUnchanged = settings?.excel_extraction_strategy === selectedStrategy;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Excel Extraction Strategy
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose how Excel sheets are chunked before LLM extraction.
              </p>
            </div>
          </div>

          {settings && (
            <Badge variant={settings.excel_extraction_strategy === 'semantic_split' ? 'warning' : 'info'}>
              {formatStrategy(settings.excel_extraction_strategy)}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 border-b border-[var(--border-color)] bg-white p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Select
            label="Strategy"
            value={selectedStrategy}
            onChange={(event) => {
              setSelectedStrategy(event.target.value as ExcelExtractionStrategy);
              setMessage(null);
              setError(null);
            }}
            options={STRATEGY_OPTIONS}
            disabled={isLoading || isSaving}
            helperText="Semantic split uses an 8-row LLM split window and does not fallback to entire-sheet extraction."
            fullWidth
          />

          <Button
            type="button"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isLoading || isSaving || isUnchanged}
          >
            Save Strategy
          </Button>
        </div>

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Current strategy</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {settings ? formatStrategy(settings.excel_extraction_strategy) : 'Loading...'}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Semantic window</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {settings?.semantic_window_rows ?? 8} rows
            </p>
          </div>
        </div>

        <div className="bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            {message && <span>{message}</span>}
            {error && <span className="text-red-600">{error}</span>}
            {!message && !error && <span>Entire sheet remains the safe default.</span>}
          </div>
        </div>
      </section>
    </div>
  );
};