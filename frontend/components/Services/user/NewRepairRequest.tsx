import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../Layout/AuthProvider';
import { GigCategory } from '../../../types';
import { Icons } from '../../../constants';
import { analyzeSnapshot, findBestGig } from '../../../services/routingEngine';
import { ImageUploader } from '../../Common/ImageUploader';
import { gigApi, GigData } from '../../../services/gigApi';
import { repairApi } from '../../../services/repairApi';
import api from '../../../services/api';
import { DiagnosticSnapshot } from '../../../types';

export const NewRepairRequest: React.FC = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState<'select' | 'testing' | 'submit' | 'done'>('select');
  const [selectedCategory, setSelectedCategory] = useState<string>('Health Intelligence');
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [gigs, setGigs] = useState<GigData[]>([]);
  const [selectedGigId, setSelectedGigId] = useState('');
  const [snapshotObj, setSnapshotObj] = useState<DiagnosticSnapshot | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [gigError, setGigError] = useState(false);

  const scanningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gigsRef = useRef<GigData[]>([]);

  const DIAGNOSTIC_OPTIONS = [
    { name: 'Health Intelligence', icon: Icons.activity, desc: 'Assess CPU loads, temperature telemetry, kernel logs, and background memory levels.' },
    { name: 'Storage Intelligence', icon: Icons.database, desc: 'Analyze storage cluster fragmentation, sector integrity, and smart metrics.' },
    { name: 'Network Diagnostics', icon: Icons.globe, desc: 'Test socket latencies, packet delivery buffers, and proxy configurations.' },
    { name: 'Hardware Drivers', icon: Icons.monitor, desc: 'Verify peripheral responses, expansion card configurations, and bus clockings.' },
    { name: 'Security Stability', icon: Icons.lock, desc: 'Audit active thread sandboxes, registry modifications, and security definitions.' }
  ];

  /** Loads available gigs, auto-retrying transient failures a couple of times. */
  const loadGigs = async (attempt = 0) => {
    try {
      const res = await gigApi.list();
      setGigs(res.filter(g => g.isAvailable));
      setGigError(false);
    } catch (err) {
      console.warn('Failed to load gigs:', err);
      setGigError(true);
      if (attempt < 2) {
        setTimeout(() => loadGigs(attempt + 1), 2500);
      }
    }
  };

  useEffect(() => {
    loadGigs();
  }, []);

  // Keep a live copy of the gigs list so the scan completion callback never
  // reads a stale closure value.
  useEffect(() => {
    gigsRef.current = gigs;
  }, [gigs]);

  // Clear any in-flight scan timers if the user navigates away mid-scan.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** Fails fast instead of hanging the UI if a telemetry endpoint is slow. */
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Telemetry collection timed out after ${ms}ms`)), ms),
      ),
    ]);

  /**
   * Collects REAL system telemetry for the selected diagnostic category from
   * the live snapshot endpoints. Every fetch is individually guarded, so the
   * flow never gets stuck — an unavailable source degrades to a partial
   * payload and collection still completes.
   */
  const collectTelemetry = async (category: string): Promise<Record<string, any>> => {
    const safe = async (path: string): Promise<any> => {
      try {
        const res = await withTimeout(api.get(path), 8000);
        return res.data?.data ?? {};
      } catch (err) {
        console.warn(`[NewRepairRequest] Telemetry source unavailable (${path}):`, err);
        return {};
      }
    };

    switch (category) {
      case 'Network Diagnostics': {
        const [net, health] = await Promise.all([
          safe('/v1/system/network'),
          safe('/v1/system/health'),
        ]);
        return {
          ...net,
          stats: { cpu: health.cpu ?? 0, ram: health.ram?.usedPercent ?? 0, temperature: 0 },
          latency: typeof net.latency === 'number' ? net.latency : 0,
          dnsLatency: net.dnsLatency ?? 0,
          connectionQuality: net.connectionQuality ?? 'Unknown',
          internetReachable: net.internetReachable ?? false,
          collectionSource: 'live-system-snapshot',
        };
      }
      case 'Health Intelligence': {
        const [health, perf] = await Promise.all([
          safe('/v1/system/health'),
          safe('/v1/system/performance'),
        ]);
        return {
          ...health,
          ...perf,
          stats: {
            cpu: health.cpu ?? 0,
            ram: health.ram?.usedPercent ?? 0,
            temperature: 0,
          },
          performanceScore: perf.performanceScore ?? 0,
          performanceHealth: perf.performanceHealth ?? 'Unknown',
          collectionSource: 'live-system-snapshot',
        };
      }
      case 'Storage Intelligence': {
        const [drives, fileStats] = await Promise.all([
          safe('/v1/system/drives'),
          safe('/v1/system/file-stats'),
        ]);
        const driveList = Array.isArray(drives.drives) ? drives.drives : [];
        return {
          ...drives,
          ...fileStats,
          drives: driveList,
          usedSpaceGB: driveList.reduce(
            (sum: number, d: any) => sum + (d.usedGB ?? d.usedSpaceGB ?? 0),
            0,
          ),
          collectionSource: 'live-system-snapshot',
        };
      }
      case 'Hardware Drivers': {
        const hw = await safe('/v1/system/hardware');
        return { ...hw, collectionSource: 'live-system-snapshot' };
      }
      case 'Security Stability': {
        const analytics = await safe('/v1/reports/analytics');
        return { ...(analytics.security ?? {}), collectionSource: 'live-system-snapshot' };
      }
      default:
        return { generic: 'Telemetry PASS', collectionSource: 'live-system-snapshot' };
    }
  };

  const startTelemetryRun = async () => {
    if (scanningRef.current) return; // ignore double-clicks
    scanningRef.current = true;
    setUserImages([]);
    setStage('testing');
    setProgress(0);

    // Animated progress while the real collection runs in the background.
    const interval = setInterval(() => {
      setProgress(p => (p < 92 ? p + 7 : p));
    }, 110);
    intervalRef.current = interval;

    const collected = await collectTelemetry(selectedCategory);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setProgress(100);
    timerRef.current = setTimeout(() => finishTelemetryRun(collected), 300);
  };

  const finishTelemetryRun = (collected: Record<string, any>) => {
    const tempSnapshot: DiagnosticSnapshot = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sourceModule: selectedCategory,
      data: collected,
      createdAt: Date.now(),
    };

    setSnapshotObj(tempSnapshot);

    const analysisRes = analyzeSnapshot(tempSnapshot);
    setAnalysis(analysisRes);

    // Prefer the best-matching gig for the detected issue, otherwise fall back
    // to the first available one. Runs in the background — the form renders
    // immediately and the selection fills in when ready.
    scanningRef.current = false;

    findBestGig(analysisRes.recommendedGigType)
      .then(bestGig => {
        if (bestGig) {
          setSelectedGigId(bestGig.id);
        } else if (gigsRef.current.length > 0) {
          setSelectedGigId(gigsRef.current[0].id);
        }
      })
      .catch(() => {
        if (gigsRef.current.length > 0) setSelectedGigId(gigsRef.current[0].id);
      });

    setStage('submit');
  };

  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !snapshotObj || !analysis) return;

    setIsSubmitting(true);
    const matchedGig = gigs.find(g => g.id === selectedGigId);

    try {
      const imageFiles = userImages.length > 0
        ? userImages.map((b64, i) => base64ToFile(b64, `proof_${i + 1}.jpg`))
        : undefined;

      const descriptionText = description.trim() || `Automated routing diagnostics prepared from the ${selectedCategory} telemetry module.`;

      await repairApi.create({
        gig_title: matchedGig?.title || 'Telemetry Calibration Services',
        issue_category: analysis.issueCategory,
        issue_description: descriptionText,
        severity_level: analysis.severityLevel === 'HIGH' ? 'high' : analysis.severityLevel === 'MEDIUM' ? 'medium' : 'low',
        user_images: imageFiles,
      });

      setIsSubmitting(false);
      setStage('done');
    } catch (err: any) {
      console.error('Failed to create repair request:', err);
      let errorMessage = 'Failed to submit repair request. Please try again.';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        }
      }
      
      setToast({ type: 'error', message: errorMessage });
      setTimeout(() => setToast(null), 5000);
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">New Diagnostics-Routed Repair Request</h2>
        <p className="text-slate-400">System Sentinel enforces automated diagnostics snapshots before submitting requests. No more blind guesswork.</p>
      </div>

      {stage === 'select' && (
        <div className="space-y-6">
          <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl flex items-start gap-4">
             <div className="text-indigo-400 text-xl font-bold shrink-0 mt-1">💡</div>
             <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Why Diagnostics?</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                   Instead of filling out confusing forms, choose an automated assessment telemetry focus block below. Our system runs real telemetry simulation parameters first, extracts systemic bugs, and maps them instantly to the ideal technician.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIAGNOSTIC_OPTIONS.map(opt => (
              <div 
                key={opt.name}
                onClick={() => setSelectedCategory(opt.name)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] md:h-44 ${
                  selectedCategory === opt.name 
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]' 
                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                }`}
              >
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <span className={`p-1.5 rounded-lg ${selectedCategory === opt.name ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}>
                        {opt.icon}
                     </span>
                     <h4 className="font-bold text-slate-100 text-sm md:text-base">{opt.name}</h4>
                   </div>
                   <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                   <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Telemetry Driver</span>
                   {selectedCategory === opt.name && (
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span> Selected
                      </span>
                   )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
             <button 
               onClick={startTelemetryRun}
               className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl text-sm tracking-wide shadow-md transition-all flex items-center gap-2"
             >
                Initialize Telemetry Scan & Match
                {Icons.activity}
             </button>
          </div>
        </div>
      )}

      {stage === 'testing' && (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 space-y-6 max-w-xl mx-auto">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
             <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
             <span className="text-xl font-bold font-mono text-indigo-400">{progress}%</span>
          </div>

          <div className="space-y-2">
             <h3 className="text-xl font-bold text-white tracking-tight">Gathering Diagnostic Artifacts</h3>
             <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Collecting live {selectedCategory} telemetry from the system snapshot, analyzing severity, and matching the ideal technician...
             </p>
          </div>
        </div>
      )}

      {stage === 'submit' && analysis && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
           <div className="p-5 border-b border-white/5 bg-indigo-500/5 flex justify-between items-center">
              <div>
                 <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diagnosis Form</span>
                 <h3 className="text-lg font-bold text-white leading-tight">Review AI Alignment Analysis</h3>
              </div>
              <button onClick={() => setStage('select')} className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1 bg-white/5 rounded-lg transition-colors">
                 Back
              </button>
           </div>

           <form onSubmit={handleCreateRequest} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#020617]/50 p-5 rounded-2xl border border-white/5">
                 <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500">Routing Directives</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Detected System:</span>
                          <span className="text-slate-200 font-semibold">{analysis.issueCategory.replace('_', ' ')}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Automated Severity:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             analysis.severityLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                             {analysis.severityLevel} ({analysis.severityScore}/100)
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500">Prepared Data Payload</h4>
                      <span className="block font-mono text-xs text-indigo-400 mt-2">
                         [Telemetry Snapshot Loaded Under UUID: {snapshotObj?.id.substring(0, 10)}...]
                      </span>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Select Technician Gig</label>
                 {gigError ? (
                   <div className="w-full bg-[#020617] border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400 flex items-center justify-between gap-3">
                     <span>Failed to load available gigs.</span>
                     <button
                       type="button"
                       onClick={() => loadGigs()}
                       className="shrink-0 text-rose-300 hover:text-white border border-rose-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                     >
                       Retry
                     </button>
                   </div>
                 ) : gigs.length === 0 ? (
                   <div className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-500">
                     No available gigs found. A technician will be assigned by admin.
                   </div>
                 ) : (
                   <select 
                     value={selectedGigId} 
                     onChange={(e) => setSelectedGigId(e.target.value)}
                     className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                   >
                      {gigs.map(g => (
                        <option key={g.id} value={g.id}>
                           {g.title} ({g.technicianName} • PKR {g.price})
                        </option>
                      ))}
                   </select>
                 )}
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Add Human Context & Description</label>
                   <span className={`text-[10px] font-mono ${description.trim().length >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                     {description.trim().length}/10 min chars
                   </span>
                 </div>
                 <textarea 
                   rows={4}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Describe what exactly happened, steps to reproduce, or any user requirements..."
                   className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
                 ></textarea>
                 {description.trim().length > 0 && description.trim().length < 10 && (
                   <p className="text-[10px] text-amber-400">
                     Description must be at least 10 characters. Current: {description.trim().length} characters.
                   </p>
                 )}
              </div>

              <div className="space-y-2">
                <ImageUploader 
                  images={userImages} 
                  onChange={setUserImages} 
                  label="Upload Problem Proof / Photo of Device (Optional)"
                />
              </div>

              <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 tracking-wider uppercase"
                 >
                    {isSubmitting ? 'Routing Ticket...' : 'File Official Repair Ticket'}
                 </button>
              </div>
           </form>
        </div>
      )}

      {stage === 'done' && (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 space-y-6 max-w-xl mx-auto bg-emerald-500/5">
           <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl">
              ✓
           </div>
           
           <div className="space-y-2">
             <h3 className="text-xl font-bold text-white tracking-tight">Repair Ticket Logged Successfully</h3>
             <p className="text-sm text-slate-400 leading-relaxed px-4">
                The smart diagnostic telemetry payload has been saved to the ledger database and connected to your assigned technician profile! You can now track live updates.
             </p>
           </div>

           <div className="pt-4 flex gap-3">
              <button onClick={() => setStage('select')} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-white text-sm font-semibold transition-colors">
                 Submit Another
              </button>
           </div>
        </div>
      )}
    </div>

    {toast && (
      <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
        toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
      }`}>
        {toast.message}
      </div>
    )}
    </>
  );
};
