# 🔧 Panduan Pemasangan

Panduan lengkap untuk memasang AAP Consumable Stock Tracker dari kosong.

Anggaran masa: **20–30 minit**

---

## Prasyarat

- Akaun Google (untuk Sheets + Apps Script)
- Akaun GitHub (untuk hosting)
- Tiada kos, tiada server, tiada kad kredit

---

## Langkah 1 — Google Sheet

1. Buka [sheets.new](https://sheets.new)
2. Namakan sheet, contoh: **AAP Stock Tracker — DM Line**
3. Biarkan kosong — semua tab akan dicipta automatik

---

## Langkah 2 — Backend (Apps Script)

1. Dalam Sheet: **Extensions → Apps Script**
2. Padam kod contoh (`function myFunction() {}`)
3. Salin seluruh isi [`Code.gs`](../Code.gs) → paste
4. Klik **💾 Save**

### Deploy sebagai Web App

1. **Deploy → New deployment**
2. Klik ⚙️ (gear) → pilih **Web app**
3. Tetapan:

   | Medan | Nilai |
   |-------|-------|
   | Description | `AAP Tracker v5` |
   | Execute as | **Me** |
   | Who has access | **Anyone** |

4. **Deploy** → **Authorize access** → pilih akaun → **Allow**
   > Skrin "Google hasn't verified this app" → **Advanced** → **Go to (project name)**
5. **Salin URL Web App** — berakhir dengan `/exec`

### Sahkan backend hidup

Buka URL ini dalam browser:

```
<URL_ANDA>/exec?action=ping
```

Sepatutnya papar:

```json
{"ok":true,"message":"AAP Tracker backend hidup (v5)"}
```

---

## Langkah 3 — Frontend

1. Buka [`index.html`](../index.html)
2. Cari baris ini (berhampiran baris 101):

   ```js
   var API_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
   ```

3. Ganti dengan URL `/exec` anda:

   ```js
   var API_URL = "https://script.google.com/macros/s/AKfy.../exec";
   ```

> ⚠️ Mesti guna URL **`/exec`** (awam), bukan `/dev` (pemilik sahaja). Jika guna `/dev`, app akan papar **OFFLINE**.

---

## Langkah 4 — Hosting (GitHub Pages)

1. Cipta repo baru di GitHub (contoh: `aap-stock-tracker`), tetapkan **Public**
2. Muat naik `index.html`

   > ⚠️ Nama fail **mesti** `index.html` — jika lain, GitHub Pages akan papar 404

3. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** · Folder: **/ (root)**
   - **Save**
4. Tunggu 1–2 minit → app tersedia di:

   ```
   https://<username>.github.io/<repo>/
   ```

---

## Langkah 5 — Opening Stock

1. Buat **stock check fizikal** — kira stok sebenar di store
2. Buka app → tab **Home** → **Set opening stock** bagi setiap material
3. Masukkan kuantiti + **tarikh stock check**

> Sistem guna **anchor model**: transaksi sebelum tarikh OPENING diabaikan, kerana stock check fizikal ialah kebenaran terkini.

---

## Langkah 6 — Tab Plan (forecast & alert)

1. Buka tab **Plan → Setting**:

   | Medan | Contoh |
   |-------|--------|
   | Safety stock | `12` bag |
   | Saiz 1 shipment | `15` bag |
   | Lead time | `10` hari |
   | Email alert | `nama@syarikat.com` |

2. **Plan → Plan Produksi** — set julat tarikh + plan pcs/hari (contoh `700`)
3. **Plan → Forecast** — semak unjuran baki
4. **Plan → Delivery** — simpan tarikh delivery yang dicadangkan

Untuk mengaktifkan **email alert automatik**, lihat [DEPLOYMENT.md](DEPLOYMENT.md#email-alert).

---

## Langkah 7 — QR Code

1. Jana QR dari URL GitHub Pages (guna mana-mana penjana QR percuma)
2. Cetak & tampal di lantai pengeluaran
3. Operator imbas → app terus buka, tiada login

> QR **tidak berubah** walaupun app dikemas kini — URL kekal sama.

---

## ✅ Senarai Semak

- [ ] Ping papar `(v5)`
- [ ] App papar **ONLINE** (bukan OFFLINE)
- [ ] Rekod test berjaya masuk ke tab `Records`
- [ ] Column `Balance` (L) terisi automatik
- [ ] Opening stock ditetapkan bagi setiap material
- [ ] Tab Plan → Setting disimpan
- [ ] Trigger email alert diaktifkan
- [ ] QR dicetak & ditampal

---

## 🔀 Nota: Migrasi Microsoft 365

Jika syarikat memerlukan data kekal dalam ekosistem M365:

| Komponen sekarang | Padanan M365 |
|-------------------|--------------|
| index.html | Microsoft Forms *(anonymous)* |
| Apps Script | Power Automate |
| Google Sheets | SharePoint List |
| Dashboard | Excel / Power BI |
| Email alert | Power Automate (scheduled flow) |

> ⚠️ **Power Apps (canvas) memerlukan login** bagi setiap pengguna. Jika operator tiada akaun syarikat, gunakan **Microsoft Forms (anonymous)** — pastikan polisi IT membenarkan "Anyone can respond".

Logik perniagaan (usage rate, ROP, safety stock, forecast) **kekal sama** — hanya platform berbeza.

---

## 🆘 Masalah Lazim

| Masalah | Penyelesaian |
|---------|--------------|
| App papar **OFFLINE** | `API_URL` guna `/dev` — tukar ke `/exec` |
| GitHub Pages **404** | Fail mesti bernama `index.html` |
| Balance salah / negatif | Run `fixBalances()` dari editor → lihat [DEPLOYMENT.md](DEPLOYMENT.md) |
| Perubahan Code.gs tiada kesan | **Re-deploy** — New Version diperlukan |
| Tab Plan/Config tiada | Normal — dicipta bila mula digunakan |
| Email alert tak sampai | Semak trigger aktif + medan Email dalam Setting |
