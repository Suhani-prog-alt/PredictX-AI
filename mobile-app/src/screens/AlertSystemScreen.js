import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { fetchTelemetry } from '../services/api';

export default function AlertSystemScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Filter ONLY Critical and Warning devices
  const alertDevices = devices.filter(d => 
    d.prediction?.riskLevel === 'Critical' || d.prediction?.riskLevel === 'Warning'
  );

  // Sort Critical first
  const sortedAlerts = alertDevices.sort((a, b) => {
    const order = { 'Critical': 1, 'Warning': 2 };
    return order[a.prediction.riskLevel] - order[b.prediction.riskLevel];
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Active Alerts</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{sortedAlerts.length}</Text>
        </View>
      </View>

      <FlatList
        data={sortedAlerts}
        keyExtractor={(item, index) => item.deviceId + index}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        renderItem={({ item }) => {
          const riskLevel = item.prediction.riskLevel;
          const riskColor = riskLevel === 'Critical' ? '#EF4444' : '#F59E0B';
          return (
            <TouchableOpacity 
              style={[styles.deviceCard, { borderColor: riskColor + '80' }]}
              onPress={() => navigation.navigate('AlertsDetail', { device: item })}
            >
              <View>
                <Text style={styles.deviceName}>{item.deviceId}</Text>
                <Text style={styles.deviceDetail}>{item.manufacturer} {item.model}</Text>
                <Text style={[styles.predictionText, { color: riskColor }]}>
                  ⚠️ {item.prediction.predictedComponent || 'System'} issue detected
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
                <Text style={[styles.badgeText, { color: riskColor }]}>{riskLevel}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>All systems operational. No active alerts.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginRight: 12 },
  badgeCount: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeCountText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  deviceCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  deviceName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  deviceDetail: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  predictionText: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#94A3B8', textAlign: 'center', fontSize: 16 }
});
