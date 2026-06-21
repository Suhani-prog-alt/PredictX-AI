import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  ArrowLeft, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Wind,
  BatteryCharging,
  Zap,
  TrendingUp
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DeviceDetail({ deviceId, onBack, apiUrl, latestUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedCheckboxes, setResolvedCheckboxes] = useState(new Set());

  const fetchDeviceData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/dashboard/devices/${deviceId}`);
      if (!res.ok) {
        throw new Error(`Device details fetch failed: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [deviceId, apiUrl]);

  useEffect(() => {
    fetchDeviceData(false); // Initial load with spinner
    
    const interval = setInterval(() => {
      fetchDeviceData(true); // Background poll every 2 seconds for true real-time processing
    }, 2000);
    
    return () => clearInterval(interval);
  }, [fetchDeviceData]);

  // Effect to handle SSE updates
  useEffect(() => {
    if (latestUpdate && latestUpdate.deviceId === deviceId) {
      fetchDeviceData(true);
    }
  }, [latestUpdate, deviceId, fetchDeviceData]);

  // Reset checkboxes when prediction changes
  useEffect(() => {
    setResolvedCheckboxes(new Set());
  }, [data?.latestPrediction?._id]);

  const handleRecommendationCheck = async (idx, isChecked) => {
    const newSet = new Set(resolvedCheckboxes);
    if (isChecked) {
      newSet.add(idx);
    } else {
      newSet.delete(idx);
    }
    setResolvedCheckboxes(newSet);

    // If all recommendations are checked, resolve the alert
    if (newSet.size > 0 && newSet.size === data?.latestPrediction?.recommendation?.length) {
      try {
        await fetch(`${apiUrl}/dashboard/devices/${deviceId}/resolve`, { method: 'POST' });
      } catch (err) {
        console.error("Failed to resolve alert", err);
      }
    }
  };

  // Handle incoming real-time telemetry from Server-Sent Events stream
  useEffect(() => {
    if (!latestUpdate || latestUpdate.deviceId !== deviceId || !data) return;
    if (!latestUpdate.telemetry || !latestUpdate.prediction) return;

    setData(prev => {
      if (!prev) return prev;

      const telemetryExists = (prev.recentTelemetry || []).some(t =>
        (t._id && t._id === latestUpdate.telemetry._id) ||
        t.timestamp === latestUpdate.telemetry.timestamp
      );
      if (telemetryExists) return prev;

      const newTelemetry = [latestUpdate.telemetry, ...(prev.recentTelemetry || [])].slice(0, 10);
      const newPredictions = [latestUpdate.prediction, ...(prev.recentPredictions || [])].slice(0, 10);

      return {
        ...prev,
        recentTelemetry: newTelemetry,
        recentPredictions: newPredictions,
        latestPrediction: latestUpdate.prediction
      };
    });
  }, [latestUpdate, deviceId]);

  if (loading) {
    return (
      <div className="content-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading device analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="content-view">
        <div className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Devices
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', borderColor: 'var(--color-danger)' }}>
          <AlertTriangle size={48} color="var(--color-danger)" />
          <h3 style={{ marginTop: '16px', color: '#fff' }}>Failed to load device details</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{error || 'No data returned.'}</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={fetchDeviceData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }



  const getMetricStatus = (key, val) => {
    if (val === undefined || val === null) return 'normal';
    switch (key) {
      case 'cpuTemp':
        return val >= 85 ? 'critical' : val >= 70 ? 'warning' : 'normal';
      case 'cpuUsage':
        return val >= 90 ? 'critical' : val >= 70 ? 'warning' : 'normal';
      case 'ramUsage':
        return val >= 90 ? 'critical' : val >= 70 ? 'warning' : 'normal';
      case 'diskUsage':
        return val >= 90 ? 'critical' : val >= 80 ? 'warning' : 'normal';
      case 'fanRpm':
        return val >= 5500 ? 'critical' : val >= 4500 ? 'warning' : 'normal';
      case 'batteryHealth':
        return val < 40 ? 'critical' : val < 60 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  };

  const { device, recentTelemetry, recentPredictions, latestPrediction } = data;

  // Format line charts data
  const sortedTelemetry = (recentTelemetry && recentTelemetry.length > 0) ? [...recentTelemetry].reverse() : [];
  const timestamps = sortedTelemetry.map(t => new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const sortedPredictions = (recentPredictions && recentPredictions.length > 0) ? [...recentPredictions].reverse() : [];
  const predictionTimestamps = sortedPredictions.map(p => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const performanceChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'cpu usage (%)',
        data: sortedTelemetry.map(t => t.cpuUsage || 0),
        borderColor: '#ffb020',
        backgroundColor: 'rgba(255, 176, 32, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 1.5,
      },
      {
        label: 'ram usage (%)',
        data: sortedTelemetry.map(t => t.ramUsage || 0),
        borderColor: '#888888',
        backgroundColor: 'rgba(136, 136, 136, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 1.5,
      }
    ]
  };

  const thermalChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'cpu temp (°c)',
        data: sortedTelemetry.map(t => t.cpuTemp || 0),
        borderColor: '#f04a4a',
        backgroundColor: 'rgba(240, 74, 74, 0.02)',
        fill: false,
        tension: 0.3,
        borderWidth: 1.5,
      },
      {
        label: 'gpu temp (°c)',
        data: sortedTelemetry.map(t => t.gpuTemp || 0),
        borderColor: '#ffb020',
        backgroundColor: 'rgba(255, 176, 32, 0.02)',
        fill: false,
        tension: 0.3,
        borderWidth: 1.5,
      }
    ]
  };

  const failureProbabilityChartData = {
    labels: predictionTimestamps,
    datasets: [
      {
        label: 'failure probability (%)',
        data: sortedPredictions.map(p => p.failureProbability || 0),
        borderColor: '#e87a3e', // primary orange/amber accent
        backgroundColor: 'rgba(232, 122, 62, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 1.5,
      }
    ]
  };

  const powerConsumptionChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'cpu power (w)',
        data: sortedTelemetry.map(t => t.cpuPower || 0),
        borderColor: '#38bdf8', // blue
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        fill: false,
        tension: 0.3,
        borderWidth: 1.5,
      },
      {
        label: 'battery power (w)',
        data: sortedTelemetry.map(t => t.batteryPower || 0),
        borderColor: '#3cd070', // green
        backgroundColor: 'rgba(60, 208, 112, 0.05)',
        fill: false,
        tension: 0.3,
        borderWidth: 1.5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
        min: 0,
        max: 100
      }
    },
    plugins: {
      legend: {
        labels: { 
          color: '#f3f4f6', 
          font: { family: 'JetBrains Mono', size: 11 },
          boxWidth: 16,
          boxHeight: 12,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              fontColor: '#f3f4f6',
              lineWidth: 1,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i
            }));
          }
        }
      },
      tooltip: {
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' }
      }
    }
  };

  const powerChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } },
        beginAtZero: true
      }
    }
  };

  // Get current telemetry (most recent)
  const current = recentTelemetry && recentTelemetry.length > 0 ? recentTelemetry[0] : null;
  const risk = latestPrediction?.riskLevel || 'low';

  return (
    <div className="content-view">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            sys / devices / {deviceId.toLowerCase()}
          </div>
          <button className="btn btn-secondary" onClick={fetchDeviceData} style={{ padding: '6px 12px' }}>
            <RefreshCw size={14} /> refresh
          </button>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '12px', textTransform: 'lowercase' }}>
          device analytics
        </h1>
        <div className="back-btn" onClick={onBack} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'lowercase' }}>
          &larr; back_to_devices
        </div>
      </div>

      {/* Main Details Layout */}
      <div className="device-detail-grid">
        {/* Left Side: Metadata and Current Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Machine Header */}
          <div className="glass-card" style={{ borderLeft: `3px solid ${risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '4px', textTransform: 'uppercase' }}>
              {device.orgAssignedId ? `${device.orgAssignedId} (${device.originalHostname?.toLowerCase()})` : (device.hostname || 'unknown')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
              id: {device.deviceId}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                padding: '4px 8px', 
                border: `1px solid ${risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'}`,
                backgroundColor: risk === 'critical' ? 'var(--color-danger-glow)' : risk === 'warning' ? 'var(--color-warning-glow)' : 'var(--color-success-glow)',
                color: risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
                borderRadius: '2px',
                textTransform: 'lowercase'
              }}>
                {risk === 'critical' ? 'critical_risk' : risk === 'warning' ? 'warning_risk' : 'stable'}
              </span>
              
              {latestPrediction && (
                <>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    padding: '4px 8px', 
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    color: 'var(--text-secondary)',
                    borderRadius: '2px',
                    textTransform: 'lowercase'
                  }}>
                    score: {latestPrediction.healthScore}/100
                  </span>
                  
                  <span style={{ 
                    fontSize: '0.8rem', 
                    padding: '4px 8px', 
                    border: `1px solid ${risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'}`,
                    backgroundColor: risk === 'critical' ? 'var(--color-danger-glow)' : risk === 'warning' ? 'var(--color-warning-glow)' : 'var(--color-success-glow)',
                    color: risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
                    borderRadius: '2px',
                    textTransform: 'lowercase'
                  }}>
                    ttf: {(latestPrediction.estimatedFailureWindow || 'Unknown').toLowerCase()}
                  </span>
                </>
              )}
              {device.orgId && (
                <span style={{ 
                  fontSize: '0.9rem', 
                  padding: '4px 8px', 
                  border: '1px solid var(--color-info)',
                  backgroundColor: 'var(--color-info-glow)',
                  color: 'var(--color-info)',
                  borderRadius: '2px',
                  textTransform: 'lowercase'
                }}>
                  org :: {device.orgId}
                </span>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '16px', textTransform: 'lowercase' }}>hardware_profile</h3>
            {latestPrediction && (
              <div className="spec-item" style={{ paddingBottom: '12px' }}>
                <span>ttf</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
                  textTransform: 'lowercase'
                }}>
                  {(latestPrediction.estimatedFailureWindow || 'Unknown').toLowerCase()}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>brand</span>
              <span style={{ textTransform: 'lowercase' }}>{device.manufacturer}</span>
            </div>
            <div className="spec-item">
              <span>model</span>
              <span style={{ textTransform: 'lowercase' }}>{device.model}</span>
            </div>
            <div className="spec-item">
              <span>processor</span>
              <span style={{ textTransform: 'lowercase' }}>{device.cpu}</span>
            </div>
            <div className="spec-item">
              <span>ram</span>
              <span style={{ textTransform: 'lowercase' }}>{device.ram}</span>
            </div>
            <div className="spec-item">
              <span>storage</span>
              <span style={{ textTransform: 'lowercase' }}>{device.storage}</span>
            </div>
            <div className="spec-item">
              <span>os</span>
              <span style={{ textTransform: 'lowercase' }}>{device.os}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Health Insights and Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Health Insight Summary */}
          {latestPrediction && (
            <div className={`glass-card ${risk !== 'low' ? 'rec-box ' + risk : ''}`} style={{ margin: 0, padding: '24px' }}>
              <div className="rec-title" style={{ color: risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {risk === 'critical' ? <AlertTriangle size={18} /> : risk === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                  <span style={{ textTransform: 'lowercase' }}>
                    ml_assessment :: {risk === 'critical' ? 'urgent_failure_risk' : risk === 'warning' ? (latestPrediction?.healthScore > 40 ? 'moderate_performance_degradation' : 'degraded_performance_warning') : 'system_healthy'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                  {latestPrediction?.processingLatencyMs && <span>⏱️ latency: {latestPrediction.processingLatencyMs}ms</span>}
                  {latestPrediction?.confidenceScore && <span>🎯 confidence: {latestPrediction.confidenceScore}%</span>}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', marginBottom: '16px', borderLeft: '2px solid var(--color-primary)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>
                  <HelpCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                  explainable_ai_insight
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'lowercase', lineHeight: '1.4' }}>
                  root_cause: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{latestPrediction.rootCause?.toLowerCase() || 'no issues detected.'}</span>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'none', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "Risk score of {latestPrediction.healthScore} generated due to {latestPrediction.rootCause?.toLowerCase() || 'normal operational patterns'}. The ML model detected anomalous telemetry correlated with {latestPrediction.predictedComponent && latestPrediction.predictedComponent !== 'None' ? latestPrediction.predictedComponent.toLowerCase() : 'system'} degradation."
                </p>
              </div>
              {latestPrediction.predictedComponent && latestPrediction.predictedComponent !== 'None' && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'lowercase' }}>
                  component: <span style={{ color: risk === 'critical' ? 'var(--color-danger)' : risk === 'warning' ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 'bold' }}>{latestPrediction.predictedComponent.toLowerCase()}</span>
                </p>
              )}
              {latestPrediction.recommendation && latestPrediction.recommendation.length > 0 && (
                <div>
                   <h4 style={{ fontSize: '0.85rem', textTransform: 'lowercase', color: 'var(--text-secondary)', marginBottom: '10px', letterSpacing: '0.5px' }}>action_recommendations:</h4>
                  <ul className="rec-list">
                    {latestPrediction.recommendation.map((rec, idx) => (
                      <li key={idx} className="rec-item">
                        <input 
                          type="checkbox" 
                          checked={risk === 'low' || resolvedCheckboxes.has(idx)}
                          onChange={(e) => handleRecommendationCheck(idx, e.target.checked)}
                          disabled={risk === 'low'}
                        />
                        <span style={{ textTransform: 'lowercase' }}>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Current Telemetry Widgets */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', textTransform: 'lowercase', marginBottom: '16px' }}>live_telemetry</h3>
            {current ? (
              <div className="telemetry-widgets">
                <div className={`widget-card ${getMetricStatus('cpuTemp', current.cpuTemp)}`} style={{ background: `linear-gradient(to right, rgba(240, 74, 74, 0.2) ${Math.min(current.cpuTemp, 100)}%, rgba(0,0,0,0.15) ${Math.min(current.cpuTemp, 100)}%)` }}>
                  <span className="w-label">cpu_temp</span>
                  <span className="w-value">
                    {current.cpuTemp}°c
                  </span>
                </div>
                <div className={`widget-card ${getMetricStatus('cpuUsage', current.cpuUsage)}`} style={{ background: `linear-gradient(to right, rgba(255, 176, 32, 0.2) ${current.cpuUsage}%, rgba(0,0,0,0.15) ${current.cpuUsage}%)` }}>
                  <span className="w-label">cpu_usage</span>
                  <span className="w-value">{current.cpuUsage}%</span>
                </div>
                <div className={`widget-card ${getMetricStatus('ramUsage', current.ramUsage)}`} style={{ background: `linear-gradient(to right, rgba(136, 136, 136, 0.2) ${current.ramUsage}%, rgba(0,0,0,0.15) ${current.ramUsage}%)` }}>
                  <span className="w-label">ram_usage</span>
                  <span className="w-value">{current.ramUsage}%</span>
                </div>
                <div className={`widget-card ${getMetricStatus('diskUsage', current.diskUsage)}`} style={{ background: `linear-gradient(to right, rgba(240, 74, 74, 0.2) ${current.diskUsage}%, rgba(0,0,0,0.15) ${current.diskUsage}%)` }}>
                  <span className="w-label">storage_used</span>
                  <span className="w-value">{current.diskUsage}%</span>
                </div>
                <div className={`widget-card ${getMetricStatus('fanRpm', current.fanRpm)}`} style={{ background: `linear-gradient(to right, rgba(56, 189, 248, 0.2) ${Math.min((current.fanRpm / 6000) * 100, 100)}%, rgba(0,0,0,0.15) ${Math.min((current.fanRpm / 6000) * 100, 100)}%)` }}>
                  <span className="w-label">fan_rpm</span>
                  <span className="w-value">{current.fanRpm}</span>
                </div>
                <div className={`widget-card ${getMetricStatus('batteryHealth', current.batteryHealth)}`} style={{ background: `linear-gradient(to right, rgba(60, 208, 112, 0.2) ${current.batteryHealth}%, rgba(0,0,0,0.15) ${current.batteryHealth}%)` }}>
                  <span className="w-label">battery</span>
                  <span className="w-value">{current.batteryHealth}%</span>
                </div>
                {current.psuVoltageFluctuation !== undefined && (
                  <div className={`widget-card`} style={{ background: `rgba(245, 158, 11, 0.15)` }}>
                    <span className="w-label">cpu_vrm_voltage</span>
                    <span className="w-value">{current.psuVoltageFluctuation.toFixed(3)} v</span>
                  </div>
                )}
                {current.smartReallocatedSectors !== undefined && (
                  <div className={`widget-card`} style={{ background: `rgba(239, 68, 68, ${current.smartReallocatedSectors > 0 ? 0.3 : 0.05})` }}>
                    <span className="w-label">smart_sectors</span>
                    <span className="w-value">{current.smartReallocatedSectors}</span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '12px', textTransform: 'lowercase' }}>no telemetry data submitted yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend Charts */}
      {sortedTelemetry.length > 0 && (
        <div className="detail-charts-grid">
          <div className="glass-card chart-container" style={{ minHeight: '380px' }}>
            <div className="chart-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>performance_history :: cpu/ram</h3>
              <Cpu size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, position: 'relative', height: '300px' }}>
              <Line data={performanceChartData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-card chart-container" style={{ minHeight: '380px' }}>
            <div className="chart-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>thermal_trend :: cpu/gpu</h3>
              <Wind size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, position: 'relative', height: '300px' }}>
              <Line data={thermalChartData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-card chart-container" style={{ minHeight: '380px' }}>
            <div className="chart-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>failure_probability_trend :: date/time</h3>
              <TrendingUp size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, position: 'relative', height: '300px' }}>
              <Line data={failureProbabilityChartData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-card chart-container" style={{ minHeight: '380px' }}>
            <div className="chart-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>power_consumption_trend :: date/time</h3>
              <Zap size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, position: 'relative', height: '300px' }}>
              <Line data={powerConsumptionChartData} options={powerChartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
