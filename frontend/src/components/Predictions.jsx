import React, { useState } from 'react';
import { 
  BarChart, 
  Clock, 
  AlertCircle, 
  Calendar,
  Monitor,
  Info,
  Bug,
  ToggleLeft,
  ToggleRight,
  Building
} from 'lucide-react';

export default function Predictions({ devices }) {
  // Real data filter
  const atRiskDevices = devices?.filter(d => 
    d.latestPrediction && 
    (d.latestPrediction.riskLevel?.toLowerCase() === 'warning' || d.latestPrediction.riskLevel?.toLowerCase() === 'critical')
  ) || [];

  /**
   * Calculate a failure window based on probability.
   */
  const getFailureWindow = (prob) => {
    if (prob >= 85) return { start: 1, end: 4, label: '1-4d' };
    if (prob >= 75) return { start: 3, end: 7, label: '3-7d' };
    if (prob >= 60) return { start: 7, end: 15, label: '7-15d' };
    if (prob >= 40) return { start: 15, end: 28, label: '15-28d' };
    return { start: 2, end: 30, label: 'unknown' };
  };

  const riskColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'critical') return 'var(--color-danger)';
    if (l === 'warning') return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className="content-view">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'lowercase' }}>failure horizon timeline</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'var(--color-danger)' }}></div>
                <span>critical</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'var(--color-warning)' }}></div>
                <span>warning</span>
              </div>
            </div>
          </div>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', textTransform: 'lowercase' }}>
          Visualizing probability distribution of system fault events over the 30-day forecast window.
        </p>

        {atRiskDevices.length > 0 ? (
          <div className="predictions-timeline">
            {/* Timeline X-Axis Labels */}
            <div className="timeline-axis">
              <div className="axis-spacer">device_id</div>
              <div className="axis-labels">
                <span>day 0</span>
                <span>day 7</span>
                <span>day 14</span>
                <span>day 21</span>
                <span>day 30</span>
              </div>
            </div>

            {/* Timeline Rows */}
            <div className="timeline-grid">
              {atRiskDevices.map(device => {
                const prob = device.latestPrediction.failureProbability;
                const risk = device.latestPrediction.riskLevel;
                const window = getFailureWindow(prob);
                const color = riskColor(risk);
                
                // Position logic
                const startPos = (window.start / 30) * 100;
                const widthPos = ((window.end - window.start) / 30) * 100;

                return (
                  <div key={device.deviceId} className="timeline-row">
                    <div className="device-info-cell">
                      <Monitor size={14} style={{ marginRight: '8px', color: `${color}cc` }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="device-name-short">
                          {device.orgAssignedId ? `${device.orgAssignedId} (${device.originalHostname?.toLowerCase()})` : (device.hostname || device.deviceId)}
                        </div>
                        {device.orgId && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building size={10} /> {device.orgId}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="track-cell">
                      {/* Grid lines */}
                      <div className="grid-line" style={{ left: '0%' }}></div>
                      <div className="grid-line" style={{ left: '23.3%' }}></div>
                      <div className="grid-line" style={{ left: '46.6%' }}></div>
                      <div className="grid-line" style={{ left: '70%' }}></div>

                      {/* Prediction Bar */}
                      <div 
                        className="prediction-bar"
                        style={{ 
                          left: `${startPos}%`, 
                          width: `${Math.max(widthPos, 5)}%`,
                          backgroundColor: `${color}20`,
                          border: `1px solid ${color}80`,
                          boxShadow: `0 0 15px ${color}10`
                        }}
                      >
                        <div className="bar-label-top">{prob}% risk</div>
                        <div className="bar-label-btm">{window.label} window</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '80px 0', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
            <Calendar size={48} />
            <h3 style={{ textTransform: 'lowercase' }}>no predictive events detected</h3>
            <p style={{ maxWidth: '400px', margin: '8px auto', textTransform: 'lowercase' }}>
              all managed assets currently show failure probabilities below the 40% warning threshold.
            </p>
            {!showDemo && (
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '20px' }}
                onClick={() => setShowDemo(true)}
              >
                view simulation data
              </button>
            )}
          </div>
        )}
      </div>

      {/* Raw Data Debug Section */}
      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Bug size={14} />
            raw prediction data registry
          </h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <th>id</th>
                <th>prob%</th>
                <th>level</th>
                <th>component</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {devices?.map(d => (
                <tr key={d.deviceId}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{d.deviceId}</td>
                  <td>{d.latestPrediction?.failureProbability || 0}%</td>
                  <td>
                    <span style={{ color: riskColor(d.latestPrediction?.riskLevel) }}>
                      {d.latestPrediction?.riskLevel || 'stable'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.latestPrediction?.predictedComponent || 'none'}</td>
                  <td>{d.latestPrediction?.riskLevel === 'critical' ? '🔴' : d.latestPrediction?.riskLevel === 'warning' ? '🟡' : '🟢'}</td>
                </tr>
              ))}
              {devices?.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>no data in stream</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .predictions-timeline {
          margin-top: 20px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: rgba(255,255,255,0.01);
          overflow: hidden;
        }
        
        .timeline-axis {
          display: flex;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border-color);
          padding: 12px 0;
        }

        .axis-spacer {
          width: 220px;
          padding-left: 20px;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: lowercase;
        }

        .axis-labels {
          flex: 1;
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: lowercase;
        }

        .timeline-grid {
          display: flex;
          flex-direction: column;
        }

        .timeline-row {
          display: flex;
          height: 60px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }

        .timeline-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .device-info-cell {
          width: 220px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          border-right: 1px solid var(--border-color);
        }

        .device-name-short {
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-cell {
          flex: 1;
          position: relative;
          padding: 10px 0;
          background: repeating-linear-gradient(90deg, transparent, transparent 23.2%, rgba(255,255,255,0.01) 23.3%);
        }

        .grid-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.03);
        }

        .prediction-bar {
          position: absolute;
          top: 10px;
          bottom: 10px;
          border-radius: 4px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 12px;
          backdrop-filter: blur(4px);
        }

        .bar-label-top {
          font-size: 0.7rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
        }

        .bar-label-btm {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.8);
          font-family: var(--font-mono);
        }
      `}} />
    </div>
  );
}
