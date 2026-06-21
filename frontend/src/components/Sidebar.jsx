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
  Menu,
  Building,
  LogOut,
  BrainCircuit,
  HelpCircle,
  Server
} from 'lucide-react';

export default function Sidebar({ currentView, setView, backendOnline, summary, isCollapsed, setIsCollapsed, onLogout, activeOrgName }) {
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
        
        {/* DASHBOARD SECTION */}
        {!isCollapsed && <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 20px 8px 20px' }}>Dashboard</div>}
        <li 
          className={`menu-item ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
          title="Overview"
        >
          <Layers size={18} />
          {!isCollapsed && <span>overview</span>}
        </li>

        {/* OPERATIONS SECTION */}
        {!isCollapsed && <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 20px 8px 20px' }}>Operations</div>}
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
          className={`menu-item ${currentView === 'maintenance' ? 'active' : ''}`}
          onClick={() => setView('maintenance')}
          title="Maintenance"
        >
          <Wrench size={18} />
          {!isCollapsed && <span>maintenance</span>}
        </li>

        {/* INTELLIGENCE SECTION */}
        {!isCollapsed && <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 20px 8px 20px' }}>Intelligence</div>}
        <li 
          className={`menu-item ${currentView === 'predictions' ? 'active' : ''}`}
          onClick={() => setView('predictions')}
          title="Predictions"
        >
          <AlertCircle size={18} />
          {!isCollapsed && <span>predictions</span>}
        </li>
        <li 
          className={`menu-item ${currentView === 'model' ? 'active' : ''}`}
          onClick={() => setView('model')}
          title="MLOps & Training"
        >
          <BrainCircuit size={18} />
          {!isCollapsed && <span>ml ops</span>}
        </li>
        <li 
          className={`menu-item ${currentView === 'vendor' ? 'active' : ''}`}
          onClick={() => setView('vendor')}
          title="Vendor Integration"
        >
          <Server size={18} />
          {!isCollapsed && <span>vendor info</span>}
        </li>

        {/* SYSTEM SECTION */}
        {!isCollapsed && <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 20px 8px 20px' }}>System</div>}
        <li 
          className={`menu-item ${currentView === 'health' ? 'active' : ''}`}
          onClick={() => setView('health')}
          title="System Health"
        >
          <ShieldCheck size={18} />
          {!isCollapsed && <span>system health</span>}
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
          className={`menu-item ${currentView === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setView('diagnostics')}
          title="Diagnostics & Help"
        >
          <HelpCircle size={18} />
          {!isCollapsed && <span>diagnostics & help</span>}
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="server-status" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={14} color="var(--color-primary)" />
          {!isCollapsed && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeOrgName}
            </span>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px',
            background: 'rgba(240, 74, 74, 0.1)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s'
          }}
          title="Log Out"
        >
          <LogOut size={16} />
          {!isCollapsed && <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>log_out</span>}
        </button>
      </div>
    </aside>
  );
}
