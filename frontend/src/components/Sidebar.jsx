import { 
  Activity, 
  Layers, 
  Terminal, 
  ShieldAlert, 
  AlertTriangle,
  Wrench,
  AlertCircle,
  Bell,
  ShieldCheck,
  ChevronLeft,
  Menu
} from 'lucide-react';

export default function Sidebar({ currentView, setView, backendOnline, summary, isCollapsed, setIsCollapsed }) {
  const alertCount = (summary?.criticalDevices || 0) + (summary?.warningDevices || 0);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: '20px' }}>
        {!isCollapsed && (
          <div className="sidebar-logo" style={{ padding: 0 }}>
            <div className="logo-icon">
              <Activity size={20} color="var(--color-primary)" />
            </div>
            <span className="logo-text">PREDICTX</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-secondary"
          style={{ padding: '6px', minWidth: 'auto', display: 'flex' }}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <ul className="sidebar-menu">
        <li 
          className={`menu-item ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
          title="Overview"
        >
          <Layers size={18} />
          {!isCollapsed && <span>overview</span>}
        </li>

        <li 
          className={`menu-item ${currentView === 'alerts' ? 'active' : ''}`}
          onClick={() => setView('alerts')}
          title="Alerts"
        >
          <Bell size={18} />
          {!isCollapsed && <span>alerts</span>}
          {!isCollapsed && alertCount > 0 && (
            <span style={{ 
              marginLeft: 'auto', 
              backgroundColor: 'var(--color-danger)', 
              color: '#fff', 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: 'bold',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {alertCount}
            </span>
          )}
        </li>

        <li 
          className={`menu-item ${currentView === 'devices' ? 'active' : ''}`}
          onClick={() => setView('devices')}
          title="Devices"
        >
          <Activity size={18} />
          {!isCollapsed && <span>devices</span>}
        </li>

        <li 
          className={`menu-item ${currentView === 'predictions' ? 'active' : ''}`}
          onClick={() => setView('predictions')}
          title="Predictions"
        >
          <AlertCircle size={18} />
          {!isCollapsed && <span>predictions</span>}
        </li>

        <li 
          className={`menu-item ${currentView === 'maintenance' ? 'active' : ''}`}
          onClick={() => setView('maintenance')}
          title="Maintenance"
        >
          <Wrench size={18} />
          {!isCollapsed && <span>maintenance</span>}
        </li>

        <li 
          className={`menu-item ${currentView === 'simulator' ? 'active' : ''}`}
          onClick={() => setView('simulator')}
          title="Agent Sim"
        >
          <Terminal size={18} />
          {!isCollapsed && <span>agent sim</span>}
        </li>

        <li 
          className={`menu-item ${currentView === 'health' ? 'active' : ''}`}
          onClick={() => setView('health')}
          title="System Health"
        >
          <ShieldCheck size={18} />
          {!isCollapsed && <span>system health</span>}
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="server-status">
          <div className={`status-dot ${backendOnline ? 'online' : 'offline'}`}></div>
          {!isCollapsed && <span>api: {backendOnline ? 'connected' : 'disconnected'}</span>}
        </div>
      </div>
    </aside>
  );
}
