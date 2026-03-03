import { useEffect, useCallback, useState } from 'react';
import { useUIStore } from './stores/ui-store';
import { useSettingsStore } from './stores/settings-store';
import AppLayout from './components/layout/AppLayout';
import Disclaimer from './components/shared/Disclaimer';
import ImportView from './views/import/ImportView';
import DashboardView from './views/dashboard/DashboardView';
import NoShowsView from './views/no-shows/NoShowsView';
import UtilizationView from './views/utilization/UtilizationView';
import ServicesView from './views/services/ServicesView';
import AIInsightsView from './views/ai-insights/AIInsightsView';
import SettingsView from './views/settings/SettingsView';
import './styles/globals.css';

function ViewRouter() {
  const activeView = useUIStore((s) => s.activeView);

  switch (activeView) {
    case 'import':
      return <ImportView />;
    case 'dashboard':
      return <DashboardView />;
    case 'no-shows':
      return <NoShowsView />;
    case 'utilization':
      return <UtilizationView />;
    case 'services':
      return <ServicesView />;
    case 'ai-insights':
      return <AIInsightsView />;
    case 'settings':
      return <SettingsView />;
  }
}

export default function App() {
  const { loaded, load, disclaimerAccepted } = useSettingsStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!loaded) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--text-muted)',
        }}
      >
        Loading...
      </div>
    );
  }

  const showDisclaimer = !disclaimerAccepted && !dismissed;

  return (
    <>
      {showDisclaimer && <Disclaimer onAccept={handleAccept} />}
      <AppLayout>
        <ViewRouter />
      </AppLayout>
    </>
  );
}
