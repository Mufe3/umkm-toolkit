// Utilitas ekspor & share — pengganti html2canvas + jspdf versi web.
// PDF dibuat dari HTML (expo-print), gambar via share sheet (expo-sharing).

import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Alert, Linking, Platform } from 'react-native'
import { formatRupiah } from './storage'

export interface TokoInfo {
  nama: string
  alamat: string
  telepon: string
}

const baseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Roboto', sans-serif; color: #0f172a; padding: 32px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .muted { color: #64748b; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  th { background: #f1f5f9; }
  .right { text-align: right; }
  .total-row td { font-weight: 700; border-top: 2px solid #0f172a; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
`

async function shareFile(uri: string, subject: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: subject })
  } else {
    Alert.alert('Berhasil', `PDF tersimpan di:\n${uri}`)
  }
}

// ---------- PDF Invoice ----------
export async function exportInvoicePDF(
  toko: TokoInfo,
  inv: { nomor: string; tanggal: string; pelanggan: string; items: { nama: string; qty: number; harga: number }[]; total: number; status: string },
): Promise<void> {
  const rows = inv.items.map((i) => `<tr><td>${i.nama}</td><td class="right">${i.qty}</td><td class="right">${formatRupiah(i.harga)}</td><td class="right">${formatRupiah(i.qty * i.harga)}</td></tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
    <h1>${toko.nama}</h1><p class="muted">${toko.alamat} • Telp ${toko.telepon}</p>
    <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0"/>
    <h1 style="font-size:16px">INVOICE ${inv.nomor}</h1>
    <p class="muted">Tanggal: ${inv.tanggal} • Pelanggan: ${inv.pelanggan} • Status: ${inv.status}</p>
    <table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Harga</th><th class="right">Subtotal</th></tr></thead>
    <tbody>${rows}<tr class="total-row"><td colspan="3">TOTAL</td><td class="right">${formatRupiah(inv.total)}</td></tr></tbody></table>
    <p class="muted" style="margin-top:24px">Terima kasih atas kepercayaan Anda.</p>
  </body></html>`
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  await shareFile(uri, `Invoice ${inv.nomor}`)
}

// ---------- PDF Laporan Laba Rugi ----------
export async function exportReportPDF(
  toko: TokoInfo,
  periode: string,
  data: { pemasukan: number; pengeluaran: number; laba: number; breakdown: { label: string; nilai: number }[] },
): Promise<void> {
  const rows = data.breakdown.map((b) => `<tr><td>${b.label}</td><td class="right">${formatRupiah(b.nilai)}</td></tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
    <h1>Laporan Keuangan — ${toko.nama}</h1><p class="muted">Periode: ${periode}</p>
    <table><tbody>
      <tr><td>Total Pemasukan</td><td class="right">${formatRupiah(data.pemasukan)}</td></tr>
      <tr><td>Total Pengeluaran</td><td class="right">${formatRupiah(data.pengeluaran)}</td></tr>
      <tr class="total-row"><td>${data.laba >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</td><td class="right">${formatRupiah(data.laba)}</td></tr>
    </tbody></table>
    <h1 style="font-size:15px;margin-top:24px">Rincian</h1>
    <table><tbody>${rows}</tbody></table>
  </body></html>`
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  await shareFile(uri, 'Laporan Keuangan')
}

// ---------- Share WhatsApp ----------
export async function shareWhatsApp(text: string): Promise<void> {
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url)
    } else {
      // fallback: wa.me untuk emulator / tanpa WA
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`)
    }
  } catch {
    Alert.alert('Gagal', 'WhatsApp tidak ditemukan di perangkat ini.')
  }
}

// ---------- Struk termal (share teks) ----------
export function buildReceiptText(toko: TokoInfo, r: { nomor: string; tanggal: string; items: { nama: string; qty: number; harga: number }[]; total: number }): string {
  const line = '-'.repeat(30)
  const items = r.items.map((i) => `${i.nama}\n  ${i.qty} x ${formatRupiah(i.harga)}\n`).join('')
  return `${line}\n${toko.nama.toUpperCase()}\n${toko.alamat}\nTelp: ${toko.telepon}\n${line}\nNo: ${r.nomor}\nTgl: ${r.tanggal}\n${line}\n${items}${line}\nTOTAL: ${formatRupiah(r.total)}\n${line}\nTerima kasih 🙏`.replace(/\n/g, Platform.OS === 'ios' ? '\n' : '%0A')
}
