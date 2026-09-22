import React, { useState } from 'react';
import { Icons } from '../../../constants';

interface DetailedBottleneck {
  type: string;
  severity: 'CRITICAL' | 'MODERATE' | 'LOW';
  description: string;
  fix: string;
}

interface ScoreBreakdown {
  socketCompatibility: number;
  memoryMatch: number;
  powerHeadroom: number;
  bottleneckImbalance: number;
  storageSpeed: number;
  caseFormFactor: number;
}

interface Suggestion {
  partType: string;
  currentId: string;
  currentName: string;
  suggestedId: string;
  suggestedName: string;
  reason: string;
}

interface PCBuilderEvaluation {
  status: 'PASS' | 'WARNING' | 'FAIL';
  score: number;
  scoreBreakdown: ScoreBreakdown;
  gamingSuitability: number;
  editingSuitability: number;
  officeSuitability: number;
  totalPowerWatts: number;
  psuMaxWatts: number;
  powerConsumptionSafetyMargin: number;
  estimatedPKR: number;
  estimatedPKRMin: number;
  estimatedPKRMax: number;
  issues: string[];
  bottlenecks: string[];
  detailedBottlenecks?: DetailedBottleneck[];
  suggestions?: Suggestion[];
}

interface BuildScorePanelProps {
  buildName: string;
  evalResult: PCBuilderEvaluation;
  isSaving?: boolean;
  selectedCpu: string;
  selectedGpu: string;
  selectedMotherboard: string;
  selectedRam: string;
  selectedStorage: string;
  selectedPowerSupply: string;
  selectedCase: string;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const BuildScorePanel: React.FC<BuildScorePanelProps> = ({
  buildName,
  evalResult,
  isSaving = false,
  selectedCpu,
  selectedGpu,
  selectedMotherboard,
  selectedRam,
  selectedStorage,
  selectedPowerSupply,
  selectedCase,
  onSave,
  onCancel
}) => {
  const [copiedReport, setCopiedReport] = useState(false);

  const handleExportReport = () => {
    const reportMarkdown = `# PC Build Report: ${buildName || 'Custom Build'}
Generated: ${new Date().toLocaleDateString()}
Compatibility: ${evalResult.status}
Performance Score: ${evalResult.score}/100

## Components
- CPU: ${selectedCpu || 'Not Selected'}
- GPU: ${selectedGpu || 'Not Selected'}
- Motherboard: ${selectedMotherboard || 'Not Selected'}
- RAM: ${selectedRam || 'Not Selected'}
- Storage: ${selectedStorage || 'Not Selected'}
- PSU: ${selectedPowerSupply || 'Not Selected'}
- Case: ${selectedCase || 'Not Selected'}

## Cost Estimate
- Budget Range: Rs. ${evalResult.estimatedPKRMin.toLocaleString()} - Rs. ${evalResult.estimatedPKRMax.toLocaleString()}

## Workload Suitability
- Gaming: ${evalResult.gamingSuitability}%
- Creative/Editing: ${evalResult.editingSuitability}%
- Productivity: ${evalResult.officeSuitability}%

## Issues
${evalResult.issues.length > 0 ? evalResult.issues.map(iss => `- ${iss}`).join('\n') : '- None detected'}

## Bottlenecks
${evalResult.bottlenecks.length > 0 ? evalResult.bottlenecks.map(btn => `- ${btn}`).join('\n') : '- None detected'}

## Power
- Peak Load: ${evalResult.totalPowerWatts}W / ${evalResult.psuMaxWatts}W PSU
- Safety Margin: ${evalResult.powerConsumptionSafetyMargin}%
`;

    navigator.clipboard.writeText(reportMarkdown);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  return (
    <div id="build-score-panel" className="glass p-5 rounded-2xl border border-white/5 space-y-6 lg:sticky lg:top-6">
      {/* Price Estimate */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 font-mono">Estimated Cost</h4>
        <div className="px-3 py-3 bg-[#020617]/50 rounded-lg border border-white/5">
          <span className="text-[9px] text-slate-500 block pb-0.5 font-mono">Budget Range (PKR)</span>
          <span className="text-xl font-bold text-emerald-400">Rs. {evalResult.estimatedPKRMin.toLocaleString()} - Rs. {evalResult.estimatedPKRMax.toLocaleString()}</span>
        </div>
      </div>

      {/* Performance Health Gauge */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">Performance Index</span>
          <span className={`text-xs font-bold ${evalResult.score >= 80 ? 'text-lime-400' : evalResult.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            {evalResult.score}/100
          </span>
        </div>
        <div className="h-2 w-full bg-[#020617] rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full ${evalResult.score >= 80 ? 'bg-lime-500' : evalResult.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'} transition-all duration-500`} 
            style={{ width: `${evalResult.score}%` }} 
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/35 p-3 rounded-xl border border-white/5 space-y-0.5 font-mono">
          <div className="col-span-2 text-slate-400 font-bold border-b border-white/5 pb-1 mb-1 uppercase tracking-wide">Scoring Index Criteria</div>
          <div className="text-slate-500">Socket Match:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.socketCompatibility}/20</div>
          <div className="text-slate-500">RAM Gen Match:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.memoryMatch}/20</div>
          <div className="text-slate-500">PSU Overhead:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.powerHeadroom}/20</div>
          <div className="text-slate-500">Bottlenecks Imbalance:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.bottleneckImbalance}/20</div>
          <div className="text-slate-500">Storage Speed Standard:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.storageSpeed}/10</div>
          <div className="text-slate-500">Chassis Fit:</div>
          <div className="text-right text-slate-300 pr-1">{evalResult.scoreBreakdown.caseFormFactor}/10</div>
        </div>
      </div>

      {/* Suitability Vectors */}
      <div className="space-y-2 border-t border-white/5 pt-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block font-mono">Workloads Suitability</span>
        <div className="space-y-2 bg-slate-950/15 p-3 rounded-xl border border-white/5 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium font-mono text-slate-400">
              <span>Gaming / esports</span>
              <span>{evalResult.gamingSuitability}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${evalResult.gamingSuitability}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium font-mono text-slate-400">
              <span>Creative / Post Production</span>
              <span>{evalResult.editingSuitability}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${evalResult.editingSuitability}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium font-mono text-slate-400">
              <span>General Web & Productivity</span>
              <span>{evalResult.officeSuitability}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${evalResult.officeSuitability}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Power reserves margin */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider pl-1 font-mono">
          <span>Total Estimated Peak</span>
          <span>{evalResult.totalPowerWatts}W / {evalResult.psuMaxWatts}W PSU</span>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
          <div 
            className={`h-full ${evalResult.powerConsumptionSafetyMargin < 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(100, (evalResult.totalPowerWatts / evalResult.psuMaxWatts) * 100)}%` }} 
          />
        </div>
        <p className="text-[9px] text-slate-400 font-mono leading-none pt-1">
          Safety margin: <span className={`${evalResult.powerConsumptionSafetyMargin < 15 ? 'text-rose-400' : 'text-emerald-400'}`}>{evalResult.powerConsumptionSafetyMargin}%</span> headroom
        </p>
      </div>

      {/* Compatibility Standing and Issues */}
      <div className="space-y-3">
        <div className={`p-3 border rounded-xl flex items-start gap-3 ${evalResult.status === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : evalResult.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <div className="mt-0.5">{evalResult.status === 'PASS' ? Icons.check : evalResult.status === 'WARNING' ? Icons.alert : Icons.x}</div>
          <div className="flex-1">
            <span className="block text-xs font-bold uppercase tracking-widest">{evalResult.status === 'PASS' ? 'Compatible' : evalResult.status === 'WARNING' ? 'Issues Detected' : 'Incompatible'}</span>
            {evalResult.status === 'PASS' && <span className="text-xs opacity-80">All core sizes and socket specifications clear.</span>}
            {evalResult.issues.map((iss, i) => (
              <span key={i} className="block text-xs mt-1 opacity-90 leading-normal">• {iss}</span>
            ))}
          </div>
        </div>

        {/* Bottlenecks lists */}
        {evalResult.detailedBottlenecks && evalResult.detailedBottlenecks.length > 0 && (
          <div className="p-3 border rounded-xl bg-orange-500/10 border-orange-500/20 text-orange-200 space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">Bottleneck Alerts</span>
            {evalResult.detailedBottlenecks.map((btn, i) => (
              <div key={i} className="text-xs space-y-1">
                <span className="block font-semibold text-orange-300">• {btn.type} ({btn.severity})</span>
                <span className="block opacity-80 text-[11px] leading-relaxed pl-1">{btn.description}</span>
                <span className="block italic text-[10px] text-orange-400 opacity-90 pl-1">Fix: {btn.fix}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions & Report Export */}
      <div className="pt-2 flex flex-col gap-2.5">
        <div className="flex gap-2">
          <button 
            onClick={onSave} 
            disabled={evalResult.status === 'FAIL' || isSaving} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Build Draft'}
          </button>
          <button 
            onClick={onCancel} 
            disabled={isSaving}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {evalResult.status === 'FAIL' && (
          <p className="text-[10px] text-rose-400/90 font-mono text-center -mt-1">
            Resolve the compatibility issues above to enable saving.
          </p>
        )}

        <button 
          onClick={handleExportReport} 
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-mono font-medium border border-white/5 flex items-center justify-center gap-1.5 transition-colors"
        >
          {copiedReport ? '✓ Report Copied in MD!' : '📋 Export Markdown Build Report'}
        </button>
      </div>
    </div>
  );
};
