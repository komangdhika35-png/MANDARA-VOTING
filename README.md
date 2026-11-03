# Suara Mandara

Portal pemilihan ketua MPK, OSIS, dan KY yang dibuat dengan Next.js. Data pemilih dan hasil suara disimpan di database SQLite pada server yang menjalankan aplikasi.

Untuk MPK, admin mengelola maksimal 10 calon ketua dari kelas 11 dan daftar calon wakil dari kelas 10 secara terpisah. Profil setiap calon MPK dapat dilengkapi dengan foto JPG/PNG/WebP (maksimal 512 KB), visi, dan misi. OSIS dan KY masing-masing menampilkan dua pasangan calon aktif; setiap paslon juga dapat dilengkapi foto, visi, dan misi. Pemilih memilih satu nama dari setiap kategori MPK atau satu paslon OSIS/KY. Setelah pilihan ketua dan wakil MPK tersimpan, siswa diarahkan untuk melanjutkan pemilihan OSIS.

Admin mengelola daftar dan profil kandidat pada bagian **Atur kandidat**. Nama dan keanggotaan calon MPK serta nama/nomor paslon OSIS/KY dikunci setelah suara tercatat agar rekap tetap merujuk ke kandidat yang benar; foto, visi, dan misi tetap dapat diperbarui. Kartu pemilihan menampilkan profil yang diatur admin dan menggunakan ilustrasi atau teks contoh bila foto, visi, atau misi belum diisi. Jika database memiliki suara MPK dari format pasangan calon sebelumnya, saat aplikasi dibuka suara tersebut dipindahkan ke rekap ketua dan wakil sesuai pasangan yang telah dipilih.

## Menjalankan aplikasi

Pastikan Node.js versi 22.13 atau lebih baru sudah terpasang, lalu buka terminal di folder proyek dan jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk menjalankan versi produksi, gunakan `npm run build`, kemudian `npm start`.

## Memasukkan data siswa

Siswa masuk hanya dengan NIS yang terdaftar di database. Ketik username `admin` pada halaman login untuk menampilkan kolom password dan membuka halaman rekap suara. Password admin pada instalasi ini disimpan di file lokal `.env.local` (tidak diunggah ke Git). Halaman admin menampilkan rekap jumlah suara, nama siswa beserta pilihannya, dan daftar siswa yang belum memilih untuk setiap organisasi.

Admin dapat memilih **Reset** di samping pemilih untuk menghapus suara siswa pada organisasi tersebut. Untuk MPK, reset menghapus pilihan ketua dan/atau wakil yang sudah tercatat. Tindakan ini harus dikonfirmasi, memperbarui rekap suara, dan mengakhiri sesi login siswa tersebut. Siswa perlu masuk kembali untuk memilih ulang. Reset dilakukan satu organisasi sekaligus.

Untuk mengimpor daftar dari Excel, jalankan perintah berikut di terminal pada folder proyek (ganti alamat file sesuai lokasi workbook):

```bash
npm run import:siswa -- "C:\Users\Nama\Downloads\daftar-siswa.xlsx"
```

Importer membaca lembar yang memiliki kolom `NISN/NIS` dan `NAMA SISWA`. Untuk mencoba tanpa mengubah database, tambahkan `--dry-run` sebelum alamat file. Jika workbook Excel belum tersedia, daftar CSV dengan dua kolom `nis` dan `nama` juga bisa digunakan. Contohnya:

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

SQLite menyimpan data siswa, sesi login, partisipasi pemilih, dan surat suara secara lokal pada disk server. Satu NIS hanya dapat memilih satu kali untuk setiap organisasi. Admin dapat melihat nama pemilih dan kandidat yang dipilih, sehingga pemungutan suara ini **tidak bersifat rahasia**. Batasi akses admin dan jangan gunakan fitur tersebut untuk pemilihan resmi yang mensyaratkan kerahasiaan suara.

SQLite sesuai untuk aplikasi yang dijalankan pada satu komputer/server dengan penyimpanan disk persisten. Jangan menjalankan beberapa salinan aplikasi dengan file database lokal terpisah, dan jangan mengandalkan filesystem sementara pada layanan hosting. Untuk pemilihan resmi atau aplikasi yang perlu diakses luas, sekolah perlu menyiapkan server persisten, backup, pengamanan data, dan prosedur audit terlebih dahulu. Nama kandidat dalam aplikasi masih berupa data contoh.

Login siswa hanya menggunakan NIS, sehingga siapa pun yang mengetahui NIS pemilih dapat masuk. Ganti password admin sebelum penggunaan, dan jangan membuka aplikasi ke internet atau menggunakannya sebagai pemilihan resmi tanpa pengamanan tambahan serta persetujuan sekolah.
