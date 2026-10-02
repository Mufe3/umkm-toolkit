// App mobile — pengganti src/App.tsx versi web.
// Sidebar web → Bottom Tab (4 layar inti) + Stack untuk 16 fitur lainnya.

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { colors } from './src/theme'
import type { RootStackParamList } from './src/navigation/types'

import DashboardScreen from './src/screens/DashboardScreen'
import InventoryScreen from './src/screens/InventoryScreen'
import POSScreen from './src/screens/POSScreen'
import CustomersScreen from './src/screens/CustomersScreen'
import MoreScreen from './src/screens/MoreScreen'
import InvoicesScreen from './src/screens/InvoicesScreen'
import ReceiptsScreen from './src/screens/ReceiptsScreen'
import CashFlowScreen from './src/screens/CashFlowScreen'
import FinancialReportScreen from './src/screens/FinancialReportScreen'
import AnalyticsScreen from './src/screens/AnalyticsScreen'
import PurchaseOrderScreen from './src/screens/PurchaseOrderScreen'
import SuppliersScreen from './src/screens/SuppliersScreen'
import DebtScreen from './src/screens/DebtScreen'
import VouchersScreen from './src/screens/VouchersScreen'
import LoyaltyScreen from './src/screens/LoyaltyScreen'
import EmployeesScreen from './src/screens/EmployeesScreen'
import QRScreen from './src/screens/QRScreen'
import BundlesScreen from './src/screens/BundlesScreen'
import PriceCalcScreen from './src/screens/PriceCalcScreen'
import ProfileScreen from './src/screens/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator<RootStackParamList>()

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Inventory: 'cube-outline',
  Kasir: 'cart-outline',
  Pelanggan: 'people-outline',
  Lainnya: 'apps-outline',
}

function MainTabs() {
  return (
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
  )
}

const stackHeader = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerBackTitleVisible: false,
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />

          <Stack.Screen name="Invoice" component={InvoicesScreen} options={{ ...stackHeader, headerShown: true, title: 'Invoice' }} />
          <Stack.Screen name="Struk" component={ReceiptsScreen} options={{ ...stackHeader, headerShown: true, title: 'Struk Penjualan' }} />
          <Stack.Screen name="CashFlow" component={CashFlowScreen} options={{ ...stackHeader, headerShown: true, title: 'Cash Flow' }} />
          <Stack.Screen name="Laporan" component={FinancialReportScreen} options={{ ...stackHeader, headerShown: true, title: 'Laporan Keuangan' }} />
          <Stack.Screen name="Analitik" component={AnalyticsScreen} options={{ ...stackHeader, headerShown: true, title: 'Analitik' }} />
          <Stack.Screen name="PurchaseOrder" component={PurchaseOrderScreen} options={{ ...stackHeader, headerShown: true, title: 'Purchase Order' }} />
          <Stack.Screen name="Supplier" component={SuppliersScreen} options={{ ...stackHeader, headerShown: true, title: 'Supplier' }} />
          <Stack.Screen name="UtangPiutang" component={DebtScreen} options={{ ...stackHeader, headerShown: true, title: 'Utang & Piutang' }} />
          <Stack.Screen name="Voucher" component={VouchersScreen} options={{ ...stackHeader, headerShown: true, title: 'Voucher & Promo' }} />
          <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ ...stackHeader, headerShown: true, title: 'Loyalty' }} />
          <Stack.Screen name="Karyawan" component={EmployeesScreen} options={{ ...stackHeader, headerShown: true, title: 'Karyawan' }} />
          <Stack.Screen name="QR" component={QRScreen} options={{ ...stackHeader, headerShown: true, title: 'QR Code' }} />
          <Stack.Screen name="Bundling" component={BundlesScreen} options={{ ...stackHeader, headerShown: true, title: 'Bundling Produk' }} />
          <Stack.Screen name="HitungHarga" component={PriceCalcScreen} options={{ ...stackHeader, headerShown: true, title: 'Hitung Harga' }} />
          <Stack.Screen name="Profil" component={ProfileScreen} options={{ ...stackHeader, headerShown: true, title: 'Profil Toko' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
