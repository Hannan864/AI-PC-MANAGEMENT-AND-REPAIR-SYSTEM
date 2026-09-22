import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../Layout/AuthProvider';
import { PCBuild, BuildRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { CPUs, GPUs, Motherboards, RAMs, Storages, PowerSupplies, Cases } from '../../../services/pcComponents';
import { evaluatePCBuildAsync } from '../../../services/pcBuilder';
import { BuildSuggestionsPanel } from './BuildSuggestionsPanel';
import { BuildScorePanel } from './BuildScorePanel';
import { BuildCard } from './BuildCard';
import { pcBuildApi, PCBuildData } from '../../../services/pcBuildApi';

const BACKEND_STATUS_MAP: Record<string, BuildRequestStatus> = {
  draft: BuildRequestStatus.DRAFT,
  submitted_review: BuildRequestStatus.SUBMITTED,
  under_review: BuildRequestStatus.UNDER_REVIEW,
  reviewed: BuildRequestStatus.APPROVED,
  rejected: BuildRequestStatus.REJECTED,
  in_progress: BuildRequestStatus.IN_PROGRESS,
  completed: BuildRequestStatus.COMPLETED,
};

const mapBuild = (b: PCBuildData): PCBuild => ({
  buildId: b.id,
  userId: b.userId,
  buildName: b.buildName,
  cpu: b.cpu,
  gpu: b.gpu,
  motherboard: b.motherboard,
  ram: b.ram,
  storage: b.storage,
  powerSupply: b.powerSupply,
  case: b.chassis ?? undefined,
  estimatedCostUSD: b.estimatedCostUsd ?? undefined,
  estimatedCostPKR: b.estimatedCostPkr ?? undefined,
  compatibilityStatus: b.compatibilityStatus.toUpperCase() as PCBuild['compatibilityStatus'],
  performanceScore: b.performanceScore,
  issues: b.issues,
  bottlenecks: b.bottlenecks,
  status: BACKEND_STATUS_MAP[b.status] ?? BuildRequestStatus.DRAFT,
  technicianNotes: b.technicianNotes ?? undefined,
  userNotes: b.userNotes ?? undefined,
  createdAt: new Date(b.createdAt).getTime(),
} as PCBuild);

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export const BuildPlanner: React.FC = () => {
  const { user } = useAuth();
  const [builds, setBuilds] = useState<PCBuild[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [editingBuild, setEditingBuild] = useState<PCBuild | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection State
  const [buildName, setBuildName] = useState('');
  const [cpuId, setCpuId] = useState('');
  const [gpuId, setGpuId] = useState('');
  const [ramId, setRamId] = useState('');
  const [storageId, setStorageId] = useState('');
  const [powerSupplyId, setPowerSupplyId] = useState('');
  const [motherboardId, setMotherboardId] = useState('');
  const [caseId, setCaseId] = useState('');

  // Evaluation state
  const [evalResult, setEvalResult] = useState<any | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadBuilds();
  }, [user]);

  useEffect(() => {
    const runEval = async () => {
      if (cpuId || gpuId || ramId || storageId || powerSupplyId || motherboardId || caseId) {
        setIsEvaluating(true);
        try {
          const res = await evaluatePCBuildAsync({ cpuId, gpuId, motherboardId, ramId, storageId, powerSupplyId, caseId });
          setEvalResult(res);
        } catch {
          setEvalResult(null);
        } finally {
          setIsEvaluating(false);
        }
      } else {
        setEvalResult(null);
      }
    };
    runEval();
  }, [cpuId, gpuId, ramId, storageId, powerSupplyId, motherboardId, caseId]);

  const loadBuilds = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await pcBuildApi.list();
      const b = res.data
        .filter((x) => x.userId === user.id)
        .map(mapBuild)
        .sort((a, c) => (c.createdAt || 0) - (a.createdAt || 0));
      setBuilds(b);
    } catch {
      setLoadError('Could not load your saved builds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (presetType: 'GAMING' | 'OFFICE' | 'EDITING' | 'BUDGET' | 'WORKSTATION') => {
    if (presetType === 'GAMING') {
      setBuildName('Ultimate AM5 Gaming Blueprint 🎮');
      setCpuId('cpu-7800x3d');
      setMotherboardId('mb-b650');
      setGpuId('gpu-4080s');
      setRamId('ram-d5-32');
      setStorageId('str-nvme-2');
      setPowerSupplyId('psu-850');
      setCaseId('case-h9');
    } else if (presetType === 'WORKSTATION') {
      setBuildName('Threadripper-Class Core i9 Beast 🧠');
      setCpuId('cpu-14900k');
      setMotherboardId('mb-z790');
      setGpuId('gpu-4090');
      setRamId('ram-d5-64');
      setStorageId('str-nvme-4');
      setPowerSupplyId('psu-1000');
      setCaseId('case-o11d');
    } else if (presetType === 'EDITING') {
      setBuildName('Pro Streamer & Cinebench Studio 🎬');
      setCpuId('cpu-14700k');
      setMotherboardId('mb-z790');
      setGpuId('gpu-4070s');
      setRamId('ram-d5-32');
      setStorageId('str-nvme-2');
      setPowerSupplyId('psu-850');
      setCaseId('case-o11d');
    } else if (presetType === 'BUDGET') {
      setBuildName('Optimized Budget Builder mATX 💰');
      setCpuId('cpu-13600k');
      setMotherboardId('mb-b760');
      setGpuId('gpu-4060');
      setRamId('ram-d4-16');
      setStorageId('str-nvme-1');
      setPowerSupplyId('psu-500');
      setCaseId('case-ch370');
    } else {
      setBuildName('Quiet Home Productivity Suite 💼');
      setCpuId('cpu-5600x');
      setMotherboardId('mb-b550');
      setGpuId('gpu-4060');
      setRamId('ram-d4-16');
      setStorageId('str-nvme-1');
      setPowerSupplyId('psu-650');
      setCaseId('case-4000d');
    }
  };

  const startEdit = (build: PCBuild) => {
    setEditingBuild(build);
    setBuildName(build.buildName);
    setCpuId(CPUs.find(c => c.name === build.cpu)?.id ?? '');
    setGpuId(GPUs.find(g => g.name === build.gpu)?.id ?? '');
    setMotherboardId(Motherboards.find(m => m.name === build.motherboard)?.id ?? '');
    setRamId(RAMs.find(r => r.name === build.ram)?.id ?? '');
    setStorageId(Storages.find(s => s.name === build.storage)?.id ?? '');
    setPowerSupplyId(PowerSupplies.find(p => p.name === build.powerSupply)?.id ?? '');
    setCaseId(build.case ? Cases.find(c => c.name === build.case)?.id ?? '' : '');
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setEditingBuild(null);
    clearForm();
    setIsCreating(false);
  };

  const buildPayload = () => ({
    build_name: buildName.trim() || 'Untitled Build',
    cpu: CPUs.find(c => c.id === cpuId)?.name || '',
    gpu: GPUs.find(g => g.id === gpuId)?.name || '',
    motherboard: Motherboards.find(m => m.id === motherboardId)?.name || '',
    ram: RAMs.find(r => r.id === ramId)?.name || '',
    storage: Storages.find(s => s.id === storageId)?.name || '',
    power_supply: PowerSupplies.find(p => p.id === powerSupplyId)?.name || '',
    chassis: Cases.find(c => c.id === caseId)?.name || undefined,
  });

  const handleSaveBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving || isEvaluating) return;
    if (!evalResult) {
      showToast('error', 'Select your components first so the analysis engine can verify the build.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (editingBuild) {
        await pcBuildApi.update(editingBuild.buildId, payload);
        showToast('success', `Build "${payload.build_name}" updated — ready to resubmit for review.`);
      } else {
        await pcBuildApi.create(payload);
        showToast('success', `Build "${payload.build_name}" saved to your repository.`);
      }
      setEditingBuild(null);
      setIsCreating(false);
      clearForm();
      await loadBuilds();
    } catch {
      showToast('error', 'Could not save the build. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendForReview = async (build: PCBuild) => {
    if (!user) return;
    try {
      await pcBuildApi.submitForReview(build.buildId);
      showToast('success', 'Build sent to our hardware technicians for verification.');
      await loadBuilds();
    } catch {
      showToast('error', 'Could not submit the build. Resolve compatibility issues and try again.');
    }
  };

  const clearForm = () => {
    setBuildName(''); setCpuId(''); setGpuId(''); setRamId(''); setStorageId(''); setPowerSupplyId(''); setMotherboardId(''); setCaseId('');
  };

  const deleteBuild = async (id: string) => {
    if (!confirm('Are you sure you want to delete this build template?')) return;
    try {
      await pcBuildApi.delete(id);
      showToast('success', 'Build template deleted.');
      await loadBuilds();
    } catch {
      showToast('error', 'Only draft builds can be deleted.');
    }
  };

  const renderSelect = (label: string, value: string, setter: any, options: any[], placeholder: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      <select
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
      >
        <option value="">-- {placeholder} --</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name} - Rs. {o.price.toLocaleString()}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-indigo-500">{Icons.cpu}</span>
            Advanced PC Builder Intelligence Engine (APCIE)
          </h2>
          <p className="text-slate-400 text-sm">Design tailored PC systems with complete hardware component checks, diagnostic scores, and auto-computed pricing ranges.</p>
        </div>
        {!isCreating && (
          <button
            id="btn-configure-smart-build"
            onClick={() => { setEditingBuild(null); clearForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20 text-sm"
          >
            {Icons.plus} Configure Smart Build
          </button>
        )}
      </div>

      {isCreating && (
        <div className="space-y-6 border border-white/5 bg-[#0b0f19] p-6 rounded-2xl shadow-xl">
          {editingBuild && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Editing <span className="font-bold">"{editingBuild.buildName}"</span> — changes will return the build to draft for resubmission.
              </p>
              <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                Cancel Edit
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5 p-4 bg-slate-950/40 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono font-bold">Select Preset Baseline Configs</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(['GAMING', 'WORKSTATION', 'EDITING', 'BUDGET', 'OFFICE'] as const).map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-2 mt-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-semibold text-center transition-colors block"
                >
                  {preset === 'GAMING' ? '🎮 Gaming' : preset === 'WORKSTATION' ? '🧠 Workstation' : preset === 'EDITING' ? '🎬 Editing' : preset === 'BUDGET' ? '💰 Budget' : '💼 Office'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-6 rounded-2xl border border-white/5 space-y-5">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <span>{Icons.sparkles}</span> Core Components Checklist
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Configuration / Build Name</label>
                    <input
                      type="text"
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                      placeholder="e.g. Creator Workstation 2026"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {renderSelect('Processor (CPU)', cpuId, setCpuId, CPUs, 'Select CPU')}
                    {renderSelect('Motherboard', motherboardId, setMotherboardId, Motherboards, 'Select Motherboard')}
                    {renderSelect('Graphics (GPU)', gpuId, setGpuId, GPUs, 'Select GPU')}
                    {renderSelect('Memory (RAM)', ramId, setRamId, RAMs, 'Select RAM')}
                    {renderSelect('Primary Storage', storageId, setStorageId, Storages, 'Select Storage')}
                    {renderSelect('Power Supply', powerSupplyId, setPowerSupplyId, PowerSupplies, 'Select PSU')}
                    {renderSelect('Computer Case / Chassis', caseId, setCaseId, Cases, 'Select Case')}
                  </div>
                </div>
              </div>

              {evalResult && evalResult.suggestions && evalResult.suggestions.length > 0 && (
                <BuildSuggestionsPanel suggestions={evalResult.suggestions} />
              )}
            </div>

            <div className="space-y-6">
              {isEvaluating ? (
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center h-64 shadow-inner">
                  <div className="animate-spin text-indigo-500 mb-3">{Icons.cpu}</div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-mono">Querying System Sentinel APCIE Logic Engine...</p>
                </div>
              ) : evalResult ? (
                <BuildScorePanel
                  buildName={buildName}
                  evalResult={evalResult as any}
                  isSaving={isSaving}
                  selectedCpu={CPUs.find(c => c.id === cpuId)?.name || ''}
                  selectedGpu={GPUs.find(g => g.id === gpuId)?.name || ''}
                  selectedMotherboard={Motherboards.find(m => m.id === motherboardId)?.name || ''}
                  selectedRam={RAMs.find(r => r.id === ramId)?.name || ''}
                  selectedStorage={Storages.find(s => s.id === storageId)?.name || ''}
                  selectedPowerSupply={PowerSupplies.find(p => p.id === powerSupplyId)?.name || ''}
                  selectedCase={Cases.find(c => c.id === caseId)?.name || ''}
                  onSave={handleSaveBuild}
                  onCancel={() => cancelEdit()}
                />
              ) : (
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center h-64 shadow-inner">
                  <div className="text-slate-500 mb-3">{Icons.cpu}</div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Select processor slots, motherboard dimensions, graphics cards or select templates to trigger analysis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isCreating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{Icons.history}</span> Custom Specs & Hardware Repositories ({builds.length})
            </h3>
            {isLoading && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /> Syncing...
              </span>
            )}
          </div>

          {loadError && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button onClick={loadBuilds} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isLoading && builds.length === 0 && !loadError && (
              <div id="no-builds-box" className="col-span-full border border-dashed border-white/10 rounded-2xl p-12 text-center h-48 flex flex-col items-center justify-center">
                <p className="text-slate-500 text-sm max-w-xs">Configure unique PC builds based on hardware socket standards and save logs of drafts.</p>
              </div>
            )}

            {builds.map(b => (
              <BuildCard
                key={b.buildId}
                build={b}
                onDelete={deleteBuild}
                onSendForReview={sendForReview}
                onEdit={startEdit}
              />
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-md animate-[fadeIn_0.2s_ease-out] ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-400/30 text-white' : 'bg-rose-600/95 border-rose-400/30 text-white'}`}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? Icons.check : Icons.x}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
