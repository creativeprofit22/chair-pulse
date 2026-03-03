import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            background: 'var(--bg-primary)',
          }}
        >
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
