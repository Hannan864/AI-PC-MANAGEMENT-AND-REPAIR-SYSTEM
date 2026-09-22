
import React, { useEffect, useState } from 'react';

/**
 * ReloadPrompt — PWA update notification.
 * Detects when a new service worker is waiting and prompts the user to reload.
 * Falls back gracefully if PWA registration is unavailable.
 */
const ReloadPrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedRefresh(true);
            }
            if (newWorker.state === 'activated') {
              setOfflineReady(true);
            }
          });
        });
      }).catch(() => {
        // Service worker not available
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {needRefresh && (
        <div className="glass p-4 rounded-2xl border border-white/10 shadow-2xl max-w-sm">
          <p className="text-sm font-bold text-slate-200 mb-2">New content available</p>
          <p className="text-xs text-slate-400 mb-3">Click reload to get the latest version.</p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xs transition-all"
            >
              Reload
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-xs transition-all text-slate-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {offlineReady && !needRefresh && (
        <div className="glass p-4 rounded-2xl border border-white/10 shadow-2xl max-w-sm">
          <p className="text-sm font-bold text-emerald-400 mb-1">Ready for offline use</p>
          <p className="text-xs text-slate-400">Application is cached and available offline.</p>
          <button
            onClick={() => setOfflineReady(false)}
            className="mt-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-500 transition-all"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default ReloadPrompt;
