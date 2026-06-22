import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export default function DeviceHealthWidget({ healthy = 65, warning = 25, critical = 10 }) {
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const total = healthy + warning + critical || 1;
  const healthyPct = healthy / total;
  const warningPct = warning / total;
  const criticalPct = critical / total;

  const healthyStroke = healthyPct * circumference;
  const warningStroke = warningPct * circumference;
  const criticalStroke = criticalPct * circumference;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>device health status</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.icon}>⤢</Text>
          <Text style={styles.icon}>📚</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width="160" height="160" viewBox="0 0 160 160">
          <G rotation="-90" origin="80, 80">
            {/* Healthy (Green) */}
            <Circle cx="80" cy="80" r={radius} stroke="#2ECC71" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${healthyStroke} ${circumference}`} strokeDashoffset={0} />
            {/* Warning (Yellow) */}
            <Circle cx="80" cy="80" r={radius} stroke="#F39C12" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${warningStroke} ${circumference}`} strokeDashoffset={-healthyStroke} />
            {/* Critical (Red) */}
            <Circle cx="80" cy="80" r={radius} stroke="#E74C3C" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${criticalStroke} ${circumference}`} strokeDashoffset={-(healthyStroke + warningStroke)} />
          </G>
        </Svg>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#2ECC71' }]} />
          <Text style={styles.legendText}>healthy</Text>
          
          <View style={[styles.colorBox, { backgroundColor: '#F39C12', marginLeft: 16 }]} />
          <Text style={styles.legendText}>warning</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#E74C3C' }]} />
          <Text style={styles.legendText}>critical</Text>
        </View>
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
    alignItems: 'center'
  },
  title: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    fontFamily: 'monospace' 
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
    alignItems: 'center', 
    marginVertical: 24 
  },
  legendContainer: { 
    alignItems: 'center' 
  },
  legendRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 4 
  },
  colorBox: { 
    width: 30, 
    height: 8, 
    borderRadius: 2, 
    marginRight: 8 
  },
  legendText: { 
    color: '#AAA', 
    fontSize: 12, 
    fontFamily: 'monospace' 
  }
});
