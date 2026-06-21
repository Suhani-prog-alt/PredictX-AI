import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Activity,
  Cpu,
  HardDrive,
  Battery,
  Wind
} from 'lucide-react';

export default function Alerts({ devices, setView, setSelectedDeviceId }) {
  
  // Helper to map component names to icons
  const getComponentIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('thermal') || n.includes('cpu')) return <Cpu size={16} />;
    if (n.includes('storage') || n.includes('disk')) return <HardDrive size={16} />;
    if (n.includes('power') || n.includes('battery')) return <Battery size={16} />;
    if (n.includes('cooling') || n.includes('fan')) return <Wind size={16} />;
    return <Activity size={16} />;
  };

  // Helper for failure window
  const getFailureWindow = (prob) => {
    if (prob >= 85) return '1-3 days';
    if (prob >= 70) return '3-5 days';
    if (prob >= 40) return '7-14 days';
    return '>14 days';
  };

  const activeDevices = devices || [];

  // Process devices into alerts
  const criticalAlerts = activeDevices.filter(d => d.latestPrediction?.riskLevel === 'critical').map(d => ({
    type: 'critical',
    deviceId: d.deviceId,
    deviceName: d.orgAssignedId ? `${d.orgAssignedId} (${d.originalHostname?.toLowerCase()})` : (d.hostname || d.deviceId),
    component: d.latestPrediction.predictedComponent,
    score: d.latestPrediction.failureProbability,
    window: getFailureWindow(d.latestPrediction.failureProbability),
    action: 'Emergency Hardware Swap',
    details: d.latestPrediction.rootCause
  }));

  const warningAlerts = activeDevices.filter(d => d.latestPrediction?.riskLevel === 'warning').map(d => ({
    type: 'warning',
    deviceId: d.deviceId,
    deviceName: d.orgAssignedId ? `${d.orgAssignedId} (${d.originalHostname?.toLowerCase()})` : (d.hostname || d.deviceId),
    component: d.latestPrediction.predictedComponent,
    score: d.latestPrediction.failureProbability,
    window: getFailureWindow(d.latestPrediction.failureProbability),
    action: 'Schedule Maintenance',
    details: d.latestPrediction.rootCause
  }));

  // Info alerts for generally healthy but registered devices
  const infoAlerts = activeDevices.filter(d => d.latestPrediction?.riskLevel === 'low' || !d.latestPrediction).map(d => ({
    type: 'info',
    deviceId: d.deviceId,
    deviceName: d.orgAssignedId ? `${d.orgAssignedId} (${d.originalHostname?.toLowerCase()})` : (d.hostname || d.deviceId),
    component: 'System Health',
    score: d.latestPrediction?.failureProbability || 5,
    window: 'Nominal',
    action: 'View Telemetry',
    details: 'Device operating within normal parameters.'
  }));

  const anomalyAlerts = activeDevices.filter(d => d.latestPrediction?.anomalyAlert).map(d => ({
    type: 'warning',
    deviceId: d.deviceId,
    deviceName: d.orgAssignedId ? `${d.orgAssignedId} (${d.originalHostname?.toLowerCase()})` : (d.hostname || d.deviceId),
    component: 'Anomaly Detector',
    score: Math.round((d.latestPrediction.anomalyScore || 0) * 100),
    window: 'Immediate Review',
    action: 'View Telemetry',
    details: `Unknown Failure Pattern Detected (Isolation Forest Anomaly Score: ${d.latestPrediction.anomalyScore})`
  }));

  const allAlerts = [...criticalAlerts, ...anomalyAlerts, ...warningAlerts, ...infoAlerts.slice(0, 5)];

  const handleAction = (action, deviceId) => {
    if (action === 'Schedule Maintenance' || action === 'Emergency Hardware Swap') {
      setView('maintenance');
    } else {
      setSelectedDeviceId(deviceId);
    }
  };

  return (
    <div className="content-view">
      <div className="alerts-page-header" style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'lowercase' }}>
          Categorized system events and ML-predicted hardware failure warnings requiring attention.
        </p>
      </div>

      <div className="alerts-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {allAlerts.length > 0 ? (
          allAlerts.sort((a,b) => {
            const priority = { critical: 0, warning: 1, info: 2 };
            return priority[a.type] - priority[b.type];
          }).map((alert, idx) => (
            <div key={`${alert.deviceId}-${idx}`} className={`alert-full-card ${alert.type}`}>
              <div className="alert-icon-side">
                {alert.type === 'critical' ? <ShieldAlert size={24} /> : 
                 alert.type === 'warning' ? <AlertTriangle size={24} /> : 
                 <Info size={24} />}
              </div>

              <div className="alert-main-content">
                <div className="alert-row-top">
                  <div className="alert-device-name">
                    <span className="tiny-label">host</span>
                    {alert.deviceName}
                  </div>
                  <div className={`alert-tier-badge ${alert.type}`}>
                    {alert.type}
                  </div>
                </div>

                <div className="alert-row-mid">
                  <div className="alert-meta-item">
                    <div className="meta-icon">{getComponentIcon(alert.component)}</div>
                    <div className="meta-text">
                      <span className="tiny-label">component affected</span>
                      {alert.component}
                    </div>
                  </div>

                  <div className="alert-meta-item">
                    <div className="meta-icon"><Activity size={16} /></div>
                    <div className="meta-text">
                      <span className="tiny-label">risk score</span>
                      <span style={{ fontWeight: 700 }}>{alert.score}%</span>
                    </div>
                  </div>

                  <div className="alert-meta-item">
                    <div className="meta-icon"><ArrowRight size={16} /></div>
                    <div className="meta-text">
                      <span className="tiny-label">failure window</span>
                      {alert.window}
                    </div>
                  </div>
                </div>

                <div className="alert-details-text">
                  {alert.details}
                </div>
              </div>

              <div className="alert-action-side">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <button 
                    className={`btn ${alert.type === 'info' ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
                    onClick={() => handleAction(alert.action, alert.deviceId)}
                  >
                    {alert.action}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '8px 20px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedDeviceId(alert.deviceId)}
                  >
                    View Device
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card empty-state" style={{ padding: '80px 0' }}>
            <ShieldAlert size={48} />
            <h3>No active system alerts</h3>
            <p>All monitored devices are currently reporting nominal status.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .alert-full-card {
          display: flex;
          background: var(--bg-surface-glass);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition-fast);
          min-height: 120px;
          animation: slideIn 0.3s ease-out backwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-full-card:hover {
          border-color: var(--border-color-hover);
          background: var(--bg-surface-hover);
          transform: translateX(4px);
        }

        .alert-full-card.critical { border-left: 4px solid var(--color-danger); }
        .alert-full-card.warning { border-left: 4px solid var(--color-warning); }
        .alert-full-card.info { border-left: 4px solid var(--color-info); }

        .alert-icon-side {
          width: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.01);
        }

        .critical .alert-icon-side { color: var(--color-danger); }
        .warning .alert-icon-side { color: var(--color-warning); }
        .info .alert-icon-side { color: var(--color-info); }

        .alert-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-row-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .alert-device-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        .tiny-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .alert-tier-badge {
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .alert-tier-badge.critical { background: var(--color-danger-glow); color: var(--color-danger); }
        .alert-tier-badge.warning { background: var(--color-warning-glow); color: var(--color-warning); }
        .alert-tier-badge.info { background: var(--color-info-glow); color: var(--color-info); }

        .alert-row-mid {
          display: flex;
          gap: 40px;
          flex-wrap: wrap;
        }

        .alert-meta-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .meta-icon {
          color: var(--text-secondary);
        }

        .meta-text {
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
          color: #fff;
        }

        .alert-details-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          text-transform: lowercase;
        }

        .alert-action-side {
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.1);
        }
      `}} />
    </div>
  );
}
