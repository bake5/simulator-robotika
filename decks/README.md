# Deck Video Lab

Kumpulan deck slide HTML beranimasi untuk rekaman video materi tiap lab. Satu berkas HTML per lab, berdiri sendiri, dibuka langsung dari berkas tanpa server.

## Cara memakai untuk merekam

1. Buka berkas deck (misalnya `deck-lab01.html`) langsung di Chrome atau Edge dengan klik dua kali, atau tarik ke jendela browser.
2. Perbesar jendela browser sepenuh layar (`F11` untuk mode kios di Chrome/Edge menyembunyikan bilah alamat).
3. Mulai perekam layar (OBS, bawaan Windows, atau lainnya).
4. Pindah slide dengan tombol panah kiri/kanan di keyboard, atau klik tombol bulat di kiri/kanan layar. Nomor slide kecil tampil di pojok kanan bawah sebagai penanda posisi.
5. Bacakan naskah narasi sambil memindahkan slide. Semua animasi berjalan otomatis dan berulang pelan, tidak perlu diklik atau ditunggu.
6. Slide pertama tidak bisa mundur lagi dan slide terakhir tidak bisa maju lagi, tombolnya otomatis nonaktif sebagai penanda.

## Menambah deck baru

Salin struktur `deck-lab01.html`: satu `<section class="slide">` per slide, ilustrasi SVG flat ditanam langsung, animasi lewat `@keyframes` di `<style>`. Ambil warna dari `styles/tokens.css` lewat variabel `var(--nama-token)`, jangan menulis warna baru di luar token. Jangan pakai tanda hubung, titik koma, atau titik dua di teks yang tampil pada slide.
