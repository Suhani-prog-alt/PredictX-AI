import React, { useState } from 'react';
import { Send, RefreshCw, Terminal, Play, CheckCircle2, AlertOctagon } from 'lucide-react';

const DEVICE_PRESETS = {
  'dev-101': {
    deviceId: 'dev-101',
    hostname: 'WS-DELL-PRO',
    manufacturer: 'Dell',
    model: 'Precision 5570',
    cpu: 'Intel Xeon W-11955M',
    ram: '64GB DDR4',
    storage: '2TB NVMe SSD',
    os: 'Windows 11 Enterprise'
  },
  'dev-102': {
    deviceId: 'dev-102',
    hostname: 'MAC-BOOK-M3',
    manufacturer: 'Apple',
    model: 'MacBook Pro M3 Max',
    cpu: 'Apple M3 Max (16-core)',
    ram: '48GB Unified Memory',
    storage: '1TB SSD',
    os: 'macOS Sequoia'
  },
  'dev-103': {
    deviceId: 'dev-103',
    hostname: 'THINKPAD-X1',
    manufacturer: 'Lenovo',
    model: 'ThinkPad X1 Carbon',
    cpu: 'Intel Core Ultra 7 155H',
    ram: '32GB LPDDR5x',
    storage: '512GB SSD',
    os: 'Ubuntu 24.04 LTS'
  }
};

const SCENARIO_PRESETS = {
  healthy: {
    cpuUsage: 25,
    cpuTemp: 45,
    ramUsage: 35,
    diskUsage: 42,
    batteryHealth: 98,
    cpuPower: 15,
    batteryPower: 10,
    fanRpm: 1800,
    smartHealth: 100,
    gpuUsage: 10,
    gpuTemp: 40
  },
  warning_cpu: {
    cpuUsage: 85,
    cpuTemp: 82,
    ramUsage: 78,
    diskUsage: 65,
    batteryHealth: 88,
    cpuPower: 65,
    batteryPower: 30,
    fanRpm: 4500,
    smartHealth: 92,
    gpuUsage: 60,
    gpuTemp: 78
  },
  critical_battery: {
    cpuUsage: 40,
    cpuTemp: 68,
    ramUsage: 50,
    diskUsage: 80,
    batteryHealth: 38,
    cpuPower: 25,
    batteryPower: 8,
    fanRpm: 2800,
    smartHealth: 88,
    gpuUsage: 15,
    gpuTemp: 55
  },
  critical_disk: {
    cpuUsage: 30,
    cpuTemp: 50,
    ramUsage: 40,
    diskUsage: 96,
    batteryHealth: 90,
    cpuPower: 18,
    batteryPower: 12,
    fanRpm: 2000,
    smartHealth: 45,
    gpuUsage: 5,
    gpuTemp: 45
  }
};

export default function TelemetrySimulator({ apiUrl, onTriggerRefresh }) {
  const [selectedDeviceKey, setSelectedDeviceKey] = useState('dev-101');
  const [deviceSpecs, setDeviceSpecs] = useState(DEVICE_PRESETS['dev-101']);
  
  const [telemetry, setTelemetry] = useState(SCENARIO_PRESETS.healthy);
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Handle device change
  const handleDeviceChange = (e) => {
    const key = e.target.value;
    setSelectedDeviceKey(key);
    setDeviceSpecs(DEVICE_PRESETS[key]);
  };

  // Autofill telemetry scenarios
  const applyScenarioPreset = (scenarioKey) => {
    setTelemetry(SCENARIO_PRESETS[scenarioKey]);
    setStatus({ type: 'info', message: `Applied "${scenarioKey.replace('_', ' ')}" telemetry values.` });
  };

  // Handle inputs
  const handleTelemetryInput = (field, val) => {
    setTelemetry(prev => ({
      ...prev,
      [field]: parseFloat(val) || 0
    }));
  };

  const handleSpecsInput = (field, val) => {
    setDeviceSpecs(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Submit telemetry
  const handleSendTelemetry = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });
    setLastResponse(null);

    const payload = {
      ...deviceSpecs,
      ...telemetry
    };

    try {
      const res = await fetch(`${apiUrl}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Simulation failed: ${res.statusText}`);
      }

      const json = await res.json();
      setLastResponse(json);
      setStatus({ 
        type: 'success', 
        message: `Successfully transmitted telemetry! Prediction Risk: ${json.prediction?.riskLevel?.toUpperCase()}` 
      });
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'danger', message: err.message || 'Failed to submit telemetry.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="content-view">
      <div className="simulator-layout">
        {/* Left Side: Form Controls */}
        <div className="glass-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} color="var(--color-primary)" />
              telemetry generator
            </h2>
          </div>

          <form onSubmit={handleSendTelemetry}>
            {/* Device specs selection */}
            <div className="form-group">
              <label>select device profile</label>
              <select value={selectedDeviceKey} onChange={handleDeviceChange}>
                <option value="dev-101">dell precision 5570 (dev-101)</option>
                <option value="dev-102">macbook pro m3 max (dev-102)</option>
                <option value="dev-103">thinkpad x1 carbon (dev-103)</option>
              </select>
            </div>

            {/* Quick scenarios */}
            <div className="form-group">
              <label>quick telemetry scenarios</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'var(--color-success)' }} onClick={() => applyScenarioPreset('healthy')}>
                  healthy state
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'var(--color-warning)' }} onClick={() => applyScenarioPreset('warning_cpu')}>
                  high cpu & heat
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'var(--color-danger)' }} onClick={() => applyScenarioPreset('critical_battery')}>
                  failing battery
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'var(--color-danger)' }} onClick={() => applyScenarioPreset('critical_disk')}>
                  degraded s.m.a.r.t disk
                </button>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

            <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '12px', textTransform: 'lowercase' }}>fine-tune metric sliders</h3>

            {/* Metrics inputs grid */}
            <div className="form-row">
              <div className="form-group">
                <label>cpu temperature ({telemetry.cpuTemp}°c)</label>
                <input 
                  type="range" min="30" max="110" step="1" 
                  value={telemetry.cpuTemp} 
                  onChange={(e) => handleTelemetryInput('cpuTemp', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>cpu usage ({telemetry.cpuUsage}%)</label>
                <input 
                  type="range" min="1" max="100" step="1" 
                  value={telemetry.cpuUsage} 
                  onChange={(e) => handleTelemetryInput('cpuUsage', e.target.value)} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ram usage ({telemetry.ramUsage}%)</label>
                <input 
                  type="range" min="5" max="100" step="1" 
                  value={telemetry.ramUsage} 
                  onChange={(e) => handleTelemetryInput('ramUsage', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>disk storage usage ({telemetry.diskUsage}%)</label>
                <input 
                  type="range" min="5" max="100" step="1" 
                  value={telemetry.diskUsage} 
                  onChange={(e) => handleTelemetryInput('diskUsage', e.target.value)} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>battery health ({telemetry.batteryHealth}%)</label>
                <input 
                  type="range" min="10" max="100" step="1" 
                  value={telemetry.batteryHealth} 
                  onChange={(e) => handleTelemetryInput('batteryHealth', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>fan speed ({telemetry.fanRpm} rpm)</label>
                <input 
                  type="range" min="0" max="6000" step="100" 
                  value={telemetry.fanRpm} 
                  onChange={(e) => handleTelemetryInput('fanRpm', e.target.value)} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>s.m.a.r.t disk health ({telemetry.smartHealth}%)</label>
                <input 
                  type="range" min="0" max="100" step="5" 
                  value={telemetry.smartHealth} 
                  onChange={(e) => handleTelemetryInput('smartHealth', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>gpu temperature ({telemetry.gpuTemp}°c)</label>
                <input 
                  type="range" min="30" max="100" step="1" 
                  value={telemetry.gpuTemp} 
                  onChange={(e) => handleTelemetryInput('gpuTemp', e.target.value)} 
                />
              </div>
            </div>

            {status.message && (
              <div 
                style={{ 
                  padding: '12px', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.85rem', 
                  marginBottom: '16px',
                  backgroundColor: status.type === 'success' ? 'var(--color-success-glow)' : status.type === 'danger' ? 'var(--color-danger-glow)' : 'rgba(255,255,255,0.03)',
                  color: status.type === 'success' ? 'var(--color-success)' : status.type === 'danger' ? 'var(--color-danger)' : 'var(--text-primary)',
                  border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.3)' : status.type === 'danger' ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {status.type === 'success' ? <CheckCircle2 size={16} /> : status.type === 'danger' ? <AlertOctagon size={16} /> : null}
                <span style={{ textTransform: 'lowercase' }}>{status.message}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              disabled={sending}
            >
              {sending ? (
                <>
                  <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  processing telemetry...
                </>
              ) : (
                <>
                  <Send size={16} />
                  transmit mock telemetry packet
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Request/Response Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Request payload viewer */}
          <div className="glass-card">
            <div className="chart-header" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="var(--text-secondary)" />
                outbound request payload
              </h3>
              <span className="api-badge" style={{ fontSize: '0.7rem' }}>post /api/telemetry</span>
            </div>
            <pre className="json-preview" style={{ color: '#60a5fa' }}>
              {JSON.stringify({ ...deviceSpecs, ...telemetry }, null, 2)}
            </pre>
          </div>

          {/* Response payload viewer */}
          <div className="glass-card">
            <div className="chart-header" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="var(--text-secondary)" />
                inbound api response
              </h3>
              {lastResponse && (
                <span className="badge success" style={{ fontSize: '0.65rem', textTransform: 'lowercase' }}>201 created</span>
              )}
            </div>
            {lastResponse ? (
              <pre className="json-preview" style={{ color: '#34d399' }}>
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            ) : (
              <div className="empty-state" style={{ padding: '60px 20px', minHeight: '120px' }}>
                <Terminal size={32} />
                <p style={{ marginTop: '8px', textTransform: 'lowercase' }}>send a telemetry packet to see the backend response logs here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
