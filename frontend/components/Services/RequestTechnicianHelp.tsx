import React, { useState } from 'react';
import { useAuth } from '../Layout/AuthProvider';
import { DiagnosticSnapshot, Gig } from '../../types';
import { Icons } from '../../constants';
import { analyzeSnapshot, findBestGig } from '../../services/routingEngine';
import { gigApi } from '../../services/gigApi';
import { repairApi } from '../../services/repairApi';

const mapGig = (g: any): Gig => ({
  id: g.id,
  technicianId: g.technicianId,
  technicianName: g.technicianName,
  title: g.title,
  description: g.description,
  category: g.category,
  price: g.price,
  estimatedTime: g.estimatedTime,
  isAvailable: g.isAvailable,
  createdAt: new Date(g.createdAt).getTime(),
});

interface Props {
  moduleName: string;
  getSnapshot: () => any;
}

export const RequestTechnicianHelp: React.FC<Props> = ({ moduleName, getSnapshot }) => {
  const { session, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [suggestedGig, setSuggestedGig] = useState<Gig | null>(null);
  
  const [allGigs, setAllGigs] = useState<Gig[]>([]);
  const [selectedGigId, setSelectedGigId] = useState<string>('');
  const [isOverridden, setIsOverridden] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    const snapshotData = getSnapshot();
    const tempSnapshot: DiagnosticSnapshot = {
      id: `diag_temp`,
      sourceModule: moduleName,
      data: snapshotData,
      createdAt: Date.now()
    };
    
    const analysis = analyzeSnapshot(tempSnapshot);
    setAnalysisResult(analysis);
    
    const gig = await findBestGig(analysis.recommendedGigType);
    setSuggestedGig(gig);
    if (gig) {
       setSelectedGigId(gig.id);
    }
    
    const fetchedGigs = await gigApi.list();
    setAllGigs(fetchedGigs.filter(g => g.isAvailable).map(mapGig));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.userId || !user) {
      alert('You must be logged in to request help.');
      return;
    }

    setIsSubmitting(true);
    const snapshotData = getSnapshot();
    
    const snapshot: DiagnosticSnapshot = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sourceModule: moduleName,
      data: snapshotData,
      createdAt: Date.now()
    };

    const analysis = analysisResult || analyzeSnapshot(snapshot);
    const matchedGig = allGigs.find(g => g.id === selectedGigId) || suggestedGig;

    await repairApi.create({
      gig_title: matchedGig?.title,
      issue_category: analysis.issueCategory,
      issue_description: description || `Automated request from ${moduleName} module.`,
      severity_level: analysis.severityLevel.toLowerCase() as 'low' | 'medium' | 'high',
      system_specifications: snapshot.data,
    });
    
    setIsSubmitting(false);
    setIsOpen(false);
    setDescription('');
    setIsOverridden(false);
    alert('Technician request submitted!');
  };

  if (!user) return null;

  return (
    <>
      <button 
        onClick={handleOpen}
        className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span className="w-4 h-4">{Icons.briefcase}</span>
        Request Technician Help
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="w-full h-full md:h-auto md:max-w-lg glass md:rounded-2xl border-0 md:border md:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-indigo-500/5 shrink-0">
              <h3 className="text-lg font-semibold text-white">Review Smart Request</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                {Icons.close}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="bg-[#020617]/50 rounded-xl p-4 border border-indigo-500/20 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  AI Suggested Plan
                </div>
                
                {analysisResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detected Issue</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {analysisResult.issueCategory}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Severity</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                        ${analysisResult.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                          analysisResult.severityLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}
                      `}>
                        {analysisResult.severityLevel} ({analysisResult.severityScore}/100)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnostis Prepared</div>
                       <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mono">
                         [ {moduleName} Snapshot Active ]
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Service Selection</div>
                 <div className="bg-[#020617] border border-white/10 rounded-lg p-3">
                     {!isOverridden ? (
                        <div className="flex items-center justify-between border border-emerald-500/30 bg-emerald-500/5 p-3 rounded flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              {Icons.star} Auto-Matched Gig
                            </div>
                            <div className="text-sm font-medium text-white">{suggestedGig?.title || 'General Pool'}</div>
                            {suggestedGig && (
                              <div className="text-xs text-slate-400 mt-0.5">Technician: {suggestedGig.technicianName} • PKR {suggestedGig.price}</div>
                            )}
                          </div>
                          <button type="button" onClick={() => setIsOverridden(true)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium text-slate-300 w-full md:w-auto">
                            Change Gig
                          </button>
                        </div>
                     ) : (
                       <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                             <div className="text-sm text-slate-300">Choose a Gig manually:</div>
                             <button type="button" onClick={() => { setIsOverridden(false); setSelectedGigId(suggestedGig?.id || ''); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Reset to AI</button>
                          </div>
                          <select 
                            value={selectedGigId}
                            onChange={(e) => setSelectedGigId(e.target.value)}
                            className="w-full bg-slate-900 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                          >
                             <option value="">- Any Technician (General Pool) -</option>
                             {allGigs.map(gig => (
                               <option key={gig.id} value={gig.id}>{gig.title} (by {gig.technicianName} • PKR {gig.price})</option>
                             ))}
                          </select>
                       </div>
                     )}
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Issue Description & Note</label>
                 <textarea 
                   value={description} 
                   onChange={(e) => setDescription(e.target.value)} 
                   rows={3} 
                   placeholder="Describe what happened or any human context..." 
                   className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-vertical text-sm"
                 ></textarea>
              </div>
              
              <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-colors text-sm">
                   Cancel Request
                 </button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
                   {isSubmitting ? 'Submitting...' : 'Submit Final Plan'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
