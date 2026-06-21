import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { resolveAlert, fetchDeviceDetail } from '../services/api';

const TelemetryWidget = ({ label, value, color }) => (
  <View style={[styles.widget, { borderLeftColor: color }]}>
    <Text style={styles.widgetLabel}>{label}</Text>
    <Text style={[styles.widgetValue, { color }]}>{value}</Text>
  </View>
);

export default function AlertManagementScreen({ route, navigation }) {
  const { device: initialDevice } = route.params || {};
  
  const [device, setDevice] = useState(initialDevice);
  const [telemetry, setTelemetry] = useState(null);
  const [prediction, setPrediction] = useState(initialDevice?.prediction || {});
  
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!initialDevice) return;
    
    let isMounted = true;
    const loadDetails = async () => {
      try {
        // If it's a simulated device, mock the telemetry
        if (initialDevice.deviceId.startsWith('SIM-')) {
          setTelemetry({
            cpuTemp: 89.5,
            cpuUsage: initialDevice.cpu,
            ramUsage: initialDevice.ram,
            diskUsage: initialDevice.disk,
            fanRpm: 5800,
            batteryHealth: 45,
            psuVoltageFluctuation: 1.15,
            smartReallocatedSectors: 2
          });
          setLoading(false);
          return;
        }

        const data = await fetchDeviceDetail(initialDevice.deviceId);
        if (isMounted) {
          if (data.device) setDevice(data.device);
          if (data.latestPrediction) setPrediction(data.latestPrediction);
          if (data.recentTelemetry && data.recentTelemetry.length > 0) {
            setTelemetry(data.recentTelemetry[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch detailed telemetry, using fallback.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadDetails();
    return () => { isMounted = false; };
  }, [initialDevice]);

  if (!initialDevice) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>No device selected</Text>
      </View>
    );
  }

  const riskLevel = prediction.riskLevel || 'Stable';
  const riskColor = riskLevel === 'Critical' ? '#EF4444' : riskLevel === 'Warning' ? '#F59E0B' : '#10B981';

  const handleResolve = async () => {
    try {
      setResolving(true);
      if (!device.deviceId.startsWith('SIM-')) {
        await resolveAlert(device.deviceId);
      }
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const getMetricColor = (val, highIsBad = true) => {
    if (val === undefined || val === null) return '#F8FAFC';
    if (highIsBad) {
      if (val > 85) return '#EF4444';
      if (val > 65) return '#F59E0B';
      return '#F8FAFC';
    } else {
      if (val < 20) return '#EF4444';
      if (val < 50) return '#F59E0B';
      return '#F8FAFC';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Organization Badge */}
      <View style={styles.orgBadge}>
        <Text style={styles.orgBadgeText}>org :: {device.orgId || 'dell-hackathon-2026'}</Text>
      </View>

      <View style={styles.headerTop}>
        <Text style={styles.deviceName}>{device.deviceId}</Text>
        <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.badgeText, { color: riskColor }]}>{riskLevel}</Text>
        </View>
      </View>

      {/* Hardware Profile Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>hardware_profile</Text>
        <View style={styles.divider} />
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>ttf</Text>
          <Text style={[styles.dataValue, { color: '#F59E0B' }]}>
            {prediction.estimatedFailureWindow || 'Stable'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>brand</Text>
          <Text style={styles.dataValue}>{device.manufacturer || 'unknown'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>model</Text>
          <Text style={styles.dataValue}>{device.model || 'unknown'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>processor</Text>
          <Text style={styles.dataValue}>{typeof device.cpu === 'string' ? device.cpu : 'intel cpu'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>ram</Text>
          <Text style={styles.dataValue}>{typeof device.ram === 'string' ? device.ram : `${device.ram} gb`}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>storage</Text>
          <Text style={styles.dataValue}>{typeof device.storage === 'string' ? device.storage : `${device.disk} gb`}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>os</Text>
          <Text style={styles.dataValue}>{device.os || 'windows 11'}</Text>
        </View>
      </View>

      {/* Action Recommendations */}
      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <View style={[styles.card, { borderColor: '#F59E0B50' }]}>
          <Text style={styles.cardTitle}>action_recommendations</Text>
          <View style={styles.divider} />
          {prediction.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.checkboxRow}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxText}>{rec.toLowerCase()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Live Telemetry Grid */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>live_telemetry</Text>
        <View style={styles.divider} />
        
        {loading ? (
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 20 }} />
        ) : telemetry ? (
          <View style={styles.gridContainer}>
            <TelemetryWidget label="cpu_temp" value={`${telemetry.cpuTemp}°c`} color={getMetricColor(telemetry.cpuTemp)} />
            <TelemetryWidget label="cpu_usage" value={`${telemetry.cpuUsage}%`} color={getMetricColor(telemetry.cpuUsage)} />
            <TelemetryWidget label="ram_usage" value={`${telemetry.ramUsage}%`} color={getMetricColor(telemetry.ramUsage)} />
            <TelemetryWidget label="storage_used" value={`${telemetry.diskUsage}%`} color={getMetricColor(telemetry.diskUsage)} />
            <TelemetryWidget label="fan_rpm" value={telemetry.fanRpm} color="#38BDF8" />
            <TelemetryWidget label="battery" value={`${telemetry.batteryHealth}%`} color={getMetricColor(telemetry.batteryHealth, false)} />
            {telemetry.psuVoltageFluctuation !== undefined && (
              <TelemetryWidget label="cpu_vrm_voltage" value={`${telemetry.psuVoltageFluctuation.toFixed(3)} v`} color="#F59E0B" />
            )}
            {telemetry.smartReallocatedSectors !== undefined && (
              <TelemetryWidget label="smart_sectors" value={telemetry.smartReallocatedSectors} color={telemetry.smartReallocatedSectors > 0 ? '#EF4444' : '#F8FAFC'} />
            )}
          </View>
        ) : (
          <Text style={styles.text}>No live telemetry data available.</Text>
        )}
      </View>

      {riskLevel !== 'Stable' && (
        <TouchableOpacity 
          style={styles.resolveButton} 
          onPress={handleResolve}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  text: { color: '#94A3B8', fontSize: 12, textTransform: 'lowercase' },
  orgBadge: { alignSelf: 'flex-start', backgroundColor: '#0ea5e920', borderColor: '#0ea5e950', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginBottom: 16 },
  orgBadgeText: { color: '#0ea5e9', fontFamily: 'monospace', fontSize: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  deviceName: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#1E293B', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dataLabel: { color: '#94A3B8', fontSize: 14, fontFamily: 'monospace' },
  dataValue: { color: '#F8FAFC', fontSize: 14, fontFamily: 'monospace', textTransform: 'lowercase', textAlign: 'right', flex: 1, marginLeft: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderColor: '#64748B', borderRadius: 3, marginRight: 12 },
  checkboxText: { color: '#F8FAFC', fontSize: 14, fontFamily: 'monospace', flex: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  widget: { width: '48%', backgroundColor: '#0F172A', padding: 12, borderRadius: 6, marginBottom: 12, borderLeftWidth: 3 },
  widgetLabel: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', marginBottom: 6 },
  widgetValue: { fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  resolveButton: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  resolveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }
});
