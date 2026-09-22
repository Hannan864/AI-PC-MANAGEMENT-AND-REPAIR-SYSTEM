import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../../constants';
import { ReportSchedule, ReportTechnician, SystemReport } from '../../../types';
import { systemReportApi } from '../../../services/systemReportApi';
import { DossierChart } from '../common/DossierChart';

const FREQUENCIES = [
  { value: 'off', label: 'Off', hint: 'Manual capture only' },
  { value: 'daily', label: 'Daily', hint: 'Fresh report every day' },
  { value: 'weekly', label: 'Weekly', hint: 'Delivered every week' },
  { value: 'monthly', label: 'Monthly', hint: 'Monthly snapshot' },
] as const;

const dateFmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/** Extract a human-readable reason from any fetch failure so the UI never
 * hides the real cause behind a generic message. */
const reasonOf = (err: any, fallback: string): string => {
  const serverMsg = err?.response?.data?.message;
  if (typeof serverMsg === 'string' && serverMsg.trim()) return serverMsg;
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'The request timed out — the backend may be busy. Please try again.';
  }
  if (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK') {
    return 'Cannot reach the backend server. Make sure the system is running (run.bat).';
  }
  return fallback;
};

/**
 * My System Report — customer view.
 *
 * Lets the user capture their full system report on demand, choose which
 * technician(s) should receive it (one or many), and set an automatic
 * daily / weekly / monthly delivery schedule that keeps going to the same
 * chosen technician(s). Every report is stored locally and delivered only
 * to the people the user picked.
 */
export const SystemDossier: React.FC = () => {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [schedule, setSchedule] = useState<ReportSchedule | null>(null);
  const [technicians, setTechnicians] = useState<ReportTechnician[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [latest, sched, techs] = await Promise.all([
        systemReportApi.latest().catch(() => null),
        systemReportApi.getSchedule(),
        systemReportApi.technicians(),
      ]);
      setReport(latest);
      setSchedule(sched);
      setTechnicians(techs);
      setSelectedIds(sched.technicianIds ?? []);
    } catch (err) {
      console.error('Error loading system report:', err);
      setError('Failed to load your system report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTechnician = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleCapture = async () => {
    try {
      setCapturing(true);
      setError(null);
      setNotice(null);
      const fresh = await systemReportApi.capture();
      setReport(fresh);
      const recipients = fresh.technicians && fresh.technicians.length > 0
        ? fresh.technicians.map(t => t.name).join(', ')
        : (fresh.technician ? fresh.technician.name : null);
      setNotice(
        recipients
          ? `Report captured and delivered to ${recipients}.`
          : 'Report captured and stored. Send it to a technician from the panel above.',
      );
      window.setTimeout(() => setNotice(null), 6000);
    } catch (err) {
      console.error('Capture failed:', err);
      setError(reasonOf(err, 'Capture failed. Make sure the system monitoring snapshot is running.'));
    } finally {
      setCapturing(false);
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one technician to send your report to.');
      return;
    }
    try {
      setSending(true);
      setError(null);
      setNotice(null);
      const fresh = await systemReportApi.send(selectedIds);
      setReport(fresh);
      setSchedule(await systemReportApi.getSchedule().catch(() => schedule));
      const recipients = (fresh.technicians && fresh.technicians.length > 0
        ? fresh.technicians.map(t => t.name).join(', ')
        : 'your technician(s)');
      setNotice(`Report captured and sent to ${recipients}.`);
      window.setTimeout(() => setNotice(null), 6000);
    } catch (err) {
      console.error('Send failed:', err);
      setError(reasonOf(err, 'Send failed. Make sure the system monitoring snapshot is running.'));
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async (frequency: 'off' | 'daily' | 'weekly' | 'monthly') => {
    try {
      setSavingSchedule(true);
      setError(null);
      const updated = await systemReportApi.updateSchedule(frequency);
      setSchedule(updated);
      setNotice(
        frequency === 'off'
          ? 'Automatic delivery turned off. You can still capture and send manually anytime.'
          : `Automatic delivery scheduled: every ${frequency}. Next capture ${dateFmt(updated.nextRunAt)}.`,
      );
      window.setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      console.error('Schedule update failed:', err);
      setError('Failed to update the delivery schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">My System Report</h2>
          <p className="text-slate-400">
            Capture your PC's full system report and send it straight to the technician(s) you choose.
          </p>
        </div>
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20 flex items-center gap-2"
        >
          {capturing ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Capturing…
            </>
          ) : (
            <>
              {Icons.plus} Capture Now
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {notice}
        </div>
      )}

      {/* ── Send to technician(s) ─────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            {Icons.send}
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-tight">Send Report to Technician(s)</h3>
            <p className="text-[11px] text-slate-500">
              Pick one or more technicians — the report is delivered only to the people you select.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <div className="mt-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm text-slate-400">No technicians are available yet. Please try again later.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {technicians.map(tech => {
                const active = selectedIds.includes(tech.id);
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => toggleTechnician(tech.id)}
                    className={`rounded-xl p-4 border text-left transition-all flex items-start gap-3 ${
                      active
                        ? 'bg-rose-600/15 border-rose-400/50 shadow-lg shadow-rose-500/10'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 border ${
                      active ? 'bg-rose-500/30 border-rose-400/40' : 'bg-gradient-to-br from-amber-500/30 to-rose-500/30 border-white/10'
                    }`}>
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-sm truncate ${active ? 'text-rose-200' : 'text-white'}`}>
                          {tech.name}
                        </span>
                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          active ? 'bg-rose-500 border-rose-400 text-white' : 'border-white/20'
                        }`}>
                          {active && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{tech.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        {tech.specialty && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {tech.specialty}
                          </span>
                        )}
                        {tech.rating !== null && tech.rating !== undefined && (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            {Icons.star} {tech.rating.toFixed(1)}
                          </span>
                        )}
                        {tech.jobsCompleted !== null && tech.jobsCompleted !== undefined && (
                          <span className="text-slate-500">{tech.jobsCompleted} job(s) done</span>
                        )}
                        {tech.isAvailable === false && (
                          <span className="text-slate-500">— unavailable</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                {selectedIds.length === 0
                  ? 'No technician selected yet.'
                  : `Sending to ${selectedIds.length} technician${selectedIds.length > 1 ? 's' : ''}: ${technicians
                      .filter(t => selectedIds.includes(t.id))
                      .map(t => t.name)
                      .join(', ')}`}
              </p>
              <button
                onClick={handleSend}
                disabled={sending || selectedIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Capturing & Sending…
                  </>
                ) : (
                  <>
                    {Icons.send} Capture & Send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Automatic delivery schedule ───────────────────────────────── */}
      <div className="glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {Icons.calendar}
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-tight">Automatic Delivery Schedule</h3>
            <p className="text-[11px] text-slate-500">
              Scheduled reports are sent to the technician(s) you selected above.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FREQUENCIES.map(f => {
            const active = schedule?.frequency === f.value;
            return (
              <button
                key={f.value}
                onClick={() => handleSchedule(f.value)}
                disabled={savingSchedule}
                className={`rounded-xl p-4 border text-left transition-all ${
                  active
                    ? 'bg-indigo-600/20 border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                <span className={`block font-semibold text-sm ${active ? 'text-indigo-300' : 'text-white'}`}>
                  {f.label}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{f.hint}</span>
                {active && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-300">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {schedule && schedule.frequency !== 'off' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Frequency</span>
              <span className="text-white font-medium capitalize">{schedule.frequency}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Last run</span>
              <span className="text-white font-medium">{dateFmt(schedule.lastRunAt)}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Next run</span>
              <span className="text-white font-medium">{dateFmt(schedule.nextRunAt)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Latest report ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : report ? (
        <DossierChart report={report} />
      ) : (
        <div className="p-14 text-center glass rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-rose-400">
            {Icons.heart}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Report Captured Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Pick your technician(s) above and press <span className="text-rose-300 font-medium">Capture & Send</span> to
            record your PC's full system report and deliver it to them.
          </p>
        </div>
      )}
    </div>
  );
};
