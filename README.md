# ENAMELIST - Platform Kustomisasi Keychain dan Enamel Pin 3D

ENAMELIST adalah platform web interaktif yang dirancang untuk memfasilitasi kustomisasi dan pemesanan gantungan kunci (keychain) serta enamel pin secara real-time. Proyek ini dibangun untuk menjembatani kebutuhan visualisasi produk kustom bagi konsumen individu (B2C) maupun pesanan massal untuk organisasi dan komunitas (B2B).

## Alur Bisnis (Business Flow)

Platform ENAMELIST mengintegrasikan alur bisnis digital yang efisien dari tahap eksplorasi hingga konversi transaksi:

1. **Eksplorasi Produk dan Katalog**:
   Pengguna dapat menjelajahi katalog produk siap pakai yang dikategorikan berdasarkan tipe produk (keychain dan enamel pin). Fitur filter dinamis dan detail modal memudahkan pengguna melihat spesifikasi produk dan kisaran harga.

2. **Kustomisasi Mandiri Berbasis 3D (3D Customizer)**:
   Fitur utama platform ini adalah generator 3D interaktif. Pengguna dapat mengunggah desain logo atau gambar mereka sendiri dalam format gambar (PNG transparan sangat direkomendasikan). Sistem akan memproses gambar tersebut dan melakukan ekstrusi 3D secara instan. Pengguna dapat menyesuaikan bentuk bingkai (Custom, Circle, Rounded, Heart) serta jenis material logam (Gold, Silver, Black, Rose Gold).

3. **Pemesanan dan Konversi (WhatsApp Integration)**:
   Setelah memvisualisasikan produk dalam bentuk 3D atau memilih dari katalog, pengguna dapat melakukan pemesanan dengan menekan tombol order. Sistem akan mengarahkan pengguna langsung ke kontak admin via WhatsApp. Model pemesanan berbasis chat ini dipilih untuk mempermudah konsultasi desain lebih lanjut, negosiasi harga untuk pesanan massal (B2B), serta meminimalkan friksi administrasi bagi konsumen individu (B2C). Hal ini juga mendukung pendekatan "no minimum order" yang ramah bagi kantong pelajar.

## Rekayasa Teknologi (Tech Stack)

Aplikasi ini dibangun menggunakan arsitektur frontend statis yang dioptimalkan untuk performa tinggi, interaktivitas, dan skalabilitas:

* **Antarmuka Pengguna (UI/UX)**:
  * **HTML5 & Vanilla JavaScript (ES6+)**: Memastikan logika aplikasi berjalan ringan tanpa overhead dari framework tambahan.
  * **Tailwind CSS**: Digunakan untuk membangun desain responsif, modern, dan mendukung mode gelap (Dark Mode). File CSS dikompilasi secara statis untuk produksi guna meningkatkan performa pemuatan halaman dan SEO (tidak menggunakan CDN).

* **Visualisasi 3D (WebGL)**:
  * **Three.js & OrbitControls**: Pustaka utama untuk merender lingkungan 3D secara real-time di browser melalui WebGL. Fitur ini mencakup kontrol kamera interaktif (rotasi dan zoom) serta pengaturan pencahayaan multi-arah (Ambient, Directional, dan Rim/Spec Light) untuk memberikan efek kilau logam realistis pada produk keychain.

* **Pemrosesan Gambar dan Algoritma**:
  * **Marching Squares**: Digunakan untuk melacak kontur/siluet luar dari gambar PNG transparan yang diunggah pengguna secara presisi pada level piksel.
  * **Ramer-Douglas-Peucker (RDP)**: Algoritma penyederhanaan kurva yang mereduksi jumlah simpul (vertices) hasil pelacakan kontur agar geometri 3D dapat diekstrusi dengan efisien tanpa membebani performa browser.
  * **Chaikin's Corner Cutting**: Algoritma penghalusan sudut untuk memastikan tepi potongan logam gantungan kunci melengkung dengan alami dan estetis.
  * **Dynamic UV Mapping**: Algoritma pemetaan tekstur untuk menyinkronkan posisi gambar yang diunggah agar menempel dengan presisi pada permukaan 3D hasil ekstrusi.

* **Infrastruktur dan Deployment**:
  * **Node.js & NPM**: Digunakan sebagai lingkungan pengembangan lokal dan manajemen build tools.
  * **Vercel**: Platform hosting dengan sistem integrasi CI/CD otomatis untuk deployment statis yang cepat dan andal.

## Struktur Direktori Proyek

```text
enamelist-mvp/
├── assets/             # Aset gambar, logo, dan demonstrasi produk
├── css/                # Stylesheet proyek, termasuk file kompilasi Tailwind
├── data/               # File JSON data produk katalog
├── doc/                # Dokumentasi tambahan proyek
├── js/                 # Logika JavaScript aplikasi
│   ├── script.js           # Manajemen interaksi UI, tema, katalog, dan alur unggah file
│   └── three-generator.js  # Generator 3D, pemrosesan algoritma kontur, dan rendering WebGL
├── index.html          # Halaman utama aplikasi (Landing page dan UI customizer)
├── package.json        # Konfigurasi dependensi dan skrip build npm
├── tailwind.config.cjs # Konfigurasi kustomisasi kelas Tailwind CSS
└── vercel.json         # Konfigurasi deployment Vercel
```

## Pengembangan Lokal (Local Development)

Aplikasi ini membutuhkan server lokal untuk berjalan dengan baik karena kebijakan keamanan browser (CORS) saat memuat file JSON data katalog produk secara lokal.

### Langkah Persiapan:

1. Pastikan Anda telah menginstal Node.js di sistem Anda.
2. Instal semua dependensi proyek:
   ```bash
   npm install
   ```

### Menjalankan Server Pengembangan:

Jalankan perintah berikut untuk mengaktifkan server lokal:
```bash
npm run dev
```
Aplikasi akan dapat diakses secara default di alamat `http://localhost:3000` atau port lain yang tertera di terminal Anda.

### Kompilasi Tailwind CSS secara Real-time:

Jika Anda melakukan modifikasi pada kelas CSS atau antarmuka HTML, jalankan compiler Tailwind dalam mode observasi (watch mode) di terminal terpisah:
```bash
npm run watch:css
```

### Build Produksi:

Untuk melakukan kompilasi manual seluruh file CSS sebelum didistribusikan:
```bash
npm run build
```
