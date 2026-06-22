import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FailureDistributionWidget({ devices = [] }) {
  const counts = { cooling: 0, storage: 0, power: 0 };
  
  devices.forEach(d => {
    const pred = d.latestPrediction || d.prediction;
    if (pred && (pred.riskLevel === 'Warning' || pred.riskLevel === 'Critical')) {
      let comp = (pred.predictedComponent || '').toLowerCase();
      if (comp.includes('cooling') || comp.includes('fan')) counts.cooling++;
      else if (comp.includes('storage') || comp.includes('disk')) counts.storage++;
      else if (comp.includes('power') || comp.includes('psu') || comp.includes('battery')) counts.power++;
    }
  });

  const data = [
    { label: 'cooling', value: counts.cooling, color: '#E74C3C' },
    { label: 'storage', value: counts.storage, color: '#F39C12' },
    { label: 'power', value: counts.power, color: '#3498DB' }
  ];

  let maxValue = Math.max(...data.map(d => d.value));
  if (maxValue < 4) maxValue = 4; // Keep minimum scale of 4

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>component failure{'\n'}distribution</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.icon}>⤢</Text>
          <Text style={styles.icon}>🛡️</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Y Axis */}
        <View style={styles.yAxis}>
          {Array.from({length: maxValue + 1}, (_, i) => maxValue - i).map(val => (
            <Text key={val} style={styles.yAxisText}>{val}</Text>
          ))}
        </View>
        
        {/* Bars Area */}
        <View style={styles.barsArea}>
          {/* Grid lines */}
          {Array.from({length: maxValue}, (_, i) => maxValue - i).map(val => (
            <View key={`grid-${val}`} style={[styles.gridLine, { bottom: `${(val/maxValue)*100}%` }]} />
          ))}
          
          <View style={styles.barsWrapper}>
            {data.map((item, index) => {
              const heightPct = (item.value / maxValue) * 100;
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: item.color }]} />
                  <Text style={styles.xLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.description}>
        "Most failures are related to cooling systems, followed by storage and power subsystem failures. This helps IT teams prioritize preventive maintenance."
      </Text>
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
    alignItems: 'flex-start'
  },
  title: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    fontFamily: 'monospace',
    lineHeight: 22
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: { 
    color: '#888', 
    fontSize: 16,
    marginLeft: 8
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    marginTop: 20,
    marginBottom: 10
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingBottom: 24 // to account for x-axis labels
  },
  yAxisText: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  barsArea: {
    flex: 1,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D'
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#30363D',
    opacity: 0.5
  },
  barsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 10
  },
  barColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 40
  },
  bar: {
    width: '100%',
  },
  xLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 8,
    position: 'absolute',
    bottom: -20
  },
  description: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    marginTop: 20,
    lineHeight: 18
  }
});
