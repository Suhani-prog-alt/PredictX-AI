import React, { useState, useEffect } from 'react';
import { Activity, Database, BrainCircuit, Activity as Heartbeat, CheckCircle, XCircle, AlertTriangle, Play, FileText, Server } from 'lucide-react';

export default function Diagnostics({ apiUrl }) {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics(null);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/diagnostics`);
      const data = await response.json();
      setDiagnostics(data);
      setLastRun(new Date().toLocaleTimeString());
    } catch (err) {
      setDiagnostics({
        backend: { status: 'error', message: 'Could not reach backend API at ' + apiUrl }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'ok') return <CheckCircle size={20} color="var(--color-success)" />;
    if (status === 'warning') return <AlertTriangle size={20} color="var(--color-warning)" />;
    if (status === 'error') return <XCircle size={20} color="var(--color-danger)" />;
    return <Activity size={20} className="spinner" />;
  };

  const getCardClass = (status) => {
    if (!status) return 'glass-card metric-card';
    if (status === 'error') return 'glass-card metric-card danger';
    if (status === 'warning') return 'glass-card metric-card warning';
    return 'glass-card metric-card success';
  };

  const faqs = [
    {
      id: 'backend',
      q: 'Backend API is Offline',
      a: 'Ensure you have started the Node.js backend. Open a terminal in the /backend directory and run `node server.js`. The server should indicate it is running on port 5000.'
    },
    {
      id: 'db',
      q: 'MongoDB Disconnected',
      a: 'Ensure MongoDB is running locally on port 27017. If you are using MongoDB Atlas, check that your connection string in backend/server.js is correct and your IP is whitelisted.'
    },
    {
      id: 'ml',
      q: 'FastAPI ML Engine Unreachable',
      a: 'The Python ML API must be running for predictions to work. Open a terminal in /model_inference, activate your venv, and run `python api.py` (it runs on port 8000).'
    },
    {
      id: 'agent',
      q: 'No Live Telemetry Stream',
      a: 'The system has not received any device data in the last 60 seconds. Make sure your Python agent is running. Open a terminal in the root folder and run `python agent.py`.'
    }
  ];

  return (
    <div className="content-view">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Interactive Diagnostics</h2>
          <p className="text-secondary">Run real-time health checks across the entire PredictX stack.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={runDiagnostics}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isRunning ? <Activity size={18} className="spinner" /> : <Play size={18} />}
          {isRunning ? 'Running Checks...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        <div className={getCardClass(diagnostics?.backend?.status)}>
          <div className="metric-header">
            <span className="metric-label">Node.js Backend</span>
            <div className="metric-icon"><Server size={16} /></div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <StatusIcon status={diagnostics?.backend?.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '0.9rem', lineHeight: '1.4' }}>{diagnostics ? diagnostics.backend.message : 'Awaiting Test'}</div>
              {diagnostics?.backend?.latency >= 0 && <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Latency: {diagnostics.backend.latency}ms</div>}
            </div>
          </div>
        </div>

        <div className={getCardClass(diagnostics?.database?.status)}>
          <div className="metric-header">
            <span className="metric-label">MongoDB Database</span>
            <div className="metric-icon"><Database size={16} /></div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <StatusIcon status={diagnostics?.database?.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '0.9rem', lineHeight: '1.4' }}>{diagnostics ? diagnostics.database?.message || 'Check failed' : 'Awaiting Test'}</div>
              {diagnostics?.database?.latency >= 0 && <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Latency: {diagnostics.database.latency}ms</div>}
            </div>
          </div>
        </div>

        <div className={getCardClass(diagnostics?.ml_api?.status)}>
          <div className="metric-header">
            <span className="metric-label">XGBoost ML Engine</span>
            <div className="metric-icon"><BrainCircuit size={16} /></div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <StatusIcon status={diagnostics?.ml_api?.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '0.9rem', lineHeight: '1.4' }}>{diagnostics ? diagnostics.ml_api?.message || 'Check failed' : 'Awaiting Test'}</div>
              {diagnostics?.ml_api?.latency >= 0 && <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Latency: {diagnostics.ml_api.latency}ms</div>}
            </div>
          </div>
        </div>

        <div className={getCardClass(diagnostics?.telemetry?.status)}>
          <div className="metric-header">
            <span className="metric-label">Live Telemetry</span>
            <div className="metric-icon"><Heartbeat size={16} /></div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <StatusIcon status={diagnostics?.telemetry?.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '0.9rem', lineHeight: '1.4' }}>{diagnostics ? diagnostics.telemetry?.message || 'Check failed' : 'Awaiting Test'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} />
          <h3>Troubleshooting Guidelines</h3>
        </div>
        <div className="panel-content">
          <p className="text-secondary" style={{ marginBottom: '24px' }}>
            If any of the diagnostic checks above returned an error or warning, refer to the exact solutions below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map(faq => (
              <div 
                key={faq.id} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  overflow: 'hidden' 
                }}
              >
                <div 
                  onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-lighter)', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={16} className="text-secondary" />
                    {faq.q}
                  </div>
                  <span>{activeFaq === faq.id ? '−' : '+'}</span>
                </div>
                {activeFaq === faq.id && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-dark)', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
