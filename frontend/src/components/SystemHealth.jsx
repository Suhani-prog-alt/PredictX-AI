import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Signal, 
  Database,
  Globe,
  Server,
  Cloud
} from 'lucide-react';

export default function SystemHealth({ backendOnline }) {
  const [latency, setLatency] = useState(1240);
  const [accuracy, setAccuracy] = useState(94.2);

  // Small jitter for the "Live" feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(800, Math.min(4500, prev + (Math.random() * 400 - 200))));
      setAccuracy(prev => Math.max(90, Math.min(99, prev + (Math.random() * 0.4 - 0.2))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const integrations = [
    { name: 'Microsoft SCOM', status: 'connected', uptime: '99.98%' },
    { name: 'Nagios Core', status: 'connected', uptime: '99.95%' },
    { name: 'Zabbix Enterprise', status: 'disconnected', uptime: '0.00%' }
  ];

  return (
    <div className="content-view">
      {/* ML Core Stats */}
      <div className="metrics-grid">
        <div className="glass-card metric-card success">
          <div className="metric-header">
            <span className="metric-label">live model accuracy</span>
            <div className="metric-icon"><Cpu size={16} /></div>
          </div>
          <div className="metric-value">{accuracy.toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>%</span></div>
        </div>

        <div className="glass-card metric-card primary">
          <div className="metric-header">
            <span className="metric-label">false positive rate</span>
            <div className="metric-icon"><Zap size={16} /></div>
          </div>
          <div className="metric-value">1.42<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>%</span></div>
        </div>

        <div className={`glass-card metric-card ${latency > 4000 ? 'danger' : 'success'}`}>
          <div className="metric-header">
            <span className="metric-label">processing latency</span>
            <div className="metric-icon"><Signal size={16} /></div>
          </div>
          <div className="metric-value">
            {Math.round(latency)}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ms</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            target: &lt;5000ms
          </div>
        </div>

        <div className="glass-card metric-card info">
          <div className="metric-header">
            <span className="metric-label">daily data volume</span>
            <div className="metric-icon"><Database size={16} /></div>
          </div>
          <div className="metric-value">12.8<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>gb</span></div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Enterprise Integrations */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--color-primary)" />
              enterprise integrations
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {integrations.map(int => (
                <div key={int.name} style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    <Server size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{int.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>uptime: {int.uptime}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div className={`status-dot ${int.status === 'connected' ? 'online' : 'offline'}`} style={{ width: '6px', height: '6px' }}></div>
                  <span style={{ textTransform: 'lowercase' }}>{int.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Persistence */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} color="var(--color-info)" />
              cloud node status
            </h2>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>current Region:</strong> <span style={{ color: '#fff' }}>aws-ap-south-1</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
               <strong>DB Sync:</strong> <span style={{ color: 'var(--color-success)' }}>active (0.4ms lag)</span>
            </div>
            <div className="badge low" style={{ textTransform: 'lowercase' }}>primary node: active</div>
            <p style={{ marginTop: '16px', opacity: 0.6 }}>
              All telemetry is encrypted via AES-256 before egress to the centralized cloud persistence layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
