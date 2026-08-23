import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import SuppliersScreen from '../screens/SuppliersScreen';
import SupplierDetailScreen from '../screens/SupplierDetailScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ClientsScreen from '../screens/ClientsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const SuppliersStack = createNativeStackNavigator();

// دفتر الموردين فيه عدة شاشات فوق بعض (قائمة -> تفاصيل -> عملية شراء)
function SuppliersStackNavigator() {
  return (
    <SuppliersStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F172A' }, headerTintColor: '#fff' }}>
      <SuppliersStack.Screen name="SuppliersList" component={SuppliersScreen} options={{ title: 'الموردين', headerShown: false }} />
      <SuppliersStack.Screen name="SupplierDetail" component={SupplierDetailScreen} options={{ title: 'تفاصيل المورد' }} />
      <SuppliersStack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'عملية شراء' }} />
    </SuppliersStack.Navigator>
  );
}

const icons = {
  Dashboard: '🏠', Suppliers: '🏢', Clients: '👤', Inventory: '📦', Reports: '📊', Search: '🔍', Settings: '⚙️',
};
const labels = {
  Dashboard: 'الرئيسية', Suppliers: 'الموردين', Clients: 'الزبائن', Inventory: 'المخزون',
  Reports: 'التقارير', Search: 'بحث', Settings: 'إعدادات',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#1E293B', borderTopColor: '#334155' },
          tabBarActiveTintColor: '#60A5FA',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabel: labels[route.name],
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Suppliers" component={SuppliersStackNavigator} />
        <Tab.Screen name="Clients" component={ClientsScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
