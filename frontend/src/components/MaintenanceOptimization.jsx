import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Wrench, CheckCircle, ShieldCheck, Play, Save, Activity, HelpCircle, IndianRupee, PieChart, Wallet } from 'lucide-react';

/** Format amounts in Indian locale (₹) */
const formatINR = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

/**
 * Demo cost-optimization formulas derived from current maintenance queue & audit logs.
 * Repair Cost Saved + Downtime Cost Saved − Preventive Maintenance Cost
 */
function computeCostOptimization({ scheduledTasks, logs, fleetSize }) {
  const downtimeHoursAvoided = scheduledTasks.length * 12 + logs.length * 8;

  const repairCostSaved =
    logs.length * 18000 + scheduledTasks.length * 12000;
  const downtimeCostSaved = downtimeHoursAvoided * 2500;
  const preventiveMaintenanceCost =
    logs.length * 6000 + scheduledTasks.length * 4500;
  const estimatedCostSavings =
    repairCostSaved + downtimeCostSaved - preventiveMaintenanceCost;

  const devices = Math.max(fleetSize, 1);
  const annualCostPerDevice = 35000;
  const reactivePremiumRate = 0.35;

  const tcoWithoutPredictX = Math.round(
    devices * annualCostPerDevice * (1 + reactivePremiumRate) +
      scheduledTasks.length * 25000 +
      logs.length * 15000
  );
  const tcoWithPredictX = Math.round(
    devices * annualCostPerDevice + preventiveMaintenanceCost + logs.length * 8000
  );
  const tcoSavings = Math.max(0, tcoWithoutPredictX - tcoWithPredictX);

  const annualBudget = Math.max(devices * 200000, 1000000);
  const budgetUtilized = Math.round(
    preventiveMaintenanceCost + logs.length * 15000 + scheduledTasks.length * 10000
  );
  const budgetSaved = Math.max(0, annualBudget - budgetUtilized);
  const budgetUtilizationPct = Math.min(
    100,
    Math.round((budgetUtilized / annualBudget) * 100)
  );

  return {
    downtimeHoursAvoided,
    repairCostSaved,
    downtimeCostSaved,
    preventiveMaintenanceCost,
    estimatedCostSavings,
    tcoWithoutPredictX,
    tcoWithPredictX,
    tcoSavings,
    annualBudget,
    budgetUtilized,
    budgetSaved,
    budgetUtilizationPct,
  };
}

export default function MaintenanceOptimization({ devices, onTriggerRefresh }) {
  // Configuration for Maintenance Windows
  const [windowDay, setWindowDay] = useState(localStorage.getItem('maint_day') || 'Sunday');
  const [windowTime, setWindowTime] = useState(localStorage.getItem('maint_time') || '02:00');
  const [windowDuration, setWindowDuration] = useState(localStorage.getItem('maint_duration') || '4');
  const [isSaved, setIsSaved] = useState(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [executingTaskId, setExecutingTaskId] = useState(null);
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ isAccurate: 'yes', actualComponent: '', notes: '' });
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  // Mock historical logs
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('maint_logs');
    if (savedLogs) {
      let parsed = JSON.parse(savedLogs);
      if (parsed.length > 2) {
        parsed = parsed.slice(0, 2);
        localStorage.setItem('maint_logs', JSON.stringify(parsed));
      }
      return parsed;
    }
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
  const combinedDevices = devices || [];

  const devicesNeedingMaintenance = combinedDevices.filter(d => {
    if (!d.latestPrediction || (d.latestPrediction.riskLevel !== 'critical' && d.latestPrediction.riskLevel !== 'warning')) return false;
    return true;
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

  const costMetrics = useMemo(
    () =>
      computeCostOptimization({
        scheduledTasks,
        logs,
        fleetSize: combinedDevices.length,
      }),
    [scheduledTasks, logs, combinedDevices.length]
  );

  // Simulate executing a scheduled task
  const executeMaintenance = async (task, feedback) => {
    if (executingTaskId) return; // Prevent multiple clicks
    setExecutingTaskId(task.deviceId);

    try {
      await fetch(`http://localhost:5000/api/dashboard/devices/${task.deviceId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });

      // Simulate real-world mitigation delay (permissions, data backup, dispatch)
      await new Promise(resolve => setTimeout(resolve, 1500));

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
      
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      console.error("Failed to resolve device on backend:", err);
    } finally {
      setExecutingTaskId(null);
    }
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
            {String(scheduledTasks.filter(t => (t.component || '').toLowerCase().includes('disk') || (t.component || '').toLowerCase().includes('storage')).length + 2).padStart(3, '0')}
          </div>
        </div>

        <div className="glass-card metric-card success">
          <div className="metric-header">
            <span className="metric-label">est. cost savings</span>
            <div className="metric-icon">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {formatINR(costMetrics.estimatedCostSavings)}
          </div>
          <button
            type="button"
            onClick={() => setShowCostBreakdown((prev) => !prev)}
            style={{
              marginTop: '10px',
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              textTransform: 'lowercase',
            }}
          >
            <HelpCircle size={12} />
            why &amp; how?
          </button>
          {showCostBreakdown && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                textTransform: 'lowercase',
              }}
            >
              <div style={{ marginBottom: '6px', color: '#fff', fontWeight: 600 }}>
                repair cost saved + downtime cost saved − preventive maintenance cost
              </div>
              <div>repair cost saved: {formatINR(costMetrics.repairCostSaved)}</div>
              <div>downtime cost saved ({costMetrics.downtimeHoursAvoided}h × ₹2,500): {formatINR(costMetrics.downtimeCostSaved)}</div>
              <div>preventive maintenance cost: −{formatINR(costMetrics.preventiveMaintenanceCost)}</div>
              <div style={{ marginTop: '6px', color: 'var(--color-success)', fontWeight: 700 }}>
                = {formatINR(costMetrics.estimatedCostSavings)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost Optimization: TCO & Budget */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', textTransform: 'lowercase' }}>total cost of ownership (tco)</h2>
            <PieChart size={18} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>without predictx</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.tcoWithoutPredictX)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>with predictx</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.tcoWithPredictX)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, textTransform: 'lowercase' }}>total savings</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.tcoSavings)}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.5, textTransform: 'lowercase' }}>
            estimated annual tco across {Math.max(combinedDevices.length, 1)} device{combinedDevices.length !== 1 ? 's' : ''}, factoring reactive repair premiums vs. predictive maintenance spend.
          </p>
        </div>

        <div className="glass-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', textTransform: 'lowercase' }}>maintenance budget optimization</h2>
            <Wallet size={18} color="var(--color-warning)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>annual budget</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.annualBudget)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>used</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.budgetUtilized)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>saved</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                {formatINR(costMetrics.budgetSaved)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>utilization</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {costMetrics.budgetUtilizationPct}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${costMetrics.budgetUtilizationPct}%`,
                  height: '100%',
                  background: costMetrics.budgetUtilizationPct > 85
                    ? 'var(--color-danger)'
                    : costMetrics.budgetUtilizationPct > 70
                      ? 'var(--color-warning)'
                      : 'var(--color-success)',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5, textTransform: 'lowercase' }}>
            budget derived from fleet size; utilization reflects scheduled repairs and completed audit spend.
          </p>
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
                            onClick={() => {
                              setFeedbackTask(task);
                              setFeedbackData({ isAccurate: 'yes', actualComponent: task.component || '', notes: '' });
                            }}
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

      {feedbackTask && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '450px', backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#fff' }}>ML Validation & Feedback</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'lowercase' }}>
              help improve the predictive model by validating the predicted failure before resolving.
            </p>
            <div className="form-group">
              <label>was the prediction accurate?</label>
              <select value={feedbackData.isAccurate} onChange={e => setFeedbackData({...feedbackData, isAccurate: e.target.value})}>
                <option value="yes">yes, component failed as predicted</option>
                <option value="no">no, false positive or different component</option>
                <option value="preventative">n/a, replaced preventatively</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>actual component affected</label>
              <input type="text" value={feedbackData.actualComponent} onChange={e => setFeedbackData({...feedbackData, actualComponent: e.target.value})} placeholder="e.g. SSD Disk, Cooling Fan" />
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>technician notes (optional)</label>
              <textarea value={feedbackData.notes} onChange={e => setFeedbackData({...feedbackData, notes: e.target.value})} placeholder="any additional context for the reinforcement learning model..." rows={3} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setFeedbackTask(null)}>cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-success)', color: '#000', border: 'none' }} onClick={() => {
                 executeMaintenance(feedbackTask, feedbackData);
                 setFeedbackTask(null);
                 setFeedbackData({ isAccurate: 'yes', actualComponent: '', notes: '' });
              }}>submit & resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
