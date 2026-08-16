# Standar Deck Video Lab

Aturan baku untuk membangun deck slide HTML beranimasi seperti `decks/deck-lab01.html`. Ditulis supaya deck lab berikutnya langsung mengikuti standar yang sama tanpa mengulang proses coba-coba.

## Prinsip dasar

Satu berkas HTML berdiri sendiri per lab, dibuka langsung di browser tanpa server. Boleh me-link `../styles/tokens.css` dan berkas font di `../assets/fonts/`, tapi semua markup, style, dan skrip navigasi ditanam di satu berkas. Semua warna lewat `var(--nama-token)` dari tokens.css, jangan menulis warna baru di luar token.

## Layout tiga zona

Setiap slide adalah `<section class="slide">` berisi tiga blok flex vertikal.

- `.zona-judul`, tinggi maksimum 22vh, berisi judul singkat.
- `.zona-ilustrasi`, mengisi sisa ruang, berisi satu SVG ilustrasi.
- `.zona-keterangan`, tinggi maksimum 18vh, berisi satu kalimat keterangan.

Beri padding aman minimum 90px di bagian bawah slide supaya tombol navigasi dan indikator nomor tidak menimpa konten, dan supaya rekaman layar penuh tidak memotong elemen paling bawah.

SVG ilustrasi diberi ukuran lewat `width: min(52vw, 520px); max-height: 52vh;` dan atribut `style="aspect-ratio: LEBAR/TINGGI"` yang menyesuaikan viewBox. Ini menjaga ilustrasi tetap proporsional dan tidak meluber di layar sempit maupun lebar. Verifikasi tata letak secara manual pada kombinasi lebar 1280, 1536, dan 1920 piksel dengan tinggi 720 sampai 1080, dengan menalar posisi tiap elemen relatif terhadap breakpoint tersebut jika pengujian langsung di browser tidak memungkinkan.

Teks label di dalam SVG dibatasi maksimum dua kata per label. Jaga jarak minimum 16 satuan viewBox antara satu label dan elemen visual atau label lain di dekatnya, supaya tidak ada teks yang saling menimpa pada skala layar berapa pun. Jarak ini tidak berlaku untuk teks yang memang satu kesatuan blok keterangan berbaris pendek, misalnya label dua baris dalam satu kartu.

## Standar kekayaan animasi

Setiap slide punya minimum tiga elemen beranimasi yang tertahap, bukan sekadar berkedip bersamaan. Satu slide dengan hanya satu elemen yang mengubah opacity naik turun tidak memenuhi standar ini dan harus ditulis ulang.

Pilih teknik animasi sesuai kebutuhan cerita, bukan diseragamkan asal beda. Teknik yang biasa dipakai di deck ini.

- Menggambar garis atau centang lewat `stroke-dasharray`/`stroke-dashoffset`.
- Gelombang atau titik berjalan lewat `translateX` di dalam `<clipPath>` bersarang, untuk efek tak berujung.
- Chip atau label muncul lewat pop kecil, `opacity` dan `transform: scale(...)` dari sekitar 0.6 ke 1.
- Garis penunjuk yang tergambar mengikuti chip, juga lewat stroke-dashoffset, dengan jeda singkat setelah chip muncul.
- Angka yang menghitung pelan dari satu nilai ke nilai lain lewat JavaScript `requestAnimationFrame` dengan fungsi easing, karena CSS murni tidak bisa mengubah isi teks angka secara bertahap.
- Pertukaran keadaan lewat transisi warna `fill` yang halus, dipakai untuk representasi analog seperti sensor yang membaca cahaya secara kontinu.
- Pertukaran nilai diskrit lewat pop-scale plus crossfade dua elemen teks bertumpuk, dipakai untuk representasi digital seperti angka 0 atau 1.

Rangkaian sebab akibat, misalnya jari menekan saklar lalu arus mengalir lalu LED menyala, disusun dengan jendela waktu berjenjang dalam satu `@keyframes` per elemen atau lewat properti panjang `animation-delay` yang saling mengikuti, dengan jeda sekitar 200 sampai 300 milidetik antar tahap supaya hubungan sebab akibatnya terasa, bukan serentak.

Satu siklus animasi berdurasi 6 sampai 9 detik, dengan jeda tahan di posisi penting supaya penonton sempat mencerna sebelum siklus berulang. Semua transisi memakai `ease-in-out` secara default. Pengecualian hanya untuk animasi aliran berkelanjutan yang harus terasa bergerak dengan kecepatan tetap, misalnya gelombang sinyal berjalan atau titik arus mengalir, yang memakai `linear`.

Hormati preferensi pengguna lewat `prefers-reduced-motion`, dengan mempercepat durasi animasi mendekati nol dan membatasi jumlah pengulangan, atau langsung menampilkan keadaan akhir tanpa animasi berjalan untuk elemen yang dikendalikan lewat skrip seperti penghitung angka.

## Dua jebakan CSS yang wajib dihindari

Dua kesalahan berikut sudah pernah terjadi berulang kali saat membangun deck ini dan menghasilkan bug yang sulit terlihat lewat tangkapan layar sesaat. Periksa keduanya setiap kali menambah animasi baru.

Pertama, jangan pernah menulis properti singkatan `animation` dua kali untuk elemen yang sama lewat dua kelas berbeda. Aturan CSS belakangan akan menimpa penuh aturan sebelumnya, bukan menggabungkan, sehingga animasi pertama diam-diam tidak pernah berjalan. Gabungkan jadi satu kelas dengan daftar `animation-name` dipisah koma, atau pecah lewat properti panjang `animation-name`, `animation-delay`, `animation-duration` di kelas-kelas terpisah.

Kedua, setiap elemen SVG yang di-scale lewat `transform: scale(...)` wajib diberi `transform-box: fill-box; transform-origin: center;`. Tanpa ini, SVG memakai titik asal viewBox di koordinat nol nol sebagai pusat skala, bukan pusat elemen itu sendiri, sehingga elemen terlihat meluncur ke pojok kiri atas saat mengecil dan kembali ke tempatnya saat membesar, alih-alih diam di tempat sambil membesar mengecil. Bug ini tidak kelihatan pada tangkapan layar keadaan akhir karena elemen sudah kembali diam di posisi benar, hanya kelihatan saat animasi sedang berjalan, jadi verifikasi dengan membaca posisi elemen di tengah transisi, bukan hanya di akhir.

## Bahasa

Naskah dan teks yang tampil di slide ditulis dalam Bahasa Indonesia lisan yang wajar, seperti dibacakan orang, bukan hasil terjemahan kaku. Hindari pemakaian kata "kita" berulang-ulang dalam satu deck. Hindari frasa kata benda bertumpuk yang tidak lazim diucapkan.

Judul slide maksimum sekitar lima kata. Keterangan di bawah ilustrasi maksimum satu kalimat. Angka desimal ditulis dengan koma, misalnya "4,6 V" bukan "4.6 V".

Teks yang tampil di slide, termasuk judul, keterangan, dan label di dalam SVG, tidak boleh mengandung tanda hubung, titik koma, dan titik dua. Tanda koma dan titik biasa tetap boleh dipakai.

## Verifikasi sebelum menganggap deck selesai

Sebelum melapor selesai, jalankan pemeriksaan berikut.

- Baca ulang seluruh berkas untuk memastikan tidak ada kelas yang menulis properti singkatan `animation` dua kali pada elemen yang sama. Skrip Node sederhana yang mengumpulkan semua selektor pemilik `animation` lalu mencocokkannya ke setiap atribut `class` di markup bisa dipakai untuk memeriksa ini secara menyeluruh dan cepat.
- Baca ulang seluruh berkas untuk memastikan setiap kelas yang memakai `scale(...)` di dalam `transform` juga menyetel `transform-box: fill-box; transform-origin: center;`.
- Jalankan lewat server HTTP lokal, karena beberapa alat pengujian browser memblokir navigasi `file://`.
- Jika alat pengujian browser tersedia, ukur posisi dan keadaan elemen lewat `getComputedStyle` atau `getBoundingClientRect` yang dijalankan berulang sepanjang waktu, bukan hanya lewat satu tangkapan layar, karena satu tangkapan layar bisa kebetulan menangkap keadaan yang sudah selesai bertransisi. Catatan penting, sebagian lingkungan pengujian menjalankan tab dalam keadaan tersembunyi di sisi sistem operasi, yang membuat Chrome menahan `requestAnimationFrame` dan mempercepat `setInterval` menjadi sekitar satu kali per detik. Ini bukan cerminan perilaku sebenarnya saat perekaman berlangsung, karena saat itu tab selalu aktif di layar depan, tapi berarti animasi berbasis skrip seperti penghitung angka mungkin perlu diverifikasi lewat pembacaan kode dan bukan lewat pengamatan langsung jika keterbatasan ini muncul.
- Telusuri setiap slide dan hitung jarak antar label teks di dalam SVG untuk memastikan tidak ada yang kurang dari 16 satuan viewBox dari elemen lain di dekatnya.
