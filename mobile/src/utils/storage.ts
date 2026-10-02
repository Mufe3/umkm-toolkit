// Pengganti localStorage web — memakai AsyncStorage React Native.
// API dibuat sama persis dengan src/utils/storage.ts versi web,
// tetapi asinkron (kembali Promise).

import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'simeka_'

export async function loadItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function saveItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // gagal simpan — abaikan seperti perilaku versi web
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key)
  } catch {
    // abaikan
  }
}

// Format Rupiah — dipakai di banyak layar
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

// Tipe data bersama untuk seluruh layar
export interface Produk {
  id: string
  nama: string
  kategori: string
  hargaBeli: number
  hargaJual: number
  stok: number
  minStok: number
  satuan: string
}

export interface Pelanggan {
  id: string
  nama: string
  telepon: string
  alamat: string
  poin: number
}

export interface Transaksi {
  id: string
  tanggal: string
  tipe: 'penjualan' | 'pembelian' | 'pengeluaran' | 'pemasukan'
  total: number
  deskripsi: string
}

// ID unik — pengganti generateId() versi web
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

// Format tanggal lokal Indonesia — pengganti formatDate() versi web
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Tanggal ISO (yyyy-mm-dd) untuk input hari ini
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export const DEFAULT_PRODUK: Produk[] = [
  { id: '1', nama: 'Beras Premium 5kg', kategori: 'Pangan', hargaBeli: 62000, hargaJual: 72000, stok: 25, minStok: 5, satuan: 'sack' },
  { id: '2', nama: 'Minyak Goreng 2L', kategori: 'Pangan', hargaBeli: 32000, hargaJual: 38000, stok: 40, minStok: 10, satuan: 'pcs' },
  { id: '3', nama: 'Gula Pasir 1kg', kategori: 'Pangan', hargaBeli: 14000, hargaJual: 17000, stok: 3, minStok: 8, satuan: 'kg' },
]
