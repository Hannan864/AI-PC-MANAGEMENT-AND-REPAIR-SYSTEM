import React from 'react';
import { RepairRequest } from '../../../types';
import { ServiceSummaryGallery } from './ServiceSummaryGallery';

interface ServiceSummaryViewProps {
  req: RepairRequest;
  onBack?: () => void;
}

const EXCHANGE_RATE_PKR = 278;

export const ServiceSummaryView: React.FC<ServiceSummaryViewProps> = ({ req, onBack }) => {
  const report = req.completionReport;
  
  // Calculate duration
  const start = typeof req.createdAt === 'number' && !isNaN(req.createdAt) ? req.createdAt : Date.now();
  const finish = report?.completedAt && typeof report.completedAt === 'number' && !isNaN(report.completedAt)
    ? report.completedAt
    : req.updatedAt && typeof req.updatedAt === 'number' && !isNaN(req.updatedAt)
      ? req.updatedAt
      : Date.now();
  const diffMs = Math.max(0, finish - start);
  const diffHours = isNaN(diffMs) ? "0.0" : (diffMs / 3600000).toFixed(1);
  const diffMins = isNaN(diffMs) ? 0 : Math.round(diffMs / 60000);

  // Costs are now stored in PKR directly
  const laborPKR = report?.laborCost || 0;
  const totalPKR = report?.totalCost || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-white/5 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to list
        </button>
      )}

      {/* Main card */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#0b0f19]">
        
        {/* Banner with Status & ID */}
        <div className="p-6 bg-slate-900/60 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#6366f1] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 font-mono">
                TICKET DISPATCH SUMMARY
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                SLA COMPLETED
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-1">
              {req.gigTitle || 'PC Diagnostic Service'}
            </h3>
            <span className="text-[10px] font-mono text-slate-500 block">UUID: {req.id}</span>
          </div>

          <div className="text-left md:text-right font-mono shrink-0">
            <span className="text-[10px] text-slate-500 font-sans font-bold uppercase block tracking-wider">FINAL INVOICE</span>
            <span className="text-2xl font-black text-white">Rs. {totalPKR.toLocaleString()}</span>
            <span className="text-xs text-slate-400 block font-semibold">
              ≈ ${(totalPKR / EXCHANGE_RATE_PKR).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Metadata Section (User, Tech, Timeline) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* User details */}
            <div className="space-y-2 p-4 bg-slate-950/40 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Customer Details</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">{req.userName}</p>
                <div className="text-xs text-slate-400 leading-normal space-y-0.5">
                  <p>Client ID: <span className="font-mono text-[10.5px]">...{req.userId.substring(req.userId.length - 6)}</span></p>
                  <p>Registered: {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Technician details */}
            <div className="space-y-2 p-4 bg-slate-950/40 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Assigned Engineer</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-indigo-400">
                  {req.technicianDecision || 'Service Sentinel Platform Engineer'}
                </p>
                <div className="text-xs text-slate-400 leading-normal space-y-0.5">
                  <p>Status: <span className="text-emerald-400 font-bold">Certified Mechanician</span></p>
                  <p>ID Code: <span className="font-mono text-[10.5px]">...{req.technicianId?.substring(req.technicianId.length - 6) || 'N/A'}</span></p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2 p-4 bg-slate-950/40 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">SLA Timeline & TAT</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-sky-400">
                  {diffMins > 60 ? `${diffHours} Hours` : `${diffMins} Minutes`}
                </p>
                <div className="text-xs text-slate-400 leading-normal space-y-0.5">
                  <p>Submitted: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Completed: {report ? new Date(report.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* AI Routing Decisions & Overrides */}
          <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">🤖</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                AI Diagnostic Routing Assessment
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <p className="text-slate-400">Classification Match Category:</p>
                <p className="text-slate-200">{req.issueCategory || 'Universal PC Tuning'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">SLA Severity Level Metrics:</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                  }`}>
                    {req.severityLevel || 'MEDIUM'} ({req.severityScore || '50'}/100 Score)
                  </span>
                  {req.isAIOverridden && (
                    <span className="text-[10px] text-amber-500 font-bold uppercase">⚠️ Admin Routing Overridden</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Performed Detail View */}
          {report ? (
            <div className="space-y-6">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 border-b border-white/5 pb-2">
                Technical Maintenance Reports
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Descriptions */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Issue Summary</span>
                    <p className="text-xs font-bold text-slate-200 bg-slate-950/25 p-3 rounded-lg border border-white/5">
                      {report.issueSummary}
                    </p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Root Cause Analysis</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/25 p-3.5 rounded-lg border border-white/5">
                      {report.rootCauseAnalysis}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Engineer Work Notes</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/25 p-3.5 rounded-lg border border-white/5 italic">
                      " {report.workNotes} "
                    </p>
                  </div>
                </div>

                {/* Costs Detail Breakdown and parts list */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">System Cost Ledger Invoice</span>
                  
                  <div className="border border-white/5 rounded-xl bg-[#020617]/50 overflow-hidden">
                    {/* Desktop Table */}
                    <table className="hidden sm:table w-full text-xs text-left">
                      <thead className="bg-slate-950/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/5">
                        <tr>
                          <th className="py-2.5 px-3">Spare / Charge Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Price (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300 font-semibold">
                        {/* Labor row */}
                        <tr>
                          <td className="py-2 p-3 font-semibold">Labor charges (Bench services)</td>
                          <td className="py-2 p-3 text-center text-slate-500 font-mono">-</td>
                          <td className="py-2 p-3 text-right text-slate-200 font-mono">Rs. {laborPKR.toLocaleString()}</td>
                        </tr>
                        {/* Parts Row */}
                        {report.partsReplaced && report.partsReplaced.length > 0 ? (
                          report.partsReplaced.map((part, idx) => (
                            <tr key={idx}>
                              <td className="py-2 p-3 truncate max-w-[150px]">{part.name}</td>
                              <td className="py-2 p-3 text-center font-mono text-slate-400">{part.quantity}</td>
                              <td className="py-2 p-3 text-right font-mono text-slate-200">
                                Rs. {(part.price * part.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-2 px-3 text-center text-slate-600 text-[10px] italic">
                              No hardware spare parts were replaced.
                            </td>
                          </tr>
                        )}
                        {/* Totals row */}
                        <tr className="bg-slate-950/40 text-slate-100 font-bold">
                          <td className="py-3 px-3 uppercase tracking-wider text-[10px]">Grand Unified Total</td>
                          <td className="py-3 px-3"></td>
                          <td className="py-3 px-3 text-right text-emerald-400 font-mono text-sm">
                            Rs. {totalPKR.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Mobile List */}
                    <div className="sm:hidden divide-y divide-white/5">
                      <div className="p-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Labor charges</span>
                        <span className="font-bold text-slate-200">Rs. {laborPKR.toLocaleString()}</span>
                      </div>
                      {report.partsReplaced && report.partsReplaced.length > 0 ? (
                        report.partsReplaced.map((part, idx) => (
                          <div key={idx} className="p-3 space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-200 font-semibold truncate max-w-[200px]">{part.name}</span>
                              <span className="font-bold text-slate-200">Rs. {(part.price * part.quantity).toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Qty: {part.quantity} × Rs. {part.price.toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-600 text-[10px] italic">
                          No hardware spare parts were replaced.
                        </div>
                      )}
                      <div className="p-4 bg-slate-950/40 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                        <span className="text-lg font-black text-emerald-400 mono">Rs. {totalPKR.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Currency conversion note */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/5 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                    <span>USD Equivalent:</span>
                    <span className="text-white font-mono">Rs. {totalPKR.toLocaleString()} ≈ ${(totalPKR / EXCHANGE_RATE_PKR).toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 border-b border-white/5 pb-2">
                Operational Status
              </h4>
              <p className="text-sm text-slate-500 italic py-6 text-center font-semibold bg-slate-950/10 border border-dashed border-white/5 rounded-xl">
                Diagnostic work in progress. Detailed technician reports are written on job completion checks.
              </p>
            </div>
          )}

          {/* Telemetry Snapshots Workspace review */}
          {req.attachedDiagnostics && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Historical Diagnostic Snapshot Data
              </span>
              <div className="bg-[#020617] p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto scrollbar-thin">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-2 border-b border-white/5 pb-1">
                  <span>MODULE ROUTING CACHE: {req.attachedDiagnostics.sourceModule}</span>
                  <span>RECORDED: {new Date(req.attachedDiagnostics.createdAt).toLocaleString()}</span>
                </div>
                <pre className="text-[10px] leading-normal font-mono text-indigo-400">
                  {JSON.stringify(req.attachedDiagnostics.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Gallery Proof Image Attachments (From both User & Tech) */}
          <ServiceSummaryGallery userImages={req.userImages} techImages={req.techImages} />

        </div>
      </div>
    </div>
  );
};
