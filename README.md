# 🎨 ENAMELIST - Platform Keychain & Enamel Pin Custom

Aplikasi web landing page interaktif untuk **ENAMELIST** yang menampilkan katalog produk keychain dan enamel pin dengan desain premium, modern, dan responsif. Proyek ini dibangun menggunakan HTML, Javascript, Tailwind CSS (dikompilasi), dan Custom CSS.

## 🚀 Panduan Deploy ke Vercel

Proyek ini telah dikonfigurasi agar dapat dideploy ke **Vercel** dengan sangat mudah melalui integrasi otomatis (Zero Config).

### Langkah-langkah Deploy:

1. **Push Proyek ke GitHub/GitLab/Bitbucket**
   Pastikan semua perubahan kode terbaru telah di-commit dan di-push ke repositori Git Anda.

2. **Hubungkan ke Vercel**
   - Buka dashboard [Vercel](https://vercel.com) dan masuk ke akun Anda.
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Cari dan pilih repositori Git proyek `enamelist-mvp` ini, lalu klik **"Import"**.

3. **Konfigurasi Project Settings (Otomatis)**
   Vercel akan mendeteksi proyek Anda sebagai aplikasi statis dengan `package.json`. Pengaturan berikut akan terdeteksi otomatis:
   - **Framework Preset**: `Other` (atau `None`)
   - **Build Command**: `npm run build` (menjalankan perintah kompilasi Tailwind CSS)
   - **Output Directory**: `.` (direktori utama proyek)

4. **Klik "Deploy"**
   Tunggu proses build selesai dalam beberapa detik, dan landing page ENAMELIST Anda siap diakses secara online!

---

## 🛠️ Pembaruan yang Telah Dilakukan

Kami telah melakukan beberapa optimasi penting agar proyek siap untuk dideploy dengan performa terbaik:

1. **Build Automation (`package.json`)**:
   - Menambahkan script `"build": "npm run build:css"` di dalam `package.json`. Vercel akan otomatis mendeteksi script ini dan mengompilasi CSS saat deployment berlangsung.

2. **Menghapus Tailwind Play CDN**:
   - Sebelumnya, halaman menggunakan `<script src="https://cdn.tailwindcss.com"></script>` yang memperlambat pemuatan halaman (karena browser harus memproses class Tailwind secara dinamis).
   - Sekarang, halaman langsung memuat stylesheet hasil kompilasi `<link rel="stylesheet" href="css/tailwind.css">` yang jauh lebih cepat, SEO-friendly, dan direkomendasikan untuk produksi.

3. **Sinkronisasi Palette Warna Pastel**:
   - Memperbaiki ketidaksesuaian warna di mana konfigurasi CDN sebelumnya berbeda dengan `tailwind.config.cjs` dan `css/style.css`.
   - Semua warna pastel (seperti `pastel-pink`, `pastel-blue`, dll.) kini telah disinkronkan secara konsisten menggunakan kode warna pastel asli yang cerah dan estetis.

---

## 💻 Pengembangan Lokal

Karena aplikasi ini menggunakan `fetch` untuk memuat data produk dari berkas `data/products.json`, Anda **tidak bisa** langsung membukanya secara offline melalui `file://` di browser (karena kebijakan CORS browser). Anda harus menjalankannya melalui server lokal.

Ikuti langkah-langkah berikut:

1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Server Lokal**:
   Jalankan perintah berikut untuk mengaktifkan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan dan dapat diakses melalui browser di alamat yang tertera (biasanya `http://localhost:3000`).

3. **Jalankan Tailwind Compiler (Mode Watch)**:
   Jika Anda sedang mengubah tampilan/desain, buka terminal baru dan jalankan perintah berikut agar Tailwind mendeteksi perubahan kelas secara real-time:
   ```bash
   npm run watch:css
   ```

4. **Kompilasi Produksi Secara Manual**:
   Untuk melakukan kompilasi manual Tailwind CSS sebelum deploy atau untuk build produksi:
   ```bash
   npm run build
   ```
