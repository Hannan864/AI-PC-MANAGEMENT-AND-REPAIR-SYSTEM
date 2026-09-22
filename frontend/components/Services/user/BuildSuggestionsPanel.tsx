import React from 'react';
import { Icons } from '../../../constants';

interface Suggestion {
  partType: string;
  currentId: string;
  currentName: string;
  suggestedId: string;
  suggestedName: string;
  reason: string;
}

interface BuildSuggestionsPanelProps {
  suggestions: Suggestion[];
}

export const BuildSuggestionsPanel: React.FC<BuildSuggestionsPanelProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div id="apcie-suggestions-panel" className="p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-indigo-400">
        <span>{Icons.sparkles}</span>
        <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Automated Compatibility Swaps (APCIE Suggestions)</h4>
      </div>
      <div className="divide-y divide-white/5 space-y-2 text-xs">
        {suggestions.map((sug, i) => (
          <div key={i} className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 block font-semibold">{sug.partType} Advice:</span>
              <span className="text-rose-400 line-through mr-2">{sug.currentName}</span>
              <span className="text-emerald-400 font-bold">➔ {sug.suggestedName}</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm font-mono leading-relaxed">{sug.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
