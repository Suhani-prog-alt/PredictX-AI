import React, { useState, useEffect } from 'react';
import { BrainCircuit, Database, RefreshCw, CheckCircle, Activity } from 'lucide-react';

export default function ModelTraining({ apiUrl }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Idle');
  const [modelStats, setModelStats] = useState({
    version: 'PredictX-XGB-v1.4',
    accuracy: 88.5,
    lastTrained: '2026-06-15T08:00:00Z',
    dataPoints: 14205,
    resolvedAlerts: 142
  });
  
  const [completed, setCompleted] = useState(false);

  // Fetch some real numbers if we can from the backend (mocking here for demo if backend endpoint is missing)
  useEffect(() => {
    // In a real scenario, we'd fetch the actual number of resolved alerts from the DB here
    const fetchStats = async () => {
      try {
        // Just mocking the fetch for the demo
        setTimeout(() => {
          setModelStats(prev => ({ ...prev, dataPoints: 15420, resolvedAlerts: 185 }));
        }, 500);
      } catch (err) {
        console.error("Failed to fetch ML stats", err);
      }
    };
    fetchStats();
  }, []);

  const handleRetrain = () => {
    setLoading(true);
    setCompleted(false);
    setProgress(0);
    setStatusText('Extracting labeled telemetry data...');

    // Simulate training pipeline steps
    setTimeout(() => {
      setProgress(25);
      setStatusText('Processing successful/failed event features...');
    }, 1500);

    setTimeout(() => {
      setProgress(50);
      setStatusText('Retraining XGBoost Random Forest model...');
    }, 3500);

    setTimeout(() => {
      setProgress(85);
      setStatusText('Evaluating model accuracy against validation set...');
    }, 5500);

    setTimeout(() => {
      setProgress(100);
      setStatusText('Deploying improved model to inference server...');
      
      // Update the mock stats to show continuous learning success
      setTimeout(() => {
        setLoading(false);
        setCompleted(true);
        setModelStats(prev => ({
          version: 'PredictX-XGB-v1.5',
          accuracy: 90.2, // Accuracy increased!
          lastTrained: new Date().toISOString(),
          dataPoints: prev.dataPoints + 150,
          resolvedAlerts: 0 // Resetting the "new" feedback counter
        }));
      }, 1000);
    }, 7500);
  };

  return (
    <div className="content-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 className="h1-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrainCircuit size={28} color="var(--color-primary)" />
            MLOps & Continuous Learning
          </h1>
          <p className="subtitle">Manage the machine learning lifecycle and trigger batch retraining pipelines.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} /> Labeled Data Points
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{modelStats.dataPoints.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>+150 since last training</div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> User-Resolved Alerts
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{modelStats.resolvedAlerts}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting ingestion</div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> Current Accuracy
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: modelStats.accuracy > 90 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {modelStats.accuracy}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Model: {modelStats.version}</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ margin: '0 0 16px 0' }}>Batch Retraining Pipeline</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          In a production environment, this pipeline runs on a schedule (e.g., weekly). For demonstration purposes, you can trigger a manual retraining run to ingest the newly collected feedback data and improve the model's accuracy.
        </p>

        {loading ? (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{statusText}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-lighter)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={14} className="spin" /> Pipeline running in background...
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleRetrain}
              style={{ padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={18} /> Trigger Manual Retrain
            </button>
            
            {completed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', background: 'rgba(16,185,129,0.1)', padding: '12px 16px', borderRadius: '4px' }}>
                <CheckCircle size={18} /> Model successfully upgraded to {modelStats.version} with {modelStats.accuracy}% accuracy!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
