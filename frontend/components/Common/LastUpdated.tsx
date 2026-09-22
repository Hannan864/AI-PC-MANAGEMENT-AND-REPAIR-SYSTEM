
import React from 'react';

interface LastUpdatedProps {
  timestamp: number;
  isRefreshing?: boolean;
  className?: string;
}

function formatAgo(ts: number): string {
  if (ts === 0) return 'Never';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const LastUpdated: React.FC<LastUpdatedProps> = ({ timestamp, isRefreshing = false, className = '' }) => {
  const [text, setText] = React.useState(formatAgo(timestamp));

  React.useEffect(() => {
    setText(formatAgo(timestamp));
    const interval = setInterval(() => setText(formatAgo(timestamp)), 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className={`flex items-center gap-2 text-[10px] text-slate-500 font-mono ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
      <span>{isRefreshing ? 'Updating...' : text}</span>
    </div>
  );
};

export default LastUpdated;
