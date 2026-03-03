import { useUIStore, type ViewId } from '../../stores/ui-store';
import { useDataStore } from '../../stores/data-store';

interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
  requiresData: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'import', label: 'Import', icon: '📂', requiresData: false },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', requiresData: true },
  { id: 'no-shows', label: 'No-Shows', icon: '🚫', requiresData: true },
  { id: 'utilization', label: 'Utilization', icon: '🗓', requiresData: true },
  { id: 'services', label: 'Services', icon: '💇', requiresData: true },
  { id: 'ai-insights', label: 'AI Insights', icon: '🤖', requiresData: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', requiresData: false },
];

export default function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar } = useUIStore();
  const importStatus = useDataStore((s) => s.importStatus);
  const hasData = importStatus === 'ready';

  return (
    <nav
      style={{
        width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: sidebarCollapsed ? '16px 8px' : '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: '56px',
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            color: 'var(--text-secondary)',
            fontSize: '18px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
          }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '☰' : '◀'}
        </button>
        {!sidebarCollapsed && (
          <span style={{ fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap' }}>
            Chair Pulse
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflow: 'auto',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const disabled = item.requiresData && !hasData;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !disabled && setActiveView(item.id)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: sidebarCollapsed ? '10px 0' : '10px 12px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: active ? 'var(--accent-muted)' : 'transparent',
                color: disabled
                  ? 'var(--text-muted)'
                  : active
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.15s, color 0.15s',
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </button>
          );
        })}
      </div>

      {/* CTA bottom */}
      {!sidebarCollapsed && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <a
            href="https://wearedouro.agency"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '8px 10px',
              background: 'var(--accent-muted)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              color: 'var(--accent)',
              textDecoration: 'none',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            Want this automated?
            <br />
            <span style={{ fontWeight: 600 }}>wearedouro.agency</span>
          </a>
        </div>
      )}
    </nav>
  );
}
