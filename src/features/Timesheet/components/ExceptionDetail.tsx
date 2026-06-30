import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Edit3 } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Textarea } from '../../../components/ui/Textarea';
import { useToast } from '../../../hooks/useToast';
import { useResolveTimecard, useTimecard } from '../hooks/useTimecards';

const formatLabel = (value: string) => {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatHours = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
};

export const ExceptionDetail = () => {
  const { timecardId = '' } = useParams<{ timecardId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: timecard, error, isLoading } = useTimecard(timecardId);
  const { mutate: resolveTimecard, isPending } = useResolveTimecard();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [regHours, setRegHours] = useState('');
  const [otHours, setOtHours] = useState('');
  const [dtHours, setDtHours] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!timecard) return;
    setEmployeeName(timecard.employee_name || '');
    setRegHours(formatHours(timecard.reg_hours));
    setOtHours(formatHours(timecard.ot_hours));
    setDtHours(formatHours(timecard.dt_hours));
    setReviewComment(timecard.review_comment || '');
  }, [timecard]);

  const backToTimesheet = () => {
    if (timecard?.timesheet_id) {
      navigate('/reviewer/timesheets/' + timecard.timesheet_id);
      return;
    }
    navigate('/reviewer/timesheets');
  };

  const parseHours = (value: string) => {
    const numericValue = Number(value.trim());
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!timecard) return;

    const parsedReg = parseHours(regHours);
    const parsedOt = parseHours(otHours);
    const parsedDt = parseHours(dtHours);
    if (parsedReg === null || parsedOt === null || parsedDt === null) {
      setFormError('Regular, OT, and DT hours must be non-negative numbers.');
      return;
    }
    if (!reviewComment.trim()) {
      setFormError('Add a reviewer comment before resolving this exception.');
      return;
    }

    resolveTimecard(
      {
        timecardId: timecard.timecard_id,
        payload: {
          employee_name: employeeName.trim() || null,
          reg_hours: parsedReg,
          ot_hours: parsedOt,
          dt_hours: parsedDt,
          review_comment: reviewComment.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Exception resolved and timecard updated.', 'Resolved');
          setIsEditorOpen(false);
        },
        onError: (requestError) => toast.error(requestError.message, 'Resolve failed'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading exception details...</p>
        </div>
      </div>
    );
  }

  if (error || !timecard) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">Exception unavailable</h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {error?.message || 'The selected exception could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={backToTimesheet}>
          Back to Timesheet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={backToTimesheet}
        >
          Timecard
        </Button>
        <Button
          type="button"
          variant="primary"
          icon={<Edit3 className="h-4 w-4" />}
          onClick={() => setIsEditorOpen(true)}
        >
          Edit Timecard
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-red-200 bg-[var(--danger-bg)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-700/15">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {timecard.employee_name || 'Unknown employee'}
                  </h1>
                  <Badge variant={timecard.status === 'clean' ? 'success' : 'danger'}>
                    {formatLabel(timecard.status)}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-sm text-[var(--text-muted)]">
                  {timecard.timecard_id}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Severity
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {formatLabel(timecard.severity)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Regular</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.reg_hours)}</p>
          </div>
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">OT</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.ot_hours)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">DT</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.dt_hours)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] px-5 py-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Exception details</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Resolve all exception entries by correcting the timecard and adding a reviewer comment.
          </p>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {timecard.exceptions.map((exception) => (
            <div key={exception.exception_id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={exception.resolved ? 'success' : 'danger'}>
                      {exception.resolved ? 'Resolved' : formatLabel(exception.exception_type)}
                    </Badge>
                    <Badge variant="neutral">{formatLabel(exception.severity)}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{exception.reason}</p>
                </div>
                {exception.resolved && <CheckCircle2 className="h-5 w-5 text-[var(--success-text)]" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Edit Timecard"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Employee name"
            value={employeeName}
            onChange={(event) => setEmployeeName(event.target.value)}
            disabled={isPending}
            fullWidth
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Regular hours" type="number" min="0" step="0.01" value={regHours} onChange={(event) => setRegHours(event.target.value)} disabled={isPending} fullWidth />
            <Input label="OT hours" type="number" min="0" step="0.01" value={otHours} onChange={(event) => setOtHours(event.target.value)} disabled={isPending} fullWidth />
            <Input label="DT hours" type="number" min="0" step="0.01" value={dtHours} onChange={(event) => setDtHours(event.target.value)} disabled={isPending} fullWidth />
          </div>
          <Textarea
            label="Reviewer comment"
            value={reviewComment}
            onChange={(event) => {
              setReviewComment(event.target.value);
              if (formError) setFormError('');
            }}
            error={formError}
            disabled={isPending}
            rows={4}
            fullWidth
          />
          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
            <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending} icon={<CheckCircle2 className="h-4 w-4" />}>
              Submit Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
