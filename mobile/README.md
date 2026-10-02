# SiMeka Mobile (React Native / Expo)

Hasil konversi aplikasi web React (`/src`) menjadi **komponen native React Native** penuh.

## Cara menjalankan
```bash
cd mobile
npm install
npx expo start        # scan QR dengan Expo Go di HP, atau tekan a (Android) / i (iOS)
```

Prasyarat build APK: Node.js 18+, lalu `npx expo prebuild` + Android Studio, atau gunakan **EAS Build**: `npx eas build -p android`.

## Peta konversi (web → native)

| Web | Mobile (native) |
|---|---|
| `main.tsx` (createRoot) | `index.ts` (registerRootComponent) |
| `App.tsx` (sidebar + state page) | `App.tsx` (Bottom Tab Navigator) |
| Tailwind CSS | `src/theme` + `StyleSheet` |
| `localStorage` | AsyncStorage (`src/utils/storage.ts`) |
| `<div> <span> <p>` | `View` / `Text` |
| `<button onClick>` | `TouchableOpacity` |
| `<input>` | `TextInput` |
| `<table>` / list panjang | `FlatList` |
| Modal HTML | `Modal` (bottom sheet) |
| lucide-react icons | Ionicons (@expo/vector-icons) |
| Dashboard.tsx | `screens/DashboardScreen.tsx` ✅ |
| InventoryManager.tsx | `screens/InventoryScreen.tsx` ✅ |
| POS.tsx | `screens/POSScreen.tsx` ✅ |
| CustomerManagement.tsx | `screens/CustomersScreen.tsx` ✅ |
| Sisanya (Invoice, Analytics, dll.) | 15 layar native — diakses lewat tab "Lainnya" (`MoreScreen.tsx`) |

## Navigasi
- **Bottom Tabs**: Dashboard, Inventory, Kasir (POS), Pelanggan, Lainnya
- **Stack** (dibuka dari tab Lainnya): Invoice, Struk, Cash Flow, Laporan Keuangan, Analitik, Purchase Order, Supplier, Utang & Piutang, Voucher, Loyalty, Karyawan, QR Code, Bundling, Hitung Harga, Profil Toko

## Catatan library web yang tidak bisa dipakai langsung di RN
- `html2canvas`, `jspdf`, `xlsx` → ganti `react-native-html-to-pdf` / `expo-print`
- `recharts` → ganti `react-native-svg` + `react-native-chart-kit`
- `framer-motion` → ganti `react-native-reanimated`
- `html5-qrcode` (kamera) → ganti `expo-camera`
- `@dnd-kit` → ganti `react-native-gesture-handler` + `react-native-draggable-flatlist`
- Supabase tetap bisa (`@supabase/supabase-js` jalan di RN, tambahkan `expo-secure-store` untuk auth)
