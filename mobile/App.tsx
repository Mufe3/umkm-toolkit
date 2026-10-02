// App mobile — pengganti src/App.tsx versi web.
// Sidebar web → Bottom Tab Navigator (pola navigasi standar mobile).

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { colors } from './src/theme'
import DashboardScreen from './src/screens/DashboardScreen'
import InventoryScreen from './src/screens/InventoryScreen'
import POSScreen from './src/screens/POSScreen'
import CustomersScreen from './src/screens/CustomersScreen'
import MoreScreen from './src/screens/MoreScreen'

const Tab = createBottomTabNavigator()

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Inventory: 'cube-outline',
  Kasir: 'cart-outline',
  Pelanggan: 'people-outline',
  Lainnya: 'apps-outline',
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tabIcons[route.name] ?? 'ellipse-outline'} size={size} color={color} />
            ),
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Kasir" component={POSScreen} />
          <Tab.Screen name="Pelanggan" component={CustomersScreen} />
          <Tab.Screen name="Lainnya" component={MoreScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
