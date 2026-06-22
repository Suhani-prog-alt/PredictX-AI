import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SystemAlertsWidget({ devices = [], navigation }) {
  const activeAlerts = devices
    .filter(d => {
       const pred = d.latestPrediction || d.prediction;
       return pred && pred.riskLevel && pred.riskLevel !== 'low' && pred.riskLevel !== 'Stable';
    })
    .sort((a, b) => {
       const predA = a.latestPrediction || a.prediction;
       const predB = b.latestPrediction || b.prediction;
       if (predA.riskLevel === 'Critical' && predB.riskLevel !== 'Critical') return -1;
       if (predB.riskLevel === 'Critical' && predA.riskLevel !== 'Critical') return 1;
       return 0;
    })
    .map(d => {
      const pred = d.latestPrediction || d.prediction;
      return {
        id: d.deviceId,
        device: `(${d.model || d.os || 'unknown'})`,
        time: pred.timestamp ? new Date(pred.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Live',
        prob: pred.failureProbability ? `${Math.round(pred.failureProbability)}%` : 'N/A',
        component: pred.predictedComponent || 'unknown',
        risk: pred.riskLevel,
        originalDevice: d
      };
    });

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>system alerts</Text>
        <Text style={styles.icon}>🛡️</Text>
      </View>

      <View style={styles.alertsContainer}>
        {activeAlerts.map((alert, index) => (
          <View key={index} style={styles.alertItem}>
            <View style={styles.alertIndicator} />
            <View style={styles.alertContent}>
              
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertWarningIcon}>⚠️</Text>
                  <Text style={styles.alertId}>{alert.id}</Text>
                </View>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
              
              <Text style={styles.alertDevice}>{alert.device}</Text>
              
              <View style={styles.alertDetailRow}>
                <Text style={styles.alertLabel}>failure probability:</Text>
                <Text style={styles.alertProb}>{alert.prob}</Text>
              </View>
              
              <View style={styles.alertDetailRow}>
                <Text style={styles.alertLabel}>failing component:</Text>
                <Text style={styles.alertComponent}>{alert.component}</Text>
              </View>

              <TouchableOpacity 
                style={styles.investigateBtn}
                onPress={() => navigation && navigation.navigate('AlertsDetail', { device: alert.originalDevice })}
              >
                <Text style={styles.investigateText}>investigate →</Text>
              </TouchableOpacity>
              
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#161B22', 
    borderRadius: 8, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: '#30363D' 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    fontFamily: 'monospace' 
  },
  icon: { 
    color: '#E74C3C', 
    fontSize: 16
  },
  alertsContainer: {
    gap: 16
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#1C2128',
    borderRadius: 6,
    overflow: 'hidden'
  },
  alertIndicator: {
    width: 4,
    backgroundColor: '#F39C12'
  },
  alertContent: {
    flex: 1,
    padding: 16
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  alertWarningIcon: {
    fontSize: 14,
    marginRight: 8
  },
  alertId: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  alertTime: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  alertDevice: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: 'monospace',
    marginLeft: 22,
    marginBottom: 12
  },
  alertDetailRow: {
    marginLeft: 22,
    marginBottom: 4
  },
  alertLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2
  },
  alertProb: {
    color: '#F39C12',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 4
  },
  alertComponent: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  investigateBtn: {
    backgroundColor: '#111',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 22,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#30363D'
  },
  investigateText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold'
  }
});
