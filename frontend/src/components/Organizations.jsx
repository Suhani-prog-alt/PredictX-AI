import React, { useState, useEffect } from 'react';
import { Building, Plus, CheckCircle, XCircle, Shield, FileText, Lock } from 'lucide-react';

export default function Organizations({ setActiveOrgId, setView }) {
  const [organizations, setOrganizations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    orgId: '',
    contactEmail: '',
    passcode: '',
    anonymizeDeviceIds: false,
    collectProcessCount: true,
    dataRetentionDays: 30
  });

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockOrgId, setUnlockOrgId] = useState(null);
  const [unlockPasscode, setUnlockPasscode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const apiUrl = 'http://localhost:5000/api';

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/organizations`);
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleTogglePrivacy = async (e, orgId, currentPolicy, field) => {
    e.stopPropagation(); // prevent row click
    
    try {
      const updatedPolicy = {
        anonymizeDeviceIds: currentPolicy.anonymizeDeviceIds,
        collectProcessCount: currentPolicy.collectProcessCount,
        dataRetentionDays: currentPolicy.dataRetentionDays,
        [field]: !currentPolicy[field]
      };

      const res = await fetch(`${apiUrl}/organizations/${orgId}/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPolicy)
      });
      
      if (res.ok) {
        fetchOrganizations();
        setToastMsg(`Privacy settings updated successfully!`);
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update privacy policy:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        companyName: formData.companyName,
        orgId: formData.orgId,
        contactEmail: formData.contactEmail,
        passcode: formData.passcode,
        privacyPolicy: {
          anonymizeDeviceIds: formData.anonymizeDeviceIds,
          collectProcessCount: formData.collectProcessCount,
          dataRetentionDays: parseInt(formData.dataRetentionDays, 10)
        }
      };
      
      const res = await fetch('http://localhost:5000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to create organization');
      
      setShowModal(false);
      setFormData({
        companyName: '', orgId: '', contactEmail: '', passcode: '', 
        anonymizeDeviceIds: false, collectProcessCount: true, dataRetentionDays: 30
      });
      fetchOrganizations();
    } catch (err) {
      alert('Error creating organization. ID might already exist.');
      console.error(err);
    }
  };

  const handleRowClick = (orgId) => {
    setUnlockOrgId(orgId);
    setUnlockPasscode('');
    setUnlockError('');
    setUnlockModalOpen(true);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    try {
      const res = await fetch('http://localhost:5000/api/organizations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: unlockOrgId, passcode: unlockPasscode })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setUnlockModalOpen(false);
        if (setActiveOrgId) setActiveOrgId(unlockOrgId);
        if (setView) setView('overview');
      } else {
        setUnlockError(data.error || 'Invalid passcode');
      }
    } catch (err) {
      setUnlockError('Server error verifying passcode');
      console.error(err);
    }
  };

  return (
    <div className="content-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={24} color="var(--color-primary)" />
            Organizations
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Manage registered clients and data privacy policies
          </p>
        </div>
        
        {toastMsg && (
          <div style={{ background: 'var(--color-success)', color: '#000', padding: '8px 16px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            ✓ {toastMsg}
          </div>
        )}

        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}>
          <Plus size={16} /> register new organization
        </button>
      </div>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '12px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Org ID</th>
              <th style={{ padding: '12px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Privacy Policy</th>
              <th style={{ padding: '12px 0', fontSize: '0.8rem', textTransform: 'uppercase' }}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {organizations.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No organizations found. Register your first client.
                </td>
              </tr>
            ) : (
              <>
                <tr 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="org-row-hover"
                  onClick={() => {
                    if (setActiveOrgId) setActiveOrgId('ALL');
                    if (setView) setView('overview');
                  }}
                >
                  <td style={{ padding: '16px 0', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                      <Building size={16} />
                      Show All Organizations (Global View)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '24px' }}>
                      Unified fleet management across all client tenants
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    ALL
                  </td>
                  <td style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    N/A (Bypassed)
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    System Default
                  </td>
                </tr>
                {organizations.map(org => (
                <tr 
                  key={org._id} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                  className="org-row-hover"
                  onClick={() => handleRowClick(org.orgId)}
                >
                  <td style={{ padding: '16px 0', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={16} color="var(--color-primary)" />
                      {org.companyName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '24px' }}>
                      {org.contactEmail}
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {org.orgId}
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
                      <div 
                        onClick={(e) => handleTogglePrivacy(e, org.orgId, org.privacyPolicy, 'anonymizeDeviceIds')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: org.privacyPolicy.anonymizeDeviceIds ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: org.privacyPolicy.anonymizeDeviceIds ? 'var(--color-success)' : 'var(--text-secondary)' }}
                        title="Click to toggle Device ID Anonymization"
                      >
                        <Shield size={14} /> Anonymize IDs
                      </div>
                      <div 
                        onClick={(e) => handleTogglePrivacy(e, org.orgId, org.privacyPolicy, 'collectProcessCount')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: !org.privacyPolicy.collectProcessCount ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: !org.privacyPolicy.collectProcessCount ? 'var(--color-success)' : 'var(--text-secondary)' }}
                        title="Click to toggle Process Tracking"
                      >
                        <FileText size={14} /> Hide Processes
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
              }
              </>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '90%', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Register Organization</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Company Name</label>
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }} placeholder="e.g. Dell Technologies" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Organization ID (Unique)</label>
                <input required type="text" name="orgId" value={formData.orgId} onChange={handleInputChange} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontFamily: 'var(--font-mono)' }} placeholder="e.g. dell-corp" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Contact Email</label>
                <input required type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }} placeholder="it-admin@example.com" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Access Passcode</label>
                <input required type="password" name="passcode" value={formData.passcode} onChange={handleInputChange} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontFamily: 'var(--font-mono)' }} placeholder="Set a secure passcode" />
              </div>

              <div style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} color="var(--color-primary)" /> Privacy Policy Settings</h3>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="anonymizeDeviceIds" checked={formData.anonymizeDeviceIds} onChange={handleInputChange} />
                  <span style={{ fontSize: '0.9rem' }}>Anonymize Device Hostnames (Strict Privacy)</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="collectProcessCount" checked={formData.collectProcessCount} onChange={handleInputChange} />
                  <span style={{ fontSize: '0.9rem' }}>Collect Running Process Count</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                  <span style={{ fontSize: '0.9rem' }}>Data Retention:</span>
                  <input type="number" name="dataRetentionDays" value={formData.dataRetentionDays} onChange={handleInputChange} style={{ width: '80px', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }} min="1" max="365" />
                  <span style={{ fontSize: '0.9rem' }}>days</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unlockModalOpen && (
        <div className="modal-overlay" onClick={() => setUnlockModalOpen(false)} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '400px', maxWidth: '90%', padding: '32px' }}>
            <h2 style={{ marginBottom: '8px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={20} color="var(--color-primary)" /> Unlock Organization</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Enter the passcode to access {unlockOrgId}'s data.</p>
            
            <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input 
                  autoFocus
                  required 
                  type="password" 
                  value={unlockPasscode} 
                  onChange={(e) => setUnlockPasscode(e.target.value)} 
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)' }} 
                  placeholder="••••••••" 
                />
              </div>

              {unlockError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(240, 74, 74, 0.1)', padding: '8px', borderRadius: '4px' }}>
                  {unlockError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setUnlockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authenticate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
