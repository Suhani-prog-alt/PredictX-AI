import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { fetchTelemetry } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const filteredDevices = devices.filter(d => 
    d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.prediction?.riskLevel || 'Stable').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Device Registry</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by ID, manufacturer, or status..."
        placeholderTextColor="#64748B"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <FlatList
        data={filteredDevices}
        keyExtractor={(item, index) => item.deviceId + index}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        renderItem={({ item }) => {
          const riskLevel = item.prediction?.riskLevel || 'Stable';
          const riskColor = riskLevel === 'Critical' ? '#EF4444' : riskLevel === 'Warning' ? '#F59E0B' : '#10B981';
          return (
            <TouchableOpacity 
              style={styles.deviceCard}
              onPress={() => navigation.navigate('AlertsDetail', { device: item })}
            >
              <View>
                <Text style={styles.deviceName}>{item.deviceId}</Text>
                <Text style={styles.deviceDetail}>{item.manufacturer} {item.model}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
                <Text style={[styles.badgeText, { color: riskColor }]}>{riskLevel}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No devices found matching your search.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
  searchInput: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155', fontSize: 14 },
  deviceCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  deviceName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  deviceDetail: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 20 }
});
