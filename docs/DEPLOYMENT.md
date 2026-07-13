# 🚀 Deployment & Penyelenggaraan

---

## ⚠️ Peraturan Emas

> **Save ≠ Deploy.**
>
> Menyimpan `Code.gs` sahaja **tidak** mengubah apa yang aplikasi guna.
> Aplikasi memanggil versi yang **di-deploy**. Setiap perubahan kod memerlukan **New Version**.

Ini punca #1 bug "kenapa fix saya tak jalan".

---

## Kemas kini Backend (`Code.gs`)

1. **Extensions → Apps Script**
2. Paste kod baru → **💾 Save**
3. **Deploy → Manage deployments**
4. Klik **✏️ (pensil)** pada deployment sedia ada
5. **Version** → pilih **New version**
6. **Deploy**

### Sahkan

```
<URL>/exec?action=ping
```

Mesti papar nombor versi terkini:

```json
{"ok":true,"message":"AAP Tracker backend hidup (v5)"}
```

> Jika versi lama masih dipapar — deployment belum berjaya. Ulang langkah 3–6.

---

## Kemas kini Frontend (`index.html`)

1. Buka repo GitHub → klik `index.html`
2. Klik **✏️ (pensil)** → edit
3. Paste kod baru → **Commit changes**
4. Tunggu 1–2 minit → refresh app

> ⚠️ Pastikan baris `var API_URL = "...exec"` **tidak terpadam** semasa mengedit.
>
> 💡 Jika perubahan tidak kelihatan pada telefon — tutup browser sepenuhnya (bukan sekadar refresh). Safari/Chrome menyimpan cache versi lama.

---

## 📧 Email Alert

### Aktifkan trigger

1. Apps Script → ikon **⏰ Triggers** (bar sisi kiri)
2. **+ Add Trigger**

   | Medan | Nilai |
   |-------|-------|
   | Function to run | `dailyStockAlert` |
   | Event source | **Time-driven** |
   | Type of time based trigger | **Day timer** |
   | Time of day | **8am–9am** |

3. **Save** → Authorize

### Test segera

Dari editor Apps Script, pilih fungsi **`testAlertNow`** → klik **Run** ▶️

- Jika ada material ≤ safety stock → email dihantar
- Jika semua selamat → tiada email *(ini betul — alert hanya bila perlu)*

### Tetapan penerima

Alamat email diambil dari tab **Config** (medan `AlertEmail`), boleh diubah dari app: **Plan → Setting → Email alert**.

---

## 🔧 Baiki Balance

Jika column `Balance` kelihatan bercelaru atau negatif:

1. Apps Script editor → dropdown fungsi → pilih **`fixBalances`**
2. Klik **Run** ▶️
3. Toast "Balance dah dikira semula ✓" akan muncul dalam Sheet

### Punca lazim

| Punca | Penjelasan |
|-------|------------|
| **Tarikh bercampur** | Data yang di-*paste* ke Sheets ditukar kepada *date value*, manakala app menghantar *teks*. v4+ menormalkan kedua-duanya. |
| **Tarikh OPENING salah** | Anchor model mengira dari tarikh OPENING. Tarikh silap → baki silap. Semak tab `Records`. |
| **Deployment lama** | Kod betul disimpan, tetapi versi lama masih di-deploy. |

---

## 🔄 Rollback

**Backend:** Manage deployments → ✏️ → Version → pilih versi lama → Deploy

**Frontend:** Repo GitHub → `index.html` → **History** → pilih commit lama → **Revert**

---

## 📋 Checklist Selepas Deploy

- [ ] Ping papar versi terkini
- [ ] App papar **ONLINE**
- [ ] Rekod test masuk ke `Records` dengan Balance betul
- [ ] Balance kekal betul selepas beberapa entry berturut-turut
- [ ] Tab Plan memuat data (forecast, delivery, setting)
