import React, { useState } from 'react';
import { Calendar, Clock, Wrench, CheckCircle, AlertTriangle, ShieldCheck, Play, Save, Activity } from 'lucide-react';

export default function MaintenanceOptimization({ devices }) {
  // Configuration for Maintenance Windows
  const [windowDay, setWindowDay] = useState(localStorage.getItem('maint_day') || 'Sunday');
  const [windowTime, setWindowTime] = useState(localStorage.getItem('maint_time') || '02:00');
  const [windowDuration, setWindowDuration] = useState(localStorage.getItem('maint_duration') || '4');
  const [isSaved, setIsSaved] = useState(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState(localStorage.getItem('maint_auto') !== 'false');
  const [executingTaskId, setExecutingTaskId] = useState(null);

  // Mock historical logs
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('maint_logs');
    if (savedLogs) return JSON.parse(savedLogs);
    return [
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
    ];
  });

  const saveConfiguration = (e) => {
    e.preventDefault();
    localStorage.setItem('maint_day', windowDay);
    localStorage.setItem('maint_time', windowTime);
    localStorage.setItem('maint_duration', windowDuration);
    localStorage.setItem('maint_auto', isAutoEnabled);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Automated Scheduler Logic
  // Filter devices that need repair (warning or critical risk level) AND haven't been "fixed" yet
  // We use logs to simulate fixing. If a device has a log entry today, we consider it fixed temporarily for the demo
  
  const demoDevices = [
    {
      deviceId: 'demo-storage-01',
      hostname: 'DB-CLUSTER-NODE4',
      latestPrediction: { riskLevel: 'critical', predictedComponent: 'NVMe SSD', failureProbability: 92, healthScore: 8 }
    },
    {
      deviceId: 'demo-cooling-02',
      hostname: 'RENDER-FARM-B1',
      latestPrediction: { riskLevel: 'warning', predictedComponent: 'GPU Cooling Fan', failureProbability: 76, healthScore: 24 }
    },
    {
      deviceId: 'demo-power-03',
      hostname: 'EXEC-LAPTOP-M2',
      latestPrediction: { riskLevel: 'warning', predictedComponent: 'Battery Cell 3', failureProbability: 64, healthScore: 36 }
    }
  ];

  const combinedDevices = [...(devices || []), ...demoDevices];

  const devicesNeedingMaintenance = combinedDevices.filter(d => {
        if (!d.latestPrediction || (d.latestPrediction.riskLevel !== 'critical' && d.latestPrediction.riskLevel !== 'warning')) return false;
        // Check if we just simulated fixing this device
        const isFixed = logs.some(log => log.deviceId === d.deviceId && log.id.startsWith('sim-'));
        return !isFixed;
      });

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
      
      const comp = (device.latestPrediction.predictedComponent || '').toLowerCase();
      let durationMins = 45;
      let durationStr = '45 mins';
      
      if (comp.includes('ssd') || comp.includes('disk') || comp.includes('storage')) {
        durationMins = 90;
        durationStr = '1h 30m';
      } else if (comp.includes('battery') || comp.includes('power')) {
        durationMins = 30;
        durationStr = '30 mins';
      } else if (comp.includes('fan') || comp.includes('cooling')) {
        durationMins = 45;
        durationStr = '45 mins';
      } else {
        durationMins = 60;
        durationStr = '1h 00m';
      }
      
      // Increment slot by duration for next device
      currentMinute += durationMins;
      while (currentMinute >= 60) {
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
        duration: durationStr
      };
    });
  };

  const scheduledTasks = isAutoEnabled ? getScheduledSlots() : [];

  // Simulate executing a scheduled task
  const executeMaintenance = (task) => {
    if (executingTaskId) return; // Prevent multiple clicks
    setExecutingTaskId(task.deviceId);

    // Simulate real-world mitigation delay (permissions, data backup, dispatch)
    setTimeout(() => {
      const isStorage = task.component?.toLowerCase().includes('disk') || task.component?.toLowerCase().includes('ssd') || task.component?.toLowerCase().includes('storage');
      
      const actionText = isStorage 
        ? `Automated emergency data backup completed. Maintenance ticket dispatched to IT team for physical ${task.component} replacement.`
        : `Automated power/thermal throttle applied to prevent failure. Hardware ticket dispatched to IT for physical ${task.component} replacement.`;

      const newLog = {
        id: `sim-${Date.now()}`,
        deviceId: task.deviceId,
        hostname: task.hostname,
        component: task.component,
        action: actionText,
        technician: 'PredictX Auto-Scheduler (Level 1)',
        date: new Date().toISOString().split('T')[0],
        status: 'success'
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('maint_logs', JSON.stringify(updatedLogs));
      setExecutingTaskId(null);
    }, 2500); // 2.5 second simulated processing delay
  };

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
                    <option value="Tuesday">tuesday</option>
                    <option value="Wednesday">wednesday</option>
                    <option value="Thursday">thursday</option>
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
              
              <div className="form-row" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isAutoEnabled} 
                      onChange={(e) => setIsAutoEnabled(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} 
                    />
                    <span style={{ color: '#fff', fontWeight: 600 }}>Enable Auto-Scheduling for Critical/High Risks</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                    When devices hit a {'>'}70% failure probability, an automated ticket is generated for repair within the 7-30 day window.
                  </p>
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
                      <th>action</th>
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
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600, textTransform: 'lowercase' }}>{task.component?.toLowerCase() || 'system'}</span> repair
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
                        <td>
                          <button 
                            onClick={() => executeMaintenance(task)}
                            disabled={executingTaskId !== null}
                            style={{ 
                              background: executingTaskId === task.deviceId ? 'var(--color-warning)' : 'var(--color-success)', 
                              border: 'none', 
                              color: '#000', 
                              padding: '4px 10px', 
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: executingTaskId !== null ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: executingTaskId !== null && executingTaskId !== task.deviceId ? 0.4 : 1
                            }}
                          >
                            {executingTaskId === task.deviceId ? (
                              <>
                                <Activity size={12} /> resolving...
                              </>
                            ) : (
                              <>
                                <Play size={12} /> execute
                              </>
                            )}
                          </button>
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
