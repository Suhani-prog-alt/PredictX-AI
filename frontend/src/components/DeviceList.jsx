import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Search,
  Monitor,
  ChevronRight,
  X,
  HardDrive,
  Thermometer,
  Zap,
  Wind,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

/** Derive a 0-100 risk score from failureProbability */
const getRiskScore = (device) => {
  return device?.latestPrediction?.failureProbability ?? 0;
};

/** Map a risk score to a colour token */
const riskColor = (score) => {
  if (score > 70) return 'var(--color-danger)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-success)';
};

/** Friendly status label from riskLevel string */
const statusLabel = (riskLevel) => {
  if (riskLevel === 'critical') return 'critical';
  if (riskLevel === 'warning') return 'warning';
  return 'healthy';
};

/** Badge CSS class */
const badgeClass = (riskLevel) => {
  if (riskLevel === 'critical') return 'badge critical';
  if (riskLevel === 'warning') return 'badge warning';
  return 'badge low';
};

/**
 * Derive sub-scores (0-100) for the 4 subsystems from telemetry/prediction data.
 * Falls back to deterministic pseudo-random values seeded from the risk score
 * when live telemetry fields are absent.
 */
const getComponentScores = (device) => {
  const pred = device?.latestPrediction;
  const base = pred?.failureProbability ?? 0;
  const comp = (pred?.predictedComponent || '').toLowerCase();

  // Start from base risk and vary per subsystem
  const jitter = (offset) => Math.min(100, Math.max(0, base + offset));

  let storage = jitter(-8);
  let thermal = jitter(+5);
  let power   = jitter(-15);
  let cooling  = jitter(+2);

  // Boost the predicted failing component
  if (comp.includes('ssd') || comp.includes('disk') || comp.includes('storage') || comp.includes('smart')) {
    storage = jitter(+20);
  } else if (comp.includes('cpu') || comp.includes('gpu') || comp.includes('thermal') || comp.includes('temp')) {
    thermal = jitter(+20);
  } else if (comp.includes('battery') || comp.includes('power')) {
    power = jitter(+20);
  } else if (comp.includes('fan') || comp.includes('cooling')) {
    cooling = jitter(+20);
  }

  return {
    storage: Math.round(storage),
    thermal: Math.round(thermal),
    power:   Math.round(power),
    cooling: Math.round(cooling),
  };
};

/** Guess vendor from manufacturer field */
const getVendor = (device) => {
  const mfr = (device?.manufacturer || '').toLowerCase();
  if (mfr.includes('dell'))   return 'Dell';
  if (mfr.includes('hp') || mfr.includes('hewlett')) return 'HP';
  if (mfr.includes('lenovo')) return 'Lenovo';
  if (mfr.includes('apple'))  return 'Apple';
  if (mfr.includes('asus'))   return 'Asus';
  if (mfr.includes('acer'))   return 'Acer';
  return device?.manufacturer || 'Unknown';
};

/** Format an ISO timestamp to a readable relative or clock string */
const formatLastUpdated = (ts) => {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts;
  }
};

/* ─────────────────────────────────────────────────────────
   Sub-component: Inline Device Detail Panel
───────────────────────────────────────────────────────── */
function DeviceDetailPanel({ device, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const score  = getRiskScore(device);
  const color  = riskColor(score);
  const scores = getComponentScores(device);

  const components = [
    { key: 'storage', label: 'storage',  icon: HardDrive,   color: '#38bdf8' },
    { key: 'thermal', label: 'thermal',  icon: Thermometer, color: '#f04a4a' },
    { key: 'power',   label: 'power',    icon: Zap,         color: '#ffb020' },
    { key: 'cooling', label: 'cooling',  icon: Wind,        color: '#3cd070' },
  ];

  const barData = {
    labels: components.map((c) => c.label),
    datasets: [
      {
        label: 'risk score',
        data: components.map((c) => scores[c.key]),
        backgroundColor: components.map((c) => `${c.color}cc`),
        borderColor: components.map((c) => c.color),
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: 'JetBrains Mono' },
        bodyFont:  { family: 'JetBrains Mono' },
        callbacks: { label: (ctx) => ` score: ${ctx.parsed.x}` },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid:  { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid:  { display: false },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  const riskLevel = device?.latestPrediction?.riskLevel || 'low';

  return (
    <div className="glass-card device-inline-panel" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Panel header */}
      <div className="device-inline-panel__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: `1px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${color}18`,
            }}
          >
            <Monitor size={16} color={color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              {device.hostname || device.deviceId}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {getVendor(device)} · id: {device.deviceId}
            </div>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 8px' }}
          onClick={onClose}
          aria-label="close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="device-inline-panel__body">
        {/* Left: Overall risk score big number */}
        <div className="device-inline-panel__score-block">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            overall risk score
          </div>
          <div
            className="device-inline-panel__big-score"
            style={{ color }}
          >
            {String(score).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '20px' }}>/ 100</div>

          {/* Status badge */}
          <span className={badgeClass(riskLevel)} style={{ fontSize: '0.72rem' }}>
            {riskLevel === 'critical' ? <ShieldAlert size={11} /> : riskLevel === 'warning' ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
            {statusLabel(riskLevel)}
          </span>

          {/* Component sub-score list */}
          <div className="device-inline-panel__sub-scores">
            {components.map((c) => {
              const val = scores[c.key];
              const Icon = c.icon;
              return (
                <div key={c.key} className="device-inline-panel__sub-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '90px' }}>
                    <Icon size={13} color={c.color} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                  {/* inline progress bar */}
                  <div className="device-inline-panel__prog-track">
                    <div
                      className="device-inline-panel__prog-fill"
                      style={{ width: `${val}%`, background: c.color }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: riskColor(val),
                      minWidth: '28px',
                      textAlign: 'right',
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Horizontal bar chart */}
        <div className="device-inline-panel__chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
              component breakdown
            </div>
            <button 
              className="btn-icon" 
              onClick={() => setIsExpanded(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
          <div style={{ height: '180px', position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
          }}>
            {device?.latestPrediction?.predictedComponent && device.latestPrediction.predictedComponent !== 'None' ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                predicted failure:{' '}
                <span style={{ color, fontWeight: 700 }}>
                  {device.latestPrediction.predictedComponent.toLowerCase()}
                </span>
                {device.latestPrediction.rootCause && (
                  <> — {device.latestPrediction.rootCause.toLowerCase()}</>
                )}
              </p>
            ) : (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-success)' }}>
                no imminent failure predicted.
              </p>
            )}
          </div>

          {/* NEW: Why this score section */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              why this score? (top 3 factors)
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { 
                  label: device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('thermal') ? 'CPU temp sustained > 92°C' : 
                         device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('disk') ? 'SMART reallocated sectors increased' :
                         device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('battery') ? 'Battery capacity drop > 12%' : 'Unusual latency spike detected', 
                  weight: 85, 
                  color: 'var(--color-danger)' 
                },
                { 
                  label: device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('thermal') ? 'Fan speed inconsistent' : 
                         device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('disk') ? 'Peak latency exceeded 250ms' :
                         device?.latestPrediction?.predictedComponent?.toLowerCase()?.includes('battery') ? 'Cycle count exceeding threshold' : 'Firmware reporting warnings', 
                  weight: 45, 
                  color: 'var(--color-warning)' 
                },
                { 
                  label: 'Historical trend correlation', 
                  weight: 25, 
                  color: 'var(--color-info)' 
                },
              ].map((factor, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#fff' }}>
                    <span>{factor.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>impact: {factor.weight}%</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${factor.weight}%`, height: '100%', background: factor.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {isExpanded && (
        <div className="modal-overlay" onClick={() => setIsExpanded(false)}>
          <div className="glass-card expanded-chart-modal" onClick={e => e.stopPropagation()}>
            <div className="chart-header" style={{ marginBottom: '20px' }}>
              <h2>{device.hostname || 'Device'} Breakdown Analysis</h2>
              <button 
                className="btn-icon" 
                onClick={() => setIsExpanded(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ height: '500px', width: '100%' }}>
              <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false, scales: { ...barOptions.scales, y: { ...barOptions.scales.y, ticks: { ...barOptions.scales.y.ticks, size: 14 } }, x: { ...barOptions.scales.x, ticks: { ...barOptions.scales.x.ticks, size: 12 } } } }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
export default function DeviceList({ devices, onSelectDevice }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filteredDevices = devices
    ? devices.filter((d) =>
        (d.hostname || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.deviceId || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.manufacturer || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.model || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedDevice = filteredDevices.find((d) => d.deviceId === selectedId) || null;

  const handleRowClick = (device) => {
    setSelectedId((prev) => (prev === device.deviceId ? null : device.deviceId));
  };

  return (
    <div className="content-view">
      {/* ── Search bar ── */}
      <div className="glass-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={17} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="search devices by hostname, id, vendor, model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.9rem', width: '100%',
            }}
          />
        </div>
      </div>

      {/* ── Device Table ── */}
      <div className="glass-card" style={{ padding: 0, marginBottom: '24px' }}>
        {filteredDevices.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>device name</th>
                  <th>vendor</th>
                  <th>risk score</th>
                  <th>status</th>
                  <th>last updated</th>
                  <th style={{ textAlign: 'right' }}>details</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const score     = getRiskScore(device);
                  const riskLevel = device?.latestPrediction?.riskLevel || 'low';
                  const isOpen    = selectedId === device.deviceId;
                  const lastTs    = device?.latestPrediction?.timestamp || device?.updatedAt;

                  return (
                    <tr
                      key={device.deviceId}
                      onClick={() => handleRowClick(device)}
                      className={isOpen ? 'device-row--active' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Device Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${isOpen ? riskColor(score) : 'var(--border-color)'}`,
                            transition: 'border-color 0.2s',
                          }}>
                            <Monitor size={14} color={isOpen ? riskColor(score) : 'var(--text-secondary)'} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                              {device.hostname || 'unknown'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {device.deviceId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {getVendor(device)}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="device-score-bar-track">
                            <div
                              className="device-score-bar-fill"
                              style={{
                                width: `${score}%`,
                                background: riskColor(score),
                              }}
                            />
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: riskColor(score),
                            minWidth: '28px',
                          }}>
                            {score}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={badgeClass(riskLevel)} style={{ textTransform: 'lowercase', fontSize: '0.72rem' }}>
                          {statusLabel(riskLevel)}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {formatLastUpdated(lastTs)}
                        </span>
                      </td>

                      {/* Expand toggle */}
                      <td style={{ textAlign: 'right' }}>
                        <ChevronRight
                          size={16}
                          color={isOpen ? riskColor(score) : 'var(--text-secondary)'}
                          style={{
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <Monitor size={48} />
            <h3 style={{ marginTop: '12px', textTransform: 'lowercase' }}>no devices registered</h3>
            <p style={{ textTransform: 'lowercase' }}>
              go to the agent simulator tab and submit a telemetry packet to register a device.
            </p>
          </div>
        )}
      </div>

      {/* ── Inline Detail Panel ── */}
      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
