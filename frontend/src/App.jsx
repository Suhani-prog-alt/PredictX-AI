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
import Diagnostics from './components/Diagnostics';
import Organizations from './components/Organizations';
import OnboardingFlow from './components/OnboardingFlow';
import ModelTraining from './components/ModelTraining';
import VendorIntegration from './components/VendorIntegration';
import { Activity, Settings, X, Building, BrainCircuit } from 'lucide-react';

function App() {
  const [currentView, setView] = useState('overview');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Settings & Config
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/api');
  const [backendOnline, setBackendOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'device'
  const [myDeviceId, setMyDeviceId] = useState(null);

  // Global Dashboard Data
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState('ALL');

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

      // 3. Fetch Organizations
      try {
        const orgsRes = await fetch(`${apiUrl}/organizations`);
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          setOrgsList(orgsData);
        }
      } catch (e) {
        // Non-fatal
      }
    } catch (err) {
      console.error('API Error:', err.message);
      setBackendOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, [apiUrl]);

  // Initial load and periodic polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 8000); // refresh stats every 8 seconds
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, isAuthenticated]);

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    if (!apiUrl || !isAuthenticated) return;

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
            
            // 4. Trigger Toast Notification for Escalated Alerts
            if (data.prediction && (data.prediction.riskLevel === 'critical' || data.prediction.riskLevel === 'warning')) {
              setNotifications(prev => {
                const newNotif = {
                  id: Date.now(),
                  message: `[${data.prediction.riskLevel.toUpperCase()}] Device ${data.deviceId}: ${data.prediction.rootCause}`,
                  type: data.prediction.riskLevel
                };
                return [newNotif, ...prev].slice(0, 3); // keep up to 3 notifications
              });
              
              // auto dismiss
              setTimeout(() => {
                setNotifications(prev => prev.slice(0, prev.length - 1));
              }, 8000);
            }

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
      case 'organizations':
        return 'tenant management';
      case 'diagnostics':
        return 'interactive diagnostics';
      case 'vendor':
        return 'vendor integration';
      default:
        return 'predictx dashboard';
    }
  };

  const filteredDevices = activeOrgId === 'ALL' ? devices : devices.filter(d => d.orgId === activeOrgId);
  const filteredSummary = activeOrgId === 'ALL' ? summary : {
    totalDevices: filteredDevices.length,
    criticalDevices: filteredDevices.filter(d => d.latestPrediction?.riskLevel === 'critical').length,
    warningDevices: filteredDevices.filter(d => d.latestPrediction?.riskLevel === 'warning').length,
    healthyDevices: filteredDevices.filter(d => d.latestPrediction?.riskLevel === 'low').length,
    topAiDrivers: summary?.topAiDrivers || []
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setView('devices');
  };

  const handleBackToList = () => {
    setSelectedDeviceId(null);
  };

  const handleOnboardingComplete = (orgId, deviceId, role) => {
    setActiveOrgId(orgId);
    setMyDeviceId(deviceId);
    setUserRole(role);
    setIsAuthenticated(true);
    
    // If logging in as a device, we could set the view to 'devices' and pre-select it
    // But for now, we will drop everyone in the overview, and filter their view
  };

  if (!isAuthenticated) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} apiUrl={apiUrl} />;
  }

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setView(view);
          setSelectedDeviceId(null); // Reset detail view on any sidebar route change
        }}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        backendOnline={backendOnline}
        summary={filteredSummary}
        onLogout={() => setIsAuthenticated(false)}
        activeOrgName={activeOrgId !== 'ALL' ? (orgsList.find(o => o.orgId === activeOrgId)?.companyName || activeOrgId) : 'PredictX Global'}
      />

      {/* Main Workspace Area */}
      <main className="main-workspace">
        {/* Top Sticky Header */}
        <header className="header">
          <div className="header-title">
            <h1>{getViewTitle()}</h1>
          </div>
          
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setView('organizations')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid var(--border-color)', background: 'var(--bg-lighter)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}>
              <Building size={16} />
              Organizations
            </button>
          </div>
        </header>

        {/* View Router */}
        {selectedDeviceId ? (
          <DeviceDetail 
            deviceId={selectedDeviceId} 
            onBack={handleBackToList}
            apiUrl={apiUrl}
            latestUpdate={latestUpdate}
          />
        ) : (
          <>
            {currentView === 'overview' && (
              <Overview 
                summary={filteredSummary} 
                devices={filteredDevices} 
                setView={setView}
                setSelectedDeviceId={setSelectedDeviceId}
              />
            )}

            {currentView === 'alerts' && (
              <Alerts devices={filteredDevices} setView={setView} setSelectedDeviceId={setSelectedDeviceId} />
            )}

            {currentView === 'devices' && (
              <DeviceList 
                devices={filteredDevices} 
                onSelectDevice={handleSelectDevice}
              />
            )}

            {currentView === 'predictions' && (
              <PredictionView devices={filteredDevices} />
            )}

            {currentView === 'maintenance' && (
              <MaintenanceOptimization devices={filteredDevices} />
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

            {currentView === 'diagnostics' && (
              <Diagnostics apiUrl={apiUrl} />
            )}

            {currentView === 'organizations' && (
              <Organizations 
                setActiveOrgId={setActiveOrgId} 
                setView={setView} 
              />
            )}
            {currentView === 'model' && <ModelTraining apiUrl={apiUrl} />}
            {currentView === 'vendor' && <VendorIntegration apiUrl={apiUrl} />}
          </>
        )}
      </main>
      
      {/* Toast Notifications Layer */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: 'rgba(20,20,25,0.95)',
            borderLeft: `4px solid ${n.type === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)'}`,
            padding: '16px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            color: '#fff',
            maxWidth: '350px',
            fontSize: '13px',
            animation: 'fadeIn 0.3s ease-out',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
            <div style={{ paddingRight: '16px' }}>
              {n.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
