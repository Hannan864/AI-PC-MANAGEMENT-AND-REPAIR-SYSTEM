import React, { useState, useEffect } from 'react';
import { RepairRequest, PartUsed, ServiceCompletionReport } from '../../../types';
import { ImageUploader } from '../../Common/ImageUploader';

interface ServiceCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: ServiceCompletionReport, techImages: string[]) => void;
  req: RepairRequest;
}

const EXCHANGE_RATE_PKR = 278; // 1 USD = 278 PKR

export const ServiceCompletionModal: React.FC<ServiceCompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  req,
}) => {
  const [issueSummary, setIssueSummary] = useState('');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [laborCost, setLaborCost] = useState<number>(12500); // standard initial labor charge in PKR
  const [parts, setParts] = useState<PartUsed[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState<number>(0);
  const [newPartQty, setNewPartQty] = useState<number>(1);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(60);
  const [techImages, setTechImages] = useState<string[]>([]);
  const [timeExplanation, setTimeExplanation] = useState('');

  // Auto-calculate time spent from lifecycle history on mount
  useEffect(() => {
    if (isOpen && req) {
      // Find start benchmark (earliest IN_PROGRESS or ACCEPTED or createdAt)
      const logs = req.lifecycleHistory || [];
      const touchLog = logs.find(
        l => l.status === 'IN_PROGRESS' || l.status === 'ACCEPTED'
      );
      
      const startTime = touchLog ? touchLog.timestamp : req.createdAt;
      const endTime = Date.now();
      const diffMs = endTime - startTime;
      const calculatedMins = Math.max(15, Math.round(diffMs / 60000));
      
      // Set values
      setTimeSpentMinutes(calculatedMins);
      
      // Describe the calculation
      const startDateStr = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (touchLog) {
        setTimeExplanation(`Calculated from active milestone shift (IN_PROGRESS/ACCEPTED) at ${startDateStr}.`);
      } else {
        setTimeExplanation(`Calculated from ticket registration benchmark at ${startDateStr}.`);
      }

      // Reset reports fields
      setIssueSummary(req.gigTitle || '');
      setRootCauseAnalysis('');
      setWorkNotes('');
      setLaborCost(12500); // Reset to PKR default
      setParts([]);
      setNewPartName('');
      setNewPartPrice(0);
      setNewPartQty(1);
      setTechImages([]);
    }
  }, [isOpen, req]);

  if (!isOpen) return null;

  // Add Part handler
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    if (newPartPrice < 0 || newPartQty <= 0) return;

    const part: PartUsed = {
      name: newPartName.trim(),
      price: newPartPrice,
      quantity: newPartQty,
    };

    setParts([...parts, part]);
    setNewPartName('');
    setNewPartPrice(0);
    setNewPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, idx) => idx !== index));
  };

  // Sum calculations in PKR
  const partsTotalPKR = parts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const finalTotalPKR = partsTotalPKR + laborCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSummary.trim() || !rootCauseAnalysis.trim() || !workNotes.trim()) {
      alert('Please fill out all required summary text fields.');
      return;
    }

    const report: ServiceCompletionReport = {
      issueSummary: issueSummary.trim(),
      rootCauseAnalysis: rootCauseAnalysis.trim(),
      partsReplaced: parts,
      laborCost: laborCost,
      totalCost: finalTotalPKR,
      workNotes: workNotes.trim(),
      timeSpentMinutes,
      completedAt: Date.now(),
    };

    onSubmit(report, techImages);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-[#0b0f19] border-0 md:border md:border-white/10 md:rounded-2xl w-full h-full md:h-auto md:max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 bg-slate-900/40 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">SLA Repair Completion Layer</span>
            <h3 className="text-lg font-bold text-white leading-none mt-1">Finalize Repair Job & Cost Ledger</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Repair Details Alert */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 text-xs leading-normal">
            <span className="text-amber-400 font-bold shrink-0 text-base">🔧</span>
            <div>
              <p className="text-slate-300">
                You are logging a final handover report for Ticket ID: <strong className="text-white">...{req.id.substring(req.id.length - 6)}</strong> (<span className="text-slate-400 font-mono font-bold">{req.gigTitle}</span>). Checkouts are logged permanently into user service histories and billing logs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Descriptions */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Core Case Diagnostic Reports</h4>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Summary *</label>
                <input
                  type="text"
                  required
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="e.g. Broken storage logic gates, overheat thermal bottleneck"
                  className="w-full bg-slate-950/70 border border-white/5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Root Cause Analysis *</label>
                <textarea
                  required
                  rows={3}
                  value={rootCauseAnalysis}
                  onChange={(e) => setRootCauseAnalysis(e.target.value)}
                  placeholder="Explain exactly what was triggering the symptom/failure..."
                  className="w-full bg-slate-950/70 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Action & Maintenance Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="List the technical procedures and calibration tests successfully conducted..."
                  className="w-full bg-slate-950/70 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                />
              </div>

              {/* Time Spent Field */}
              <div className="space-y-1.5 p-3.5 bg-slate-950/40 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Diagnostic Bench Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={timeSpentMinutes}
                    onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                    className="w-20 bg-slate-950 border border-white/10 rounded px-2 py-0.5 font-mono text-center text-indigo-400 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic leading-snug">{timeExplanation}</p>
              </div>
            </div>

            {/* Right Column: Billing, Parts & Proofs */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Service Cost Ledger & Parts</h4>

              {/* Labor Charges - Now in PKR */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Labor Charges (PKR)</label>
                  <div className="relative w-32">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500 text-xs font-semibold">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={laborCost}
                      onChange={(e) => setLaborCost(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-10 pr-2 py-1 bg-slate-950/70 border border-white/5 rounded-lg text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-500/50 text-right transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Parts Subsystem */}
              <div className="space-y-2 border border-white/5 rounded-xl p-3 bg-slate-950/20">
                <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Assemble Replacement Parts</span>
                
                {/* Micro Input Row */}
                <div className="grid grid-cols-12 gap-1.5 items-end">
                  <div className="col-span-6 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block">Part Description</span>
                    <input
                      type="text"
                      placeholder="e.g. Kingston NVMe, Core Fan"
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-md px-2 py-1 text-[10px] font-medium text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block">Price (PKR)</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Price"
                      value={newPartPrice}
                      onChange={(e) => setNewPartPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-white/5 rounded-md px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50 text-right transition-colors"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block">Qty</span>
                    <input
                      type="number"
                      min={1}
                      value={newPartQty}
                      onChange={(e) => setNewPartQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-white/5 rounded-md px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500/50 text-center transition-colors"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] leading-none text-center inline-flex items-center justify-center w-6 h-6 border border-white/5 shadow-md transition-all duration-200 hover:scale-110"
                      title="Add Part"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Added Parts List */}
                {parts.length > 0 ? (
                  <div className="mt-2 divide-y divide-white/5 max-h-24 overflow-y-auto pr-1">
                    {parts.map((p, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center text-[10.5px]">
                        <div className="truncate pr-2">
                          <span className="text-slate-300 font-semibold">{p.name}</span>
                          <span className="text-slate-500 ml-1 font-mono">({p.quantity}x @ Rs. {p.price.toLocaleString()})</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-slate-200">Rs. {(p.price * p.quantity).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="text-rose-400 hover:text-rose-200 text-[9px] font-bold transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 italic py-1 text-center font-medium">No hardware parts added to report.</p>
                )}
              </div>

              {/* Total Invoice View - Now in PKR */}
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-400/80 block">Aggregated Invoice Total</span>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Labor Charges + Parts Cost</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white block leading-none font-mono">Rs. {finalTotalPKR.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-emerald-400 block font-mono mt-0.5">
                    ≈ ${(finalTotalPKR / EXCHANGE_RATE_PKR).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Image Proof Subsystem */}
              <div className="pt-2">
                <ImageUploader
                  images={techImages}
                  onChange={setTechImages}
                  label="Repair Verification Proof (Optional Photos)"
                  maxCount={3}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl border border-white/5 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all duration-200 tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98]"
            >
              Compile & File Dispatch Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
