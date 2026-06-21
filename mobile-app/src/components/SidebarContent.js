import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SidebarContent({ navigation, state }) {
  // Helper to determine if a route is currently active
  const isActive = (routeName) => {
    if (!state || !state.routes) return false;
    const currentRoute = state.routes[state.index].name;
    return currentRoute === routeName;
  };

  // Helper to render a navigation item
  const renderNavItem = (label, routeName, icon, badgeCount = null) => {
    const active = isActive(routeName);
    return (
      <TouchableOpacity 
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => navigation.navigate(routeName)}
      >
        <View style={styles.navItemLeft}>
          <Text style={[styles.navIcon, active && styles.navTextActive]}>{icon}</Text>
          <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
        </View>
        {badgeCount !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoIcon}>
          <Text style={styles.pulseText}>∿</Text>
        </View>
        <Text style={styles.brandTitle}>PREDICTX</Text>
      </View>
      <View style={styles.headerDivider} />

      {/* Navigation Sections */}
      <View style={styles.scrollContent}>
        
        {/* DASHBOARD */}
        <Text style={styles.sectionTitle}>DASHBOARD</Text>
        {renderNavItem('overview', 'overview', '📚')}

        {/* OPERATIONS */}
        <Text style={styles.sectionTitle}>OPERATIONS</Text>
        {renderNavItem('alerts', 'alerts', '🔔', 7)}
        {renderNavItem('devices', 'devices', '📉')}
        {renderNavItem('maintenance', 'overview', '🔧')}

        {/* INTELLIGENCE */}
        <Text style={styles.sectionTitle}>INTELLIGENCE</Text>
        {renderNavItem('predictions', 'overview', '❕')}
        {renderNavItem('ml ops', 'overview', '🧠')}

        {/* SYSTEM */}
        <Text style={styles.sectionTitle}>SYSTEM</Text>
        {renderNavItem('system health', 'overview', '🛡️')}
        {renderNavItem('agent sim', 'overview', '›')}

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerOrg}>
          <Text style={styles.orgIcon}>🏢</Text>
          <Text style={styles.orgText}>Dell Hackathon Inc.</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>[→</Text>
          <Text style={styles.logoutText}>log_out</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111', // Exact black background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20, // push down for status bar safe area roughly
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pulseText: {
    color: '#F97316',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navItemActive: {
    backgroundColor: '#3b2214', // Subtle dark orange tint
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
    paddingLeft: 17, // offset for border
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIcon: {
    color: '#AAAAAA',
    fontSize: 16,
    marginRight: 15,
    width: 20,
    textAlign: 'center',
  },
  navText: {
    color: '#AAAAAA',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  footerOrg: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orgIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#F97316',
  },
  orgText: {
    color: '#888888',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 4,
    padding: 15,
    backgroundColor: '#2A1111', // Very faint red
  },
  logoutIcon: {
    color: '#EF4444',
    marginRight: 15,
    fontSize: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
