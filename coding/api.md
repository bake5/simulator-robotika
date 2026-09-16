# Kontrak Kode Peserta

## Level 2 — Lab 7: `hitungError(sensor)`

```js
function hitungError(sensor) {
  // sensor: array 8 angka ADC (0-1023), indeks 0 = sensor paling kiri, 7 = paling kanan
  // kembalikan satu angka: -100 (garis di paling kiri) sampai +100 (garis di paling kanan), 0 = tepat di tengah
}
```

Rumus rujukan (`hitungErrorReferensi` di `engine/rangkaian.js`, dipakai juga untuk menilai jawaban):

```
bobot[i]      = 1023 - sensor[i]                                  // makin gelap, makin besar bobotnya
posisiIndeks  = Σ(i × bobot[i]) ÷ Σ(bobot[i])                      // 0..7
error         = (posisiIndeks - 3.5) ÷ 3.5 × 100                  // idealnya -100..100
```

Catatan: skala -100..100 itu batas teoritis (lihat komentar di engine) — jangkauan yang benar-benar tercapai lebih sempit karena kontras sensor tidak sempurna. Penilaian memberi toleransi, bukan mencocokkan angka persis.

## Level 2/3 — Lab 10, 11, 15, 16: `kendali(sensor)`

```js
function kendali(sensor) {
  // sensor: array 8 angka ADC (0-1023), indeks 0 = sensor paling kiri, 7 = paling kanan
  // kembalikan [kecepatanKiri, kecepatanKanan], masing-masing -100..100
}
```

```py
def kendali(sensor):
    # sensor: list 8 angka ADC (0-1023), indeks 0 = sensor paling kiri, 7 = paling kanan
    # kembalikan [kecepatanKiri, kecepatanKanan], masing-masing -100..100
    ...
```

Kontrak identik di JS (Level 2) dan Python (Level 3) — inilah kontrak universal yang disebut CLAUDE.md. Dipanggil berulang saat robot berjalan, kira-kira 10 kali per detik (bukan tiap langkah fisika 120 Hz) — meniru laju baca-sensor mikrokontroler sungguhan. Kode yang perlu menyimpan keadaan antar panggilan (mis. integral error untuk PID) boleh pakai variabel di luar fungsi (scope modul) — worker tetap hidup dan variabelnya bertahan selama kode tidak dimuat ulang.

## Protokol pesan Worker (JS dan Python, sama persis)

Main → Worker:
- `{ tipe: "muatKode", kode }` — JS: evaluasi sumber kode peserta di scope global worker. Python: `pyodide.runPython(kode)`.
- `{ tipe: "panggil", id, nama, argumen }` — JS: panggil `self[nama](...argumen)`. Python: panggil `pyodide.globals.get(nama)(...argumen)`.

Worker → Main:
- `{ tipe: "siap" }` — kode berhasil dimuat tanpa galat sintaks.
- `{ tipe: "hasil", id, nilai }` — hasil pemanggilan fungsi (Python: dikonversi ke nilai JS lewat `.toJs()` kalau berupa list/objek).
- `{ tipe: "galat", id?, pesan }` — galat sintaks (tanpa `id`) atau galat saat memanggil fungsi (dengan `id`).

Timeout per panggilan: 50 ms bawaan (JS, `coding/worker-js.js`). Python (`coding/worker-py.js`) dipanggil lewat `buatRunner({ berkasWorker: "./worker-py.js", timeoutMs: ... })` dengan timeout lebih longgar karena overhead Pyodide — lihat pemakaiannya di `labs/lab11-kendali-pid.js`. Timeout habis → worker lama dihentikan (`terminate()`), worker baru dibuat, kode (dan untuk Python, Pyodide-nya) perlu dimuat ulang lewat `muatKode` sebelum panggilan berikutnya. Pesan yang ditampilkan ke peserta: "Kode terlalu lama berjalan, kemungkinan ada perulangan tak berujung." — ramah, tanpa stack trace mentah.

## Status implementasi

- `coding/editor.js` sementara `<textarea>` polos, bukan CodeMirror 6 (keputusan resmi CLAUDE.md). API-nya (`ambilKode`/`setKode`) sudah dirancang supaya penggantinya nanti tinggal tukar isi modul ini.
- `coding/worker-py.js` (Python via Pyodide, Level 3) memuat Pyodide LAZY dari CDN jsdelivr saat lab Level 3 pertama dibuka, di-cache browser setelahnya. Belum ada salinan lokal ter-vendor sebagai fallback offline sungguhan — kalau CDN tak terjangkau, worker mengirim pesan galat yang menjelaskan itu ke peserta. Menambahkan vendor lokal adalah pekerjaan lanjutan yang belum dikerjakan.
- `coding/runner.js` generik lewat opsi `berkasWorker` — `buatRunner()` polos memakai worker JS, `buatRunner({ berkasWorker: "./worker-py.js" })` memakai worker Python. Kedua sisi worker menaati protokol pesan yang sama di atas.
