# Suara Mandara

Portal pemilihan ketua MPK, OSIS, dan KY yang dibuat dengan Next.js. Data pemilih dan hasil suara disimpan di database SQLite pada server yang menjalankan aplikasi.

## Menjalankan aplikasi

Pastikan Node.js versi 22.13 atau lebih baru sudah terpasang, lalu buka terminal di folder proyek dan jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk menjalankan versi produksi, gunakan `npm run build`, kemudian `npm start`.

## Memasukkan data siswa

Siswa masuk hanya dengan NIS yang terdaftar di database. Ketik username `admin` pada halaman login untuk menampilkan kolom password dan membuka halaman rekap suara. Password admin pada instalasi ini disimpan di file lokal `.env.local` (tidak diunggah ke Git). Beranda admin menampilkan rekap jumlah suara tiap kandidat di organisasi MPK, OSIS, dan KY. Siapkan daftar siswa dalam format CSV dengan dua kolom `nis` dan `nama`. Contohnya:

```csv
nis,nama
00123456,Nadia Putri
00123457,Raka Pratama
```

Template kosong tersedia di `data/siswa.csv.example`. Buat salinannya sebagai `data/siswa.csv`, isi dengan data siswa yang sah, lalu dari terminal di folder proyek jalankan:

```bash
npm run import:siswa -- .\data\siswa.csv
```

NIS diperlakukan sebagai teks agar angka nol di depannya tidak hilang. Mengimpor kembali NIS yang sama akan memperbarui nama siswa tanpa menghapus catatan suara yang telah masuk. Jangan membagikan daftar siswa karena berisi data pribadi.

Database otomatis dibuat di `.data/suara-mandara.sqlite`. Folder `.data` tidak disertakan dalam Git. Simpan cadangan database secara berkala dan batasi akses ke komputer/server tempat aplikasi berjalan.

## Penyimpanan suara dan batas penggunaan

SQLite menyimpan data siswa, sesi login, partisipasi pemilih, dan surat suara secara lokal pada disk server. Satu NIS hanya dapat memilih satu kali untuk setiap organisasi. Surat suara tidak menyimpan NIS bersama pilihan kandidat.

SQLite sesuai untuk aplikasi yang dijalankan pada satu komputer/server dengan penyimpanan disk persisten. Jangan menjalankan beberapa salinan aplikasi dengan file database lokal terpisah, dan jangan mengandalkan filesystem sementara pada layanan hosting. Untuk pemilihan resmi atau aplikasi yang perlu diakses luas, sekolah perlu menyiapkan server persisten, backup, pengamanan data, dan prosedur audit terlebih dahulu. Nama kandidat dalam aplikasi masih berupa data contoh.

Login siswa hanya menggunakan NIS, sehingga siapa pun yang mengetahui NIS pemilih dapat masuk. Ganti password admin sebelum penggunaan, dan jangan membuka aplikasi ke internet atau menggunakannya sebagai pemilihan resmi tanpa pengamanan tambahan serta persetujuan sekolah.
