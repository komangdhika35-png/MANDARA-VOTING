# Suara Mandara

Prototipe portal pemilihan ketua MPK, OSIS, dan KY di Mandara yang dibuat dengan Next.js.

## Menjalankan aplikasi

Pastikan Node.js tersedia, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk membuat build produksi, jalankan `npm run build`, lalu `npm start`.

## Catatan prototipe

Login saat ini hanya memeriksa bahwa nama dan NIS terisi; NIS belum diverifikasi dan belum ada autentikasi akun sekolah. Data kandidat adalah contoh. Suara simulasi disimpan di `localStorage` browser dan nama pemilih di `sessionStorage`. Implementasi ini **bukan sistem pemilihan resmi**: sebelum digunakan sungguhan, diperlukan backend, autentikasi dan otorisasi pemilih, database, serta penyimpanan suara yang aman dan dapat diaudit.
