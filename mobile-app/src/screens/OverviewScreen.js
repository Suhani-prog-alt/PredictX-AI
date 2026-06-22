import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView, RefreshControl } from 'react-native';
import { fetchTelemetry } from '../services/api';
import DeviceHealthWidget from '../components/DeviceHealthWidget';
import FailureDistributionWidget from '../components/FailureDistributionWidget';
import SystemAlertsWidget from '../components/SystemAlertsWidget';

export default function OverviewScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchTelemetry();
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const simulateAlert = () => {
    alert("Simulation injected! Switch to the Devices tab to see it.");
  };

  const criticalCount = devices.filter(d => (d.latestPrediction || d.prediction)?.riskLevel === 'Critical').length;
  const warningCount = devices.filter(d => (d.latestPrediction || d.prediction)?.riskLevel === 'Warning').length;
  const stableCount = devices.length - criticalCount - warningCount;

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>PredictX-AI Overview</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Global Fleet Health</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{devices.length}</Text>
            <Text style={styles.statLabel}>Total Devices</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#334155' }]}>
            <Text style={[styles.statValue, { color: criticalCount > 0 ? '#EF4444' : '#10B981' }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#334155' }]}>
            <Text style={[styles.statValue, { color: warningCount > 0 ? '#F59E0B' : '#10B981' }]}>{warningCount}</Text>
            <Text style={styles.statLabel}>Warning</Text>
          </View>
        </View>
      </View>

      {/* New Dashboard Widgets */}
      <DeviceHealthWidget healthy={stableCount} warning={warningCount} critical={criticalCount} />
      <FailureDistributionWidget devices={devices} />
      <SystemAlertsWidget devices={devices} navigation={navigation} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Activity</Text>
        <View style={styles.divider} />
        <Text style={styles.activityText}>• {stableCount} devices operating normally.</Text>
        <Text style={styles.activityText}>• ML Models polling every 10 seconds.</Text>
        <Text style={styles.activityText}>• Anomaly detection engines active.</Text>
      </View>

      <TouchableOpacity style={styles.simulateBtn} onPress={simulateAlert}>
        <Text style={styles.simulateBtnText}>🚨 Simulate Emergency</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Connection Settings</Text>
            <Text style={styles.modalText}>Backend API Connected</Text>
            <Text style={styles.modalText}>Org ID: dell-hackathon-2026</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  settingsIcon: { fontSize: 24 },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 16, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#F8FAFC', fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  activityText: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  simulateBtn: { backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  simulateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalText: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  modalButton: { marginTop: 20, backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' }
});
