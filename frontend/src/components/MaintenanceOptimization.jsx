import React, { useState } from 'react';
import { Calendar, Clock, Wrench, CheckCircle, AlertTriangle, ShieldCheck, Play, Save, Activity } from 'lucide-react';

export default function MaintenanceOptimization({ devices }) {
  // Configuration for Maintenance Windows
  const [windowDay, setWindowDay] = useState('Sunday');
  const [windowTime, setWindowTime] = useState('02:00');
  const [windowDuration, setWindowDuration] = useState('4'); // 4 hours
  const [isSaved, setIsSaved] = useState(false);

  // Mock historical logs
  const [logs, setLogs] = useState([
    {
      id: 'log-1',
      deviceId: 'dev-101',
      hostname: 'WS-DELL-PRO',
      component: 'CPU Fan',
      action: 'Replaced failing cooling fan & reapplied thermal paste.',
      technician: 'Sarah Connor (Senior Hardware Eng.)',
      date: '2026-06-10',
      status: 'success'
    },
    {
      id: 'log-2',
      deviceId: 'dev-102',
      hostname: 'MAC-BOOK-M3',
      component: 'Battery',
      action: 'Replaced battery pack (health was 38%). Run diagnostic cycle.',
      technician: 'John Doe (Lead Diagnostics Eng.)',
      date: '2026-06-15',
      status: 'success'
    },
    {
      id: 'log-3',
      deviceId: 'dev-103',
      hostname: 'THINKPAD-X1',
      component: 'SSD Disk',
      action: 'System files migration to new NVMe SSD drive.',
      technician: 'Automated System Optimizer',
      date: '2026-06-18',
      status: 'success'
    }
  ]);

  const saveConfiguration = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Automated Scheduler Logic
  // Filter devices that need repair (warning or critical risk level)
  const devicesNeedingMaintenance = devices
    ? devices.filter(d => d.latestPrediction && (d.latestPrediction.riskLevel === 'critical' || d.latestPrediction.riskLevel === 'warning'))
    : [];

  // Sort them so Critical is scheduled before Warning
  const sortedMaintenanceQueue = [...devicesNeedingMaintenance].sort((a, b) => {
    const riskA = a.latestPrediction.riskLevel;
    const riskB = b.latestPrediction.riskLevel;
    if (riskA === 'critical' && riskB !== 'critical') return -1;
    if (riskA !== 'critical' && riskB === 'critical') return 1;
    return b.latestPrediction.failureProbability - a.latestPrediction.failureProbability;
  });

  // Calculate scheduled slots
  const getScheduledSlots = () => {
    let currentHour = parseInt(windowTime.split(':')[0]);
    let currentMinute = parseInt(windowTime.split(':')[1]);

    return sortedMaintenanceQueue.map((device, index) => {
      const isCritical = device.latestPrediction.riskLevel === 'critical';
      const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      // Increment slot by 45 minutes for next device
      currentMinute += 45;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }

      return {
        deviceId: device.deviceId,
        hostname: device.hostname,
        component: device.latestPrediction.predictedComponent,
        riskLevel: device.latestPrediction.riskLevel,
        probability: device.latestPrediction.failureProbability,
        scheduledDay: `Next ${windowDay}`,
        scheduledTime: slotTime,
        priority: isCritical ? 'CRITICAL (Tier-1)' : 'NORMAL (Tier-2)',
        duration: '45 mins'
      };
    });
  };

  const scheduledTasks = getScheduledSlots();

  return (
    <div className="content-view">
      {/* NEW: Business Impact Section */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', textTransform: 'lowercase' }}>business impact analysis</h2>
      </div>

      <div className="metrics-grid">
        <div className="glass-card metric-card success">
          <div className="metric-header">
            <span className="metric-label">est. downtime avoided</span>
            <div className="metric-icon">
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value">
            {String(scheduledTasks.length * 12 + logs.length * 8)}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>h</span>
          </div>
        </div>

        <div className="glass-card metric-card primary">
          <div className="metric-header">
            <span className="metric-label">mttr reduction</span>
            <div className="metric-icon">
              <Activity size={16} />
            </div>
          </div>
          <div className="metric-value">
            28.4<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>%</span>
          </div>
        </div>

        <div className="glass-card metric-card warning">
          <div className="metric-header">
            <span className="metric-label">data loss prevented</span>
            <div className="metric-icon">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="metric-value">
            {String(scheduledTasks.filter(t => t.component.toLowerCase().includes('disk') || t.component.toLowerCase().includes('storage')).length + 2).padStart(3, '0')}
          </div>
        </div>

        <div className="glass-card metric-card success">
          <div className="metric-header">
            <span className="metric-label">est. cost savings</span>
            <div className="metric-icon">
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>$</span>
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {(scheduledTasks.length * 450 + logs.length * 300).toLocaleString()}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}></span>
          </div>
        </div>
      </div>

      {/* Existing technical stats (optional, but keeping it small) */}
      <div className="section-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
         <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>operational metrics</h3>
         <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }}></div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
        <div style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '15px' }} className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>scheduled</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{scheduledTasks.length} units</div>
        </div>
        <div style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '15px' }} className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>audits</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{logs.length} completed</div>
        </div>
        <div style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '15px' }} className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>window</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{windowDuration}h/wk</div>
        </div>
        <div style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '15px' }} className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>urgency</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-danger)' }}>{scheduledTasks.filter(t => t.riskLevel === 'critical').length} p1</div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left Side: Scheduling Config and Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Config form */}
          <div className="glass-card">
            <div className="chart-header">
              <h2>maintenance window config</h2>
              <Clock size={18} color="var(--text-secondary)" />
            </div>
            <form onSubmit={saveConfiguration} style={{ marginTop: '16px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>maintenance day</label>
                  <select value={windowDay} onChange={(e) => setWindowDay(e.target.value)}>
                    <option value="Monday">monday</option>
                    <option value="Wednesday">wednesday</option>
                    <option value="Friday">friday</option>
                    <option value="Saturday">saturday</option>
                    <option value="Sunday">sunday</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>start time (24h)</label>
                  <input 
                    type="time" 
                    value={windowTime} 
                    onChange={(e) => setWindowTime(e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>duration limit (hours)</label>
                  <input 
                    type="number" min="1" max="12"
                    value={windowDuration} 
                    onChange={(e) => setWindowDuration(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '40px' }}>
                    {isSaved ? <span style={{ color: 'var(--color-success)' }}>✓ settings saved</span> : <><Save size={16} /> save settings</>}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Scheduled repairs queue */}
          <div className="glass-card">
            <div className="chart-header">
              <h2>automated scheduling queue</h2>
              <Wrench size={18} color="var(--color-primary)" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'lowercase' }}>
              algorithm automatically schedules repairs for warning/critical devices during the next maintenance window. critical risk items are automatically scheduled first.
            </p>

            {scheduledTasks.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>device / hostname</th>
                      <th>repair item</th>
                      <th>priority</th>
                      <th>window slot</th>
                      <th>estimated time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledTasks.map(task => (
                      <tr key={task.deviceId}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{task.hostname}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>id: {task.deviceId}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600, textTransform: 'lowercase' }}>{task.component.toLowerCase()}</span> repair
                        </td>
                        <td>
                          <span className={`badge ${task.riskLevel}`} style={{ padding: '2px 8px', fontSize: '0.7rem', textTransform: 'lowercase' }}>
                            {task.priority.toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#fff', textTransform: 'lowercase' }}>
                            <Calendar size={12} color="var(--color-primary)" />
                            next {windowDay.toLowerCase()} at {task.scheduledTime}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{task.duration}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle size={36} color="var(--color-success)" />
                <h3 style={{ marginTop: '12px', textTransform: 'lowercase' }}>maintenance queue is empty</h3>
                <p style={{ fontSize: '0.85rem', textTransform: 'lowercase' }}>all registered devices are running smoothly. no hardware issues detected!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Maintenance Audit Log Trail */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <h2>completed maintenance log</h2>
            <CheckCircle size={18} color="var(--color-success)" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', maxHeight: '560px' }}>
            {logs.map(log => (
              <div key={log.id} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                    {log.hostname}
                  </h4>
                  <span className="badge low" style={{ fontSize: '0.65rem', textTransform: 'lowercase' }}>resolved</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>
                  <strong>repaired component:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{log.component.toLowerCase()}</span>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'lowercase' }}>
                  {log.action.toLowerCase()}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', textTransform: 'lowercase' }}>
                  <span>tech: {log.technician.toLowerCase()}</span>
                  <span>date: {log.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
