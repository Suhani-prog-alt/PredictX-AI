import React, { useState, useEffect } from 'react';
import { Building, Laptop, Shield, ChevronRight, CheckCircle, Activity, HardDrive, Cpu, Database, Command } from 'lucide-react';
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
export default function OnboardingFlow({ onComplete, apiUrl }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null); // 'admin' or 'device'
  
  // Auth state
  const [orgId, setOrgId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Create Org state
  const [newOrgForm, setNewOrgForm] = useState({
    companyName: '',
    orgId: '',
    contactEmail: '',
    passcode: ''
  });
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState('');

  // Device registration state
  const [deviceSpecs, setDeviceSpecs] = useState({
    hostname: '',
    manufacturer: '',
    model: '',
    os: '',
    cpu: '',
    ram: '',
    storage: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [localDeviceId, setLocalDeviceId] = useState('');

  // Generate or get local device ID on mount and auto-detect hardware
  useEffect(() => {
    let storedId = localStorage.getItem('predictx_device_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('predictx_device_id', storedId);
    }
    setLocalDeviceId(storedId);

    // Attempt to auto-detect hardware info from browser
    const userAgent = navigator.userAgent;
    let detectedOS = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) detectedOS = 'Windows';
    if (userAgent.indexOf('Mac') !== -1) detectedOS = 'macOS';
    if (userAgent.indexOf('Linux') !== -1) detectedOS = 'Linux';
    if (userAgent.indexOf('Android') !== -1) detectedOS = 'Android';
    if (userAgent.indexOf('like Mac') !== -1) detectedOS = 'iOS';

    const memoryGB = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '';
    const cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}-Core Processor` : '';

    setDeviceSpecs(prev => ({
      ...prev,
      os: detectedOS,
      ram: memoryGB,
      cpu: cpuCores,
      hostname: `Device-${storedId.substring(0, 6).toUpperCase()}`
    }));
  }, []);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    try {
      const res = await fetch(`${apiUrl}/organizations/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, passcode })
      });

      if (!res.ok) {
        throw new Error('Invalid organization code or passcode');
      }

      // If successful
      if (role === 'admin') {
        // Admin goes straight to dashboard
        onComplete(orgId, null, 'admin');
      } else {
        // Device check
        // Let's check if the device already exists in this org
        const devRes = await fetch(`${apiUrl}/dashboard/devices`);
        if (devRes.ok) {
          const devices = await devRes.json();
          const existingDevice = devices.find(d => d.deviceId === localDeviceId && d.orgId === orgId);
          if (existingDevice) {
            // Already registered
            onComplete(orgId, localDeviceId, 'device');
          } else {
            // Needs registration
            setStep(3);
          }
        } else {
          setStep(3); // fallback
        }
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setCreateOrgError('');
    setIsCreatingOrg(true);
    
    try {
      const payload = {
        ...newOrgForm,
        privacyPolicy: {
          anonymizeDeviceIds: false,
          collectProcessCount: true,
          dataRetentionDays: 30
        }
      };

      const res = await fetch(`${apiUrl}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Failed to create organization. ID might already exist.');
      }
      
      // Successfully created! Log them in automatically.
      onComplete(newOrgForm.orgId, null, 'admin');
    } catch (err) {
      setCreateOrgError(err.message);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // Simulate an initial telemetry payload to register the device
      const payload = {
        deviceId: localDeviceId,
        orgId: orgId,
        ...deviceSpecs,
        // Mock telemetry data so the backend accepts it
        cpuUsage: 10,
        ramUsage: 20,
        cpuTemp: 40,
        gpuTemp: 40,
        batteryHealth: 100,
        diskReadWrite: 5,
        networkTraffic: 10,
        activeProcesses: 50,
        uptime: 100,
        timestamp: new Date().toISOString()
      };

      const res = await fetch(`${apiUrl}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to register device');

      setStep(5);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-card animated-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Activity size={48} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>Welcome to PredictX</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Advanced telemetry and predictive maintenance.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>
          Select your role to continue
        </p>

        <button 
          className="role-select-btn"
          onClick={() => handleRoleSelect('device')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
            background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ background: 'var(--color-primary-glow)', padding: '12px', borderRadius: '50%' }}>
            <Laptop size={24} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1rem' }}>Register Device</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Enroll this machine into your organization's telemetry pool.</p>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button 
          className="role-select-btn"
          onClick={() => handleRoleSelect('admin')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
            background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-info)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ background: 'var(--color-info-glow)', padding: '12px', borderRadius: '50%' }}>
            <Shield size={24} color="var(--color-info)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1rem' }}>Head of Organization</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Access the admin dashboard to monitor your fleet.</p>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button 
          className="role-select-btn"
          onClick={() => { setRole('create'); setStep(4); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
            background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-success)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <div style={{ background: 'var(--color-success-glow)', padding: '12px', borderRadius: '50%' }}>
            <Building size={24} color="var(--color-success)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1rem' }}>Register New Organization</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Create a completely new tenant environment for your business.</p>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-card animated-fade-in" style={{ width: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        {role === 'admin' ? (
          <Shield size={40} color="var(--color-info)" style={{ marginBottom: '16px' }} />
        ) : (
          <Laptop size={40} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
        )}
        <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
          {role === 'admin' ? 'Admin Login' : 'Device Authentication'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter your organization credentials.
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Organization Code</label>
          <input 
            type="text" 
            placeholder="e.g. dell-hackathon-2026"
            value={orgId}
            onChange={e => setOrgId(e.target.value)}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Passcode</label>
          <input 
            type="password" 
            placeholder="Enter passcode"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>

        {authError && (
          <div style={{ padding: '12px', background: 'var(--color-danger-glow)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem' }}>
            {authError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button" 
            onClick={() => setStep(1)}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
          >
            Back
          </button>
          <button 
            type="submit" 
            disabled={isVerifying || !orgId || !passcode}
            style={{ flex: 2, padding: '12px', background: role === 'admin' ? 'var(--color-info)' : 'var(--color-primary)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: 'var(--radius-sm)', cursor: (isVerifying || !orgId || !passcode) ? 'not-allowed' : 'pointer', opacity: (isVerifying || !orgId || !passcode) ? 0.7 : 1 }}
          >
            {isVerifying ? 'Verifying...' : 'Authenticate'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-card animated-fade-in" style={{ width: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Register Hardware</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Authenticated with <strong>{orgId}</strong>. Enter device specs.
        </p>
      </div>

      <form onSubmit={handleRegisterDevice} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Laptop size={14}/> Hostname</label>
          <input required type="text" placeholder="e.g. DELL-DEV-001" value={deviceSpecs.hostname} onChange={e => setDeviceSpecs({...deviceSpecs, hostname: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>
        
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Building size={14}/> Brand</label>
          <input required type="text" placeholder="e.g. Dell" value={deviceSpecs.manufacturer} onChange={e => setDeviceSpecs({...deviceSpecs, manufacturer: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Laptop size={14}/> Model</label>
          <input required type="text" placeholder="e.g. XPS 15" value={deviceSpecs.model} onChange={e => setDeviceSpecs({...deviceSpecs, model: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Command size={14}/> OS</label>
          <input required type="text" placeholder="e.g. Windows 11 Pro" value={deviceSpecs.os} onChange={e => setDeviceSpecs({...deviceSpecs, os: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Cpu size={14}/> Processor</label>
          <input required type="text" placeholder="e.g. Intel i7" value={deviceSpecs.cpu} onChange={e => setDeviceSpecs({...deviceSpecs, cpu: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><Database size={14}/> RAM</label>
          <input required type="text" placeholder="e.g. 32 GB" value={deviceSpecs.ram} onChange={e => setDeviceSpecs({...deviceSpecs, ram: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}><HardDrive size={14}/> Storage</label>
          <input required type="text" placeholder="e.g. 1TB NVMe" value={deviceSpecs.storage} onChange={e => setDeviceSpecs({...deviceSpecs, storage: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }} />
        </div>

        {authError && (
          <div style={{ gridColumn: '1 / -1', padding: '12px', background: 'var(--color-danger-glow)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem' }}>
            {authError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isRegistering}
          style={{ gridColumn: '1 / -1', marginTop: '16px', padding: '14px', background: 'var(--color-success)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: 'var(--radius-sm)', cursor: isRegistering ? 'not-allowed' : 'pointer', opacity: isRegistering ? 0.7 : 1 }}
        >
          {isRegistering ? 'Registering Device...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-card animated-fade-in" style={{ width: '450px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Building size={40} color="var(--color-success)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Register Organization</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Setup a new tenant for PredictX telemetry.
        </p>
      </div>

      <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Company Name</label>
          <input 
            type="text" 
            placeholder="e.g. Acme Corp"
            value={newOrgForm.companyName}
            onChange={e => setNewOrgForm({...newOrgForm, companyName: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Organization ID (Unique Code)</label>
          <input 
            type="text" 
            placeholder="e.g. acme-corp"
            value={newOrgForm.orgId}
            onChange={e => setNewOrgForm({...newOrgForm, orgId: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Admin Email</label>
          <input 
            type="email" 
            placeholder="admin@acme.com"
            value={newOrgForm.contactEmail}
            onChange={e => setNewOrgForm({...newOrgForm, contactEmail: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Admin Passcode</label>
          <input 
            type="password" 
            placeholder="Create a secure passcode"
            value={newOrgForm.passcode}
            onChange={e => setNewOrgForm({...newOrgForm, passcode: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--bg-base)', 
              border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)',
              outline: 'none', boxSizing: 'border-box'
            }}
            required
          />
        </div>

        {createOrgError && (
          <div style={{ background: 'var(--color-danger-glow)', color: 'var(--color-danger)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid var(--color-danger)' }}>
            {createOrgError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button" 
            onClick={() => { setStep(1); setRole(null); }}
            style={{ 
              flex: 1, padding: '14px', background: 'transparent', 
              border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, cursor: 'pointer'
            }}
            disabled={isCreatingOrg}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={isCreatingOrg}
            style={{ 
              flex: 2, padding: '14px', background: 'var(--color-success)', 
              border: 'none', color: '#000', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, cursor: isCreatingOrg ? 'not-allowed' : 'pointer',
              opacity: isCreatingOrg ? 0.7 : 1
            }}
          >
            {isCreatingOrg ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-card animated-fade-in" style={{ width: '400px', textAlign: 'center' }}>
      <div style={{ background: 'var(--color-success-glow)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
        <CheckCircle size={40} color="var(--color-success)" />
      </div>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '12px' }}>Registration Successful!</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.5' }}>
        Your device <strong>{deviceSpecs.hostname}</strong> has been successfully enrolled into the <strong>{orgId}</strong> telemetry pool.
      </p>
      
      <button 
        onClick={() => onComplete(orgId, localDeviceId, 'device')}
        style={{ 
          width: '100%', padding: '14px', background: 'var(--color-primary)', 
          border: 'none', color: '#000', fontWeight: 'bold', borderRadius: 'var(--radius-sm)', 
          cursor: 'pointer' 
        }}
      >
        Enter Dashboard
      </button>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
      padding: '20px'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .onboarding-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          width: 100%;
          max-width: 500px;
          box-sizing: border-box;
        }
        .animated-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}
