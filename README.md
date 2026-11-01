# Suara Kita

Prototipe portal pemilihan ketua MPK, OSIS, dan KY yang dibuat dengan Next.js.

## Menjalankan aplikasi

Pastikan Node.js tersedia, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk membuat build produksi, jalankan `npm run build`, lalu `npm start`.

## Catatan prototipe

Login saat ini hanya memeriksa bahwa username dan password terisi; belum ada autentikasi akun sekolah. Data kandidat adalah contoh. Suara simulasi disimpan di `localStorage` browser dan sesi login di `sessionStorage`. Implementasi ini **bukan sistem pemilihan resmi**: sebelum digunakan sungguhan, diperlukan backend, autentikasi dan otorisasi pemilih, database, serta penyimpanan suara yang aman dan dapat diaudit.
