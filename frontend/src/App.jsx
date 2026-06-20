import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Alerts from './components/Alerts';
import DeviceList from './components/DeviceList';
import DeviceDetail from './components/DeviceDetail';
import PredictionView from './components/Predictions';
import SystemHealth from './components/SystemHealth';
import TelemetrySimulator from './components/TelemetrySimulator';
import MaintenanceOptimization from './components/MaintenanceOptimization';
import { Activity, Settings, RefreshCw } from 'lucide-react';

function App() {
  const [currentView, setView] = useState('overview');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Settings & Config
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/api');
  const [backendOnline, setBackendOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Global Dashboard Data
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [latestUpdate, setLatestUpdate] = useState(null);

  // Fetch summary and devices list
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Check API Connection & Fetch Summary
      const summaryRes = await fetch(`${apiUrl}/dashboard/summary`);
      if (!summaryRes.ok) throw new Error('Failed to fetch summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
      setBackendOnline(true);

      // 2. Fetch Devices List
      const devicesRes = await fetch(`${apiUrl}/dashboard/devices`);
      if (!devicesRes.ok) throw new Error('Failed to fetch devices');
      const devicesData = await devicesRes.json();
      setDevices(devicesData);
    } catch (err) {
      console.error('API Error:', err.message);
      setBackendOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, [apiUrl]);

  // Initial load and periodic polling
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000); // refresh stats every 8 seconds
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    if (!apiUrl) return;

    const baseApi = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const sseUrl = `${baseApi}/dashboard/stream`;
    console.log(`[SSE] Establishing live stream connection to ${sseUrl}...`);
    
    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TELEMETRY_UPDATE') {
            console.log('[SSE] Live update received:', data);
            
            // 1. Update latest update state for propagation
            setLatestUpdate(data);

            // 2. Update global summary counters
            if (data.summary) {
              setSummary(data.summary);
            }

            // 3. Update devices list in-place
            setDevices(prevDevices => {
              const updatedDevice = {
                ...data.device,
                latestPrediction: data.prediction
              };
              const exists = prevDevices.some(d => d.deviceId === data.deviceId);
              if (exists) {
                return prevDevices.map(d => d.deviceId === data.deviceId ? updatedDevice : d);
              } else {
                return [updatedDevice, ...prevDevices];
              }
            });
            
            setBackendOnline(true);
          }
        } catch (err) {
          console.error('[SSE] Failed to parse stream event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[SSE] EventSource encountered an error. It will auto-reconnect.', err);
      };
    } catch (err) {
      console.error('[SSE] Failed to initialize EventSource:', err);
    }

    return () => {
      if (eventSource) {
        console.log('[SSE] Closing live stream connection.');
        eventSource.close();
      }
    };
  }, [apiUrl]);

  // Navigation title mapper
  const getViewTitle = () => {
    switch (currentView) {
      case 'overview':
        return 'system overview';
      case 'alerts':
        return 'active system alerts';
      case 'devices':
        return selectedDeviceId ? 'device analytics' : 'registered devices';
      case 'predictions':
        return 'ml failure predictions';
      case 'maintenance':
        return 'maintenance optimization';
      case 'simulator':
        return 'telemetry agent simulator';
      case 'health':
        return 'platform & ml health';
      default:
        return 'predictx dashboard';
    }
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setView('devices');
  };

  const handleBackToList = () => {
    setSelectedDeviceId(null);
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setView(view);
          if (view !== 'devices') setSelectedDeviceId(null); // Reset detail view on route change
        }}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        backendOnline={backendOnline}
        summary={summary}
      />

      {/* Main Workspace Area */}
      <main className="main-workspace">
        {/* Top Sticky Header */}
        <header className="header">
          <div className="header-title">
            <h1>{getViewTitle()}</h1>
          </div>
          
          <div className="header-actions">
            {/* Refresh status */}
            <button 
              className="btn btn-secondary" 
              onClick={fetchDashboardData}
              disabled={refreshing}
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw 
                size={14} 
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              />
              sync
            </button>

            {/* Editable API URL */}
            <div className="api-badge">
              <Settings size={14} />
              <span>api url:</span>
              <input 
                type="text" 
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:5000/api"
              />
            </div>
          </div>
        </header>

        {/* View Router */}
        {currentView === 'overview' && (
          <Overview 
            summary={summary} 
            devices={devices} 
            setView={setView}
            setSelectedDeviceId={setSelectedDeviceId}
          />
        )}

        {currentView === 'alerts' && (
          <Alerts devices={devices} setView={setView} setSelectedDeviceId={setSelectedDeviceId} />
        )}

        {currentView === 'devices' && (
          selectedDeviceId ? (
            <DeviceDetail 
              deviceId={selectedDeviceId} 
              onBack={handleBackToList}
              apiUrl={apiUrl}
              latestUpdate={latestUpdate}
            />
          ) : (
            <DeviceList 
              devices={devices} 
              onSelectDevice={handleSelectDevice}
            />
          )
        )}

        {currentView === 'predictions' && (
          <PredictionView devices={devices} />
        )}

        {currentView === 'maintenance' && (
          <MaintenanceOptimization devices={devices} />
        )}

        {currentView === 'simulator' && (
          <TelemetrySimulator 
            apiUrl={apiUrl}
            onTriggerRefresh={fetchDashboardData}
          />
        )}

        {currentView === 'health' && (
          <SystemHealth backendOnline={backendOnline} />
        )}
      </main>
    </div>
  );
}

export default App;
