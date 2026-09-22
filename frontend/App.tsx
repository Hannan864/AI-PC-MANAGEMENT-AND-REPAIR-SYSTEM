
import React from 'react';
import { AuthProvider } from './components/Layout/AuthProvider';
import { TelemetryProvider } from './services/telemetryStore';
import RoleRouter from './components/Layout/RoleRouter';
import ReloadPrompt from './components/Common/ReloadPrompt';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TelemetryProvider>
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-indigo-500/30">
          <RoleRouter />
          <ReloadPrompt />
        </div>
      </TelemetryProvider>
    </AuthProvider>
  );
};

export default App;
