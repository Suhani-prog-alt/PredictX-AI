import 'react-native-gesture-handler';
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import OverviewScreen from './src/screens/OverviewScreen';
import AlertSystemScreen from './src/screens/AlertSystemScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertManagementScreen from './src/screens/AlertManagementScreen';
import SidebarContent from './src/components/SidebarContent';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#111111',
    card: '#161B22',
    text: '#F8FAFC',
    border: '#30363D',
    primary: '#F97316',
  },
};

const HeaderLeftMenu = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => navigation.toggleDrawer()} 
    style={{ marginLeft: 15, marginRight: 15 }}
  >
    <Text style={{ fontSize: 24, color: '#F97316' }}>☰</Text>
  </TouchableOpacity>
);

const defaultHeaderOptions = ({ navigation }) => ({
  headerStyle: { backgroundColor: '#111111' },
  headerTintColor: '#F8FAFC',
  headerTitleStyle: { fontFamily: 'monospace', fontWeight: 'bold' },
  headerLeft: () => <HeaderLeftMenu navigation={navigation} />
});

function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={defaultHeaderOptions}>
      <Stack.Screen name="OverviewMain" component={OverviewScreen} options={{ title: 'PredictX-AI' }} />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={defaultHeaderOptions}>
      <Stack.Screen name="AlertsList" component={AlertSystemScreen} options={{ title: 'Alerts' }} />
      <Stack.Screen name="AlertsDetail" component={AlertManagementScreen} options={{ title: 'Telemetry' }} />
    </Stack.Navigator>
  );
}

function DevicesStack() {
  return (
    <Stack.Navigator screenOptions={defaultHeaderOptions}>
      <Stack.Screen name="DevicesList" component={DashboardScreen} options={{ title: 'Devices' }} />
      <Stack.Screen name="AlertsDetail" component={AlertManagementScreen} options={{ title: 'Telemetry' }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#30363D',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tab.Screen 
        name="overview" 
        component={OverviewStack} 
        options={{ tabBarLabel: 'Overview', tabBarIcon: () => <Text>📊</Text> }}
      />
      <Tab.Screen 
        name="alerts" 
        component={AlertsStack} 
        options={{ tabBarLabel: 'Alerts', tabBarIcon: () => <Text>🚨</Text> }}
      />
      <Tab.Screen 
        name="devices" 
        component={DevicesStack} 
        options={{ tabBarLabel: 'Devices', tabBarIcon: () => <Text>💻</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={customDarkTheme}>
        <Drawer.Navigator
          drawerContent={(props) => <SidebarContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            drawerStyle: { backgroundColor: '#111111', width: 280 },
            swipeEdgeWidth: 100,
          }}
        >
          <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
