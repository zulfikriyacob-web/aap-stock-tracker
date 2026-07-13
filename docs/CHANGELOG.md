# 📜 Changelog

Semua perubahan penting kepada AAP Consumable Stock Tracker.

---

## [5.1] — Fix Report & Dokumentasi

### Dibaiki
- **Bug kritikal:** tab Report memaparkan balance **negatif**
  - Punca: Report mengira dari bulan kalendar bermula `0`, mengabaikan baki bawa masuk dari bulan sebelum (tempat OPENING berada)
  - Kesan: Home papar `1 bag` tetapi Report papar `-24` — tidak konsisten
  - Penyelesaian: helper `balanceAsOf(material, tarikh)` — anchor model dihormati pada mana-mana tarikh potong
- `calcBalance()` kini menggunakan hanya OPENING yang **≤ tarikh** sebagai anchor (sebelum ini OPENING masa depan boleh merosakkan baki sejarah)

### Ditambah
- README penuh · panduan SETUP & DEPLOYMENT · CHANGELOG · LICENSE
- Galeri screenshot aplikasi

---

## [5.0] — Tab Plan, Forecast & Email Alert

### Ditambah
- **Tab Plan** dengan 4 seksyen: Forecast · Plan Produksi · Delivery · Setting
- **Enjin forecast** — unjuran baki harian mengikut plan produksi (hari kerja sahaja)
- **Cadangan jadual delivery** — auto-kira bila supplier perlu hantar untuk kekalkan safety stock
- **Email alert automatik** (`dailyStockAlert`) — trigger harian, hantar email bila baki ≤ safety stock
- **Alert 4 lapisan** — banner, titik merah pada tab, baris berwarna, email
- Tab Sheet baru (auto-create): `Plan` · `Delivery` · `Config`
- Setting boleh diubah terus dari app (safety stock, saiz shipment, lead time, email)
- Fungsi `testAlertNow()` untuk menguji email serta-merta

### Nota
- Buat masa ini tab Plan meliputi **Bubble Wrap** sahaja

---

## [4.0] — Fix Pengiraan Tarikh

### Dibaiki
- **Bug kritikal:** balance bercelaru & negatif apabila data di-*paste* ke Sheets
  - Punca: Sheets menukar tarikh teks kepada *date value* → jenis bercampur → susunan salah
  - Penyelesaian: helper `dateKey()` dan `tsNum()` menormalkan kedua-dua jenis sebelum susun

### Ditambah
- `fixBalances()` — boleh dijalankan terus dari editor untuk membaiki data sedia ada

---

## [3.0] — Balance Auto & Anchor Model

### Ditambah
- Column **Balance** (L) dikira automatik oleh Apps Script
- **Anchor model** — OPENING pada mana-mana tarikh (bukan terkunci pada hari 1)
  - Balance dikira dari tarikh OPENING terkini; transaksi sebelumnya diabaikan
  - Sepadan dengan proses stock check fizikal sebenar
- OPENING disegerakkan ke Sheet (semua telefon nampak baki sama)
- Sejarah stock check dikekalkan; hanya OPENING pada tarikh sama diganti

---

## [2.0] — Tukar Data & Penukaran Unit

### Ditambah
- Tab **Tukar Data** — padam entry yang tersilap
- Papar penukaran unit bagi semua material
  - Bubble Wrap: 1 bag = 200 pcs
  - Glue Tribond: 1 tube = 1,020 pcs
  - NPC Grease: 1 pail = 15 kg

### Dibaiki
- Ketinggian kotak input tidak sama rata (Tarikh vs Shift) — `box-sizing` + `height` tetap

---

## [1.0] — Keluaran Pertama

### Ditambah
- Aplikasi web mudah alih (single-file, tema HMI gelap)
- Rekod OUT / IN dengan material, tarikh, shift, line, operator
- Segerak ke Google Sheets melalui Apps Script
- Tab Home · Record · History · Report
- Eksport CSV
- Penunjuk ONLINE / OFFLINE
- Hosting GitHub Pages + akses QR code
