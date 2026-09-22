import React from 'react';
import { DossierData, SystemReport } from '../../../types';
import { Icons } from '../../../constants';

/**
 * Enterprise "system report" renderer.
 *
 * Layout: customer header, vitals panel,
 * symptom list, prioritized treatment recommendations, per-system detail,
 * and a health history trail — so a technician can read the whole picture
 * in seconds and start work immediately.
 */

const severityStyles: Record<string, string> = {
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

const priorityStyles: Record<string, string> = {
  P0: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  P1: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  P2: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
};

const statusColor: Record<string, string> = {
  HEALTHY: 'text-emerald-400',
  WARNING: 'text-amber-400',
  CRITICAL: 'text-rose-400',
};

const fmt = (v: number | null | undefined, suffix = ''): string =>
  v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : `${Number(v)}${suffix}`;

const dateFmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const Gauge: React.FC<{ value: number | null }> = ({ value }) => {
  const score = value ?? 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#fb7185';

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>{fmt(score)}</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Health</span>
      </div>
    </div>
  );
};

const Vital: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({ label, value, sub, accent = 'text-white' }) => (
  <div className="glass p-4 rounded-xl border border-white/5">
    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5">{label}</span>
    <span className={`text-xl font-bold ${accent}`}>{value}</span>
    {sub && <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-white tracking-tight leading-tight">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

export const DossierChart: React.FC<{ report: SystemReport }> = ({ report }) => {
  const d: DossierData = report.data;
  const v = d.vitals;
  const patient = d.patient;

  const hardware = d.systems?.hardware ?? {};
  const cpu = hardware.cpu ?? {};
  const gpu = hardware.gpu ?? {};
  const ram = hardware.ram ?? {};
  const os = hardware.os ?? {};
  const drives = d.systems?.storage ?? {};
  const security = d.systems?.security ?? {};
  const network = d.systems?.network ?? {};
  const processes = d.systems?.processes ?? {};
  const perf = d.systems?.performance ?? {};

  return (
    <div className="space-y-6">
      {/* ── Report header: customer + capture info ───────────────────── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-rose-400 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              PC System Report
              <span className="text-slate-600 normal-case tracking-normal font-medium">· v{d.schemaVersion}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight truncate">{patient.name}</h2>
            <p className="text-sm text-slate-400 truncate">{patient.email}</p>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="font-mono">{patient.systemSummary || 'System details unavailable'}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Captured</div>
            <div className="text-sm font-medium text-white mt-0.5">{dateFmt(report.createdAt)}</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-2">Delivered To</div>
            <div className="text-sm font-medium text-indigo-300 mt-0.5">
              {report.technicians && report.technicians.length > 0
                ? report.technicians.map(t => t.name).join(', ')
                : (report.technician?.name ?? 'Unassigned')}
            </div>
          </div>
        </div>

        {/* ── Vitals panel ─────────────────────────────────────────── */}
        <div className="p-6 flex flex-wrap items-center gap-8">
          <Gauge value={report.healthScore} />
          <div className="flex-1 min-w-[280px] space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold tracking-tight ${statusColor[v.status] ?? 'text-white'}`}>
                {v.status ?? 'UNKNOWN'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
                {report.reportType}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">CPU Load</span>
                <span className="text-lg font-bold text-white">{fmt(v.cpuPercent, '%')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Memory</span>
                <span className="text-lg font-bold text-white">{fmt(v.ramPercent, '%')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Temp</span>
                <span className="text-lg font-bold text-white">{fmt(v.temperature, '°C')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Free Disk</span>
                <span className="text-lg font-bold text-white">{fmt(v.diskFreePct, '%')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Uptime</span>
                <span className="text-lg font-bold text-white">{v.uptime ?? '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Perf Score</span>
                <span className="text-lg font-bold text-white">{fmt(v.performanceScore)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommendations (what the doctor prescribes first) ──────── */}
      {d.recommendations.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <SectionTitle icon={Icons.shield} title="Treatment Recommendations" subtitle="Prioritized remediation plan derived from this capture" />
          <div className="space-y-3">
            {d.recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-wrap items-start gap-4">
                <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-widest border shrink-0 ${priorityStyles[rec.priority] ?? priorityStyles.P2}`}>
                  {rec.priority}
                </span>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{rec.title}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">{rec.system}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{rec.details}</p>
                  {rec.action && (
                    <p className="text-xs text-indigo-300 mt-1.5">→ {rec.action}</p>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold shrink-0">{rec.framing}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Symptoms (observations) ─────────────────────────────────── */}
      {d.symptoms.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <SectionTitle icon={Icons.activity} title="Observed Symptoms" subtitle="Anomalies detected across all monitored systems" />
          <div className="space-y-2.5">
            {d.symptoms.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border shrink-0 mt-0.5 ${severityStyles[s.severity] ?? severityStyles.info}`}>
                  {s.severity}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.message}</p>
                  {s.recommendedAction && <p className="text-xs text-indigo-300 mt-1">→ {s.recommendedAction}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vital signs grid ────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-white/10 p-6">
        <SectionTitle icon={Icons.activity} title="Vital Signs" subtitle="Current readings across core subsystems" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Vital label="CPU Load" value={fmt(v.cpuPercent, '%')} accent={v.cpuPercent !== null && v.cpuPercent >= 85 ? 'text-rose-400' : 'text-white'} />
          <Vital label="Memory" value={fmt(v.ramPercent, '%')} accent={v.ramPercent !== null && v.ramPercent >= 85 ? 'text-rose-400' : 'text-white'} />
          <Vital label="Temperature" value={fmt(v.temperature, '°C')} accent={v.temperature !== null && v.temperature >= 80 ? 'text-rose-400' : 'text-white'} />
          <Vital label="Free Disk" value={fmt(v.diskFreePct, '%')} accent={v.diskFreePct !== null && v.diskFreePct < 10 ? 'text-rose-400' : 'text-white'} />
          <Vital label="Uptime" value={v.uptime ?? '—'} />
          <Vital label="Perf Score" value={fmt(v.performanceScore)} />
          <Vital label="Battery" value={v.batteryLevel !== null ? fmt(v.batteryLevel, '%') : '—'} sub={v.isCharging === null ? undefined : v.isCharging ? 'Charging' : 'On battery'} />
          <Vital label="Processes" value={fmt(processes.totalProcesses)} sub="running" />
        </div>
      </div>

      {/* ── Hardware profile ────────────────────────────────────────── */}
      {(cpu.name || gpu.name || ram.totalGB) && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <SectionTitle icon={Icons.cpu} title="Hardware Profile" subtitle="Known-good configuration recorded at capture time" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Vital label="Processor" value={cpu.name ?? '—'} sub={cpu.cores ? `${cpu.cores} cores / ${cpu.threads} threads · ${cpu.maxClockMHz} MHz` : undefined} />
            <Vital label="Graphics" value={gpu.name ?? '—'} sub={gpu.driverVersion ? `Driver ${gpu.driverVersion}` : undefined} />
            <Vital label="Memory" value={ram.totalGB ? `${ram.totalGB} GB` : '—'} sub={ram.sticks?.length ? `${ram.sticks.length} module(s)` : undefined} />
            <Vital label="OS" value={os.name ?? '—'} sub={os.architecture ? `${os.architecture} · build ${os.build}` : undefined} />
          </div>
        </div>
      )}

      {/* ── Storage & network & security ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drives.drives && drives.drives.length > 0 && (
          <div className="glass rounded-2xl border border-white/10 p-6">
            <SectionTitle icon={Icons.database} title="Storage" subtitle="Physical volumes at capture" />
            <div className="space-y-3">
              {drives.drives.slice(0, 4).map((dv: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{dv.volumeName} <span className="text-slate-600 font-mono">({dv.deviceId})</span></span>
                    <span className="text-slate-500">{fmt(dv.usedPercent, '%')} used · {fmt(dv.freeGB, ' GB free')}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${Number(dv.usedPercent) >= 90 ? 'bg-rose-500' : Number(dv.usedPercent) >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Number(dv.usedPercent ?? 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {network.activeAdapter && (
            <div className="glass rounded-2xl border border-white/10 p-6">
              <SectionTitle icon={Icons.globe} title="Network" subtitle="Active adapter status" />
              <div className="grid grid-cols-2 gap-3">
                <Vital label="Adapter" value={network.activeAdapter.name ?? '—'} sub={network.activeAdapter.status} />
                <Vital label="IPv4" value={network.activeAdapter.ipv4 || '—'} sub={network.gateway ? `GW ${network.gateway}` : undefined} />
                <Vital label="Latency" value={network.latency && network.latency > 0 ? `${network.latency} ms` : '—'} accent={network.latency && network.latency > 120 ? 'text-rose-400' : 'text-white'} />
                <Vital label="Internet" value={network.internetReachable ? 'Reachable' : 'Offline'} accent={network.internetReachable ? 'text-emerald-400' : 'text-rose-400'} />
              </div>
            </div>
          )}

          {security.score !== undefined && (
            <div className="glass rounded-2xl border border-white/10 p-6">
              <SectionTitle icon={Icons.shield} title="Security Posture" subtitle="Protection state" />
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Security score</span>
                    <span className="font-bold text-white">{fmt(security.score)}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${Number(security.score) >= 80 ? 'bg-emerald-500' : Number(security.score) >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Number(security.score ?? 0))}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${security.defenderEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                    Defender {security.defenderEnabled ? 'ON' : 'OFF'}
                  </span>
                  {security.firewallProfiles?.map((p: any, i: number) => (
                    <span key={i} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${String(p.state).toUpperCase() === 'ON' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                      FW {p.profile}: {p.state}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Health history trail ────────────────────────────────────── */}
      {d.history && d.history.length > 1 && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <SectionTitle icon={Icons.clock} title="Health History" subtitle="Trailing health scores across previous captures" />
          <div className="flex items-end gap-2 h-24">
            {d.history.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{h.healthScore}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(8, h.healthScore)}%`,
                    background: h.healthScore >= 80 ? 'linear-gradient(to top, rgba(52,211,153,0.3), #34d399)' : h.healthScore >= 60 ? 'linear-gradient(to top, rgba(251,191,36,0.3), #fbbf24)' : 'linear-gradient(to top, rgba(251,113,133,0.3), #fb7185)',
                  }}
                />
                <span className="text-[8px] text-slate-600 truncate w-full text-center">{new Date(h.capturedAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
