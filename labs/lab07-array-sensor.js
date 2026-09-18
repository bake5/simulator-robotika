/*
 * Lab 7 — Array 8 Photodiode.
 * Lab fondasi Modul 2 (dibangun lebih awal karena dipakai lab-lab berikutnya):
 * delapan sensor Lab 6 berjajar, dari pola bacaannya dihitung DI MANA garis
 * berada lewat weighted average — rumus inti robot line follower.
 *
 * Level 1: eksplorasi (drag + kartu rumus + toggle).
 * Level 2: peserta menulis sendiri hitungError(sensor), dinilai lewat Web
 * Worker (coding/runner.js) terhadap 3 posisi uji.
 */

import { buatArraySensor, hitungErrorReferensi, offsetSensor } from "../engine/rangkaian.js";
import { deltaPosisiDariPiksel } from "../render/rangkaianView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const TOLERANSI_UJI = 8; // pada skala error -100..100

const TEMPLATE_JS = `function hitungError(sensor) {
  // sensor: array 8 angka ADC (0-1023), indeks 0 = sensor paling kiri, 7 = paling kanan.
  // Nilai kecil = gelap (misal 50), nilai besar = terang (misal 900). Sensor ini
  // membaca cahaya yang dipantulkan garis hitam di atas alas putih.
  //
  // Tugas fungsi ini: dari 8 angka itu, kembalikan SATU angka error:
  //   -100 = garis ada di paling kiri
  //      0 = garis tepat di tengah
  //   +100 = garis ada di paling kanan
  //
  // Caranya lewat "weighted average": setiap sensor diberi bobot, sensor yang
  // membaca lebih gelap (angkanya lebih kecil) diberi bobot lebih besar, karena
  // sensor itu yang paling dekat dengan garis. Lalu posisi garis dihitung dari
  // rata-rata indeks sensor, ditimbang oleh bobot masing-masing.
  //
  // Kode yang menghitung ini sudah ditulis lengkap dan benar di bawah, di dalam
  // komentar /* ... */. Bacalah dulu, lalu hapus baris "/*" dan baris "*/" di
  // bawah ini (dua baris saja) supaya kode itu aktif dan bisa diuji.

  /*
  let totalBobot = 0; // jumlah semua bobot dari 8 sensor
  let totalTertimbang = 0; // jumlah dari (indeks sensor x bobot sensor), untuk semua sensor

  for (let i = 0; i < sensor.length; i++) {
    // Bobot sensor ke-i: makin gelap bacaannya, makin besar bobotnya.
    // Contoh: sensor[i] = 200 (gelap) -> bobot = 1023 - 200 = 823 (besar).
    //         sensor[i] = 900 (terang) -> bobot = 1023 - 900 = 123 (kecil).
    const bobot = 1023 - sensor[i];

    totalBobot += bobot;
    totalTertimbang += i * bobot;
  }

  // posisiIndeks adalah "titik berat" dari semua sensor, dalam satuan indeks (0..7).
  const posisiIndeks = totalTertimbang / totalBobot;

  const indeksTengah = (sensor.length - 1) / 2; // untuk 8 sensor, nilainya 3.5

  // Ubah posisiIndeks (skala 0..7) menjadi error (skala -100..+100).
  return ((posisiIndeks - indeksTengah) / indeksTengah) * 100;
  */
}
`;

function formatAngka(nilai) {
  return typeof nilai === "number" && Number.isFinite(nilai) ? nilai.toFixed(1) : String(nilai);
}

function buatKasusUji() {
  return [
    { label: "Posisi 1: garis di paling kiri", posisi: offsetSensor(0) },
    { label: "Posisi 2: garis tepat di tengah", posisi: 0 },
    { label: "Posisi 3: garis di paling kanan", posisi: offsetSensor(7) },
  ].map(({ label, posisi }) => {
    const acuan = buatArraySensor();
    acuan.setPosisiGaris(posisi);
    return { label, sensor: acuan.sensorADC, referensi: hitungErrorReferensi(acuan.sensorADC) };
  });
}

export default {
  id: 7,
  judul: "Array 8 Photodiode",
  singkat: "Array 8 Photodiode",
  modul: 2,
  tujuan: "Memahami cara pola bacaan delapan sensor digunakan untuk menghitung posisi garis dan error.",

  panduan: [
    "Pada Level 1, klik dan seret permukaan di kanvas seperti pada Lab 6. Delapan sensor kini membaca permukaan secara bersamaan.",
    "Perhatikan diagram batang di bawah kanvas. Saat garis melintas, biasanya satu atau dua batang turun karena membaca permukaan gelap, sedangkan batang lainnya tetap tinggi karena membaca permukaan terang. Panah hijau menandai perkiraan posisi garis. Posisi ini dapat berada di antara dua batang dan tidak harus tepat pada satu sensor.",
    "Aktifkan opsi 'Tampilkan rumus' untuk melihat perhitungan rata-rata berbobot (weighted average), lengkap dengan angka yang berubah mengikuti posisi garis saat ini.",
    "Pada Level 2, buka kartu kode di bawah kanvas setelah pola bacaan pada Level 1 dipahami. Kode hitungError(sensor) yang benar sudah tersedia di dalam komentar. Baca kodenya, lalu hapus baris '/*' dan baris '*/' agar kode tersebut aktif. Tombol 'Jalankan pada bacaan sensor saat ini' mencoba fungsi dengan satu bacaan. Tombol 'Uji 3 posisi' memeriksa fungsi terhadap tiga posisi garis yang berbeda.",
    "Lab ditandai selesai setelah fungsi hitungError(sensor) lulus ketiga kasus pada 'Uji 3 posisi'. Menggeser garis sampai ujung kiri dan kanan saja belum cukup. Bagian coding tetap perlu dikerjakan dengan mengaktifkan kode di dalam komentar dan menjalankan pengujian.",
    "Skala error ideal berada pada rentang −100 sampai +100. Sensor yang membaca permukaan putih pada simulator tidak sepenuhnya ideal sehingga nilai ujung yang tercapai lebih sempit, yaitu sekitar ±40. Kondisi ini menunjukkan alasan sensor robot line follower perlu dikalibrasi sebelum digunakan.",
  ],

  deskripsiKoding:
    "Kode hitungError(sensor) yang benar sudah disediakan di bawah, di dalam komentar /* ... */. Hapus baris '/*' dan baris '*/' agar kode tersebut aktif. Rumus tidak perlu ditulis dari awal. Fungsi ini menerima array delapan angka ADC sesuai bacaan pada diagram batang dan mengembalikan satu nilai error dari −100 sampai +100. Tombol 'Jalankan pada bacaan sensor saat ini' memanggil fungsi satu kali dengan bacaan sensor saat ini. Tombol 'Uji 3 posisi' memanggil fungsi tiga kali untuk posisi garis di kiri, tengah, dan kanan, kemudian menandai setiap kasus sebagai lulus atau gagal.",

  komponen: { arraySensor: true },

  kontrol: [
    { jenis: "nilai", id: "posisi", label: "Posisi (indeks)", satuan: "" },
    { jenis: "nilai", id: "error", label: "Error", satuan: "" },
    {
      jenis: "toggle",
      id: "tampilRumus",
      label: "Tampilkan rumus",
      nilaiAwal: true,
      terapkan: (state, nilai) => {
        state.setTampilkanRumus(nilai);
      },
    },
    {
      jenis: "rumus",
      id: "rumusWeighted",
      judul: "Weighted average posisi garis",
      baris: [
        { id: "bobot", simbol: "bobot[i] = 1023 − sensor[i]" },
        { id: "sigmaTertimbang", simbol: "Σ(i × bobot[i])" },
        { id: "sigmaBobot", simbol: "Σ(bobot[i])" },
        { id: "posisiIndeks", simbol: "posisiIndeks = Σ(i×bobot) ÷ Σ(bobot)" },
        { id: "error", simbol: "error = (posisiIndeks − 3.5) ÷ 3.5 × 100" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2],

  buatState: () => buatArraySensor(),

  /** Seret permukaan relatif terhadap kursor — sama seperti Lab 6. */
  pasangInteraksi(kanvas, state) {
    let menyeret = false;
    let posisiAwal = 0;
    let xAwal = 0;

    kanvas.style.touchAction = "none";
    kanvas.style.cursor = "grab";

    kanvas.addEventListener("pointerdown", (e) => {
      menyeret = true;
      posisiAwal = state.posisiGaris;
      xAwal = e.clientX;
      kanvas.style.cursor = "grabbing";
      kanvas.setPointerCapture(e.pointerId);
    });
    kanvas.addEventListener("pointermove", (e) => {
      if (!menyeret) return;
      state.setPosisiGaris(posisiAwal + deltaPosisiDariPiksel(e.clientX - xAwal));
    });
    const lepas = () => {
      menyeret = false;
      kanvas.style.cursor = "grab";
    };
    kanvas.addEventListener("pointerup", lepas);
    kanvas.addEventListener("pointercancel", lepas);
  },

  /** Bangun editor + tombol Jalankan/Uji untuk Level 2 — dipanggil sekali oleh aplikasiLab. */
  pasangKoding(wadah, state) {
    const editor = buatEditor(wadah, { kodeAwal: TEMPLATE_JS });

    const barisTombol = document.createElement("div");
    barisTombol.className = "baris-tombol-koding";
    const tombolJalankan = document.createElement("button");
    tombolJalankan.type = "button";
    tombolJalankan.className = "tombol-sekunder";
    tombolJalankan.textContent = "Jalankan pada bacaan sensor saat ini";
    const tombolUji = document.createElement("button");
    tombolUji.type = "button";
    tombolUji.className = "tombol";
    tombolUji.textContent = "Uji 3 posisi";
    barisTombol.append(tombolJalankan, tombolUji);
    wadah.append(barisTombol);

    const hasil = document.createElement("div");
    hasil.className = "hasil-koding";
    wadah.append(hasil);

    const runner = buatRunner();

    function tampilkanGalat(pesan) {
      hasil.innerHTML = "";
      const kotak = document.createElement("div");
      kotak.className = "pesan-galat-koding";
      kotak.textContent = pesan;
      hasil.append(kotak);
    }

    tombolJalankan.addEventListener("click", async () => {
      tombolJalankan.disabled = true;
      try {
        await runner.muatKode(editor.ambilKode());
        const nilai = await runner.panggil("hitungError", [state.sensorADC]);
        hasil.innerHTML = "";
        const baris = document.createElement("div");
        baris.className = "baris-uji-koding";
        baris.textContent = `Hasil fungsi: ${formatAngka(nilai)} (rujukan simulator saat ini: ${formatAngka(state.error)})`;
        hasil.append(baris);
      } catch (err) {
        tampilkanGalat(err?.message ?? String(err));
      } finally {
        tombolJalankan.disabled = false;
      }
    });

    tombolUji.addEventListener("click", async () => {
      tombolUji.disabled = true;
      try {
        await runner.muatKode(editor.ambilKode());
        const daftar = document.createElement("div");
        daftar.className = "daftar-uji-koding";
        let semuaLulus = true;

        for (const kasus of buatKasusUji()) {
          const baris = document.createElement("div");
          try {
            const nilai = await runner.panggil("hitungError", [kasus.sensor]);
            const lulus =
              typeof nilai === "number" && Number.isFinite(nilai) && Math.abs(nilai - kasus.referensi) <= TOLERANSI_UJI;
            semuaLulus = semuaLulus && lulus;
            baris.className = `baris-uji-koding ${lulus ? "lulus" : "gagal"}`;
            const tanda = document.createElement("span");
            tanda.className = "tanda-uji-koding";
            tanda.textContent = lulus ? "✓" : "✗";
            const teks = document.createElement("span");
            teks.textContent = `${kasus.label}: hasil fungsi = ${formatAngka(nilai)}, seharusnya ≈ ${formatAngka(kasus.referensi)}`;
            baris.append(tanda, teks);
          } catch (err) {
            semuaLulus = false;
            baris.className = "baris-uji-koding gagal";
            baris.textContent = `${kasus.label}: ${err?.message ?? String(err)}`;
          }
          daftar.append(baris);
        }

        hasil.innerHTML = "";
        hasil.append(daftar);
        state.level2Lulus = semuaLulus;
        if (semuaLulus) {
          const catatan = document.createElement("p");
          catatan.className = "baris-status";
          catatan.textContent = "Semua uji lulus. Fungsi hitungError(sensor) sudah benar.";
          hasil.append(catatan);
        }
      } catch (err) {
        tampilkanGalat(err?.message ?? String(err));
      } finally {
        tombolUji.disabled = false;
      }
    });
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("posisi", state.posisiIndeksEstimasi.toFixed(2));
    panel.setAngka("error", state.error.toFixed(1));
    panel.setTampil("rumusWeighted", state.tampilkanRumus);

    const bobot = state.bobotSensor;
    panel.setRumus("rumusWeighted", "bobot", `= [${bobot.map((b) => Math.round(b)).join(", ")}]`);
    const totalTertimbang = bobot.reduce((jumlah, b, i) => jumlah + i * b, 0);
    panel.setRumus("rumusWeighted", "sigmaTertimbang", `= ${totalTertimbang.toFixed(0)}`);
    panel.setRumus("rumusWeighted", "sigmaBobot", `= ${state.totalBobot.toFixed(0)}`);
    panel.setRumus("rumusWeighted", "posisiIndeks", `= ${totalTertimbang.toFixed(0)} ÷ ${state.totalBobot.toFixed(0)} = ${state.posisiIndeksEstimasi.toFixed(2)}`);
    panel.setRumus(
      "rumusWeighted",
      "error",
      `= (${state.posisiIndeksEstimasi.toFixed(2)} − 3.5) ÷ 3.5 × 100 = ${state.error.toFixed(1)}`,
    );

    const peringatan = state.kemungkinanGarisHilang ? " ⚠ kemungkinan garis di luar jangkauan" : "";
    const sapuSelesai = state.sudahKiri && state.sudahKanan;
    const tahapKode = state.level2Lulus ? "Level 2 ✓ (lab selesai)" : sapuSelesai ? "Level 2 belum lulus, coba lengkapi hitungError(sensor)" : "geser dulu sampai ujung kiri dan kanan";
    panel.setTeks(
      "status",
      `Rentang gerak: kiri ${state.sudahKiri ? "✓" : "…"} · kanan ${state.sudahKanan ? "✓" : "…"}${peringatan} · ${tahapKode}`,
    );
  },

  // Lab ini baru ditandai selesai kalau peserta benar-benar mencoba DAN berhasil
  // melengkapi hitungError(sensor) (lulus ketiga uji posisi) — sapu penuh kiri/kanan
  // sendirian tidak cukup, supaya peserta tidak melewati coding sama sekali.
  kriteriaSelesai: [
    { id: "kiri", label: "Geser garis hingga mencapai batas kiri", cek: (state) => state.sudahKiri },
    { id: "kanan", label: "Geser garis hingga mencapai batas kanan", cek: (state) => state.sudahKanan },
    { id: "level2", label: "Fungsi hitungError(sensor) lulus ketiga uji posisi", cek: (state) => state.level2Lulus },
  ],
};
