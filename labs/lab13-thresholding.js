/*
 * Lab 13 — Thresholding.
 * Mengubah grayscale (0-255) jadi biner (0 atau 1) lewat satu nilai ambang —
 * piksel lebih gelap dari ambang jadi 1 (dianggap garis), lebih terang jadi 0
 * (dianggap lantai). Kondisi pencahayaan yang berubah-ubah (Lab 13) menunjukkan
 * kenapa satu ambang tetap tidak selalu cocok — inilah alasan sistem
 * penglihatan robot sungguhan sering menyesuaikan ambangnya otomatis.
 *
 * Level 1: eksplorasi (slider ambang + pilihan kondisi pencahayaan).
 * Level 2: peserta menulis biner(nilaiPiksel, ambang), dinilai lewat Web
 * Worker terhadap beberapa nilai uji.
 */

import { buatFrame, binerDariPiksel, KONDISI_PENCAHAYAAN } from "../engine/kamera.js";
import { gambarThresholding } from "../render/kameraView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const MARGIN_BERSIH = 10;

const TEMPLATE_JS = `function biner(nilaiPiksel, threshold) {
  // nilaiPiksel: satu angka grayscale 0-255. threshold: nilai pemisah 0-255
  // kembalikan 1 kalau piksel dianggap garis (lebih gelap dari threshold), 0 kalau dianggap lantai
  // contoh: nilaiPiksel = 30 (gelap), threshold = 128 -> garis -> kembalikan 1
  //
  // Kode yang benar sudah ditulis di bawah, di dalam komentar /* ... */. Hapus
  // baris "/*" dan baris "*/" di bawah ini (dua baris saja) supaya kode itu aktif.

  /*
  return nilaiPiksel < threshold ? 1 : 0;
  */
}
`;

function buatKasusUji() {
  return [
    { label: "Piksel gelap (30) vs threshold 128", nilaiPiksel: 30, ambang: 128, referensi: binerDariPiksel(30, 128) },
    { label: "Piksel terang (220) vs threshold 128", nilaiPiksel: 220, ambang: 128, referensi: binerDariPiksel(220, 128) },
    { label: "Piksel (100) vs threshold 100", nilaiPiksel: 100, ambang: 100, referensi: binerDariPiksel(100, 100) },
    { label: "Piksel (100) vs threshold 101", nilaiPiksel: 100, ambang: 101, referensi: binerDariPiksel(100, 101) },
  ];
}

function buatStateThresholding() {
  return {
    ambang: 128,
    kondisi: "normal",
    diperiksaBersih: { normal: false, redup: false, silau: false },
    level2Lulus: false,

    get frame() {
      return buatFrame(undefined, this.kondisi);
    },

    get frameBiner() {
      const frame = this.frame;
      const ambang = this.ambang;
      return frame.map((baris) => baris.map((v) => binerDariPiksel(v, ambang)));
    },

    setAmbang(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.ambang = Math.max(0, Math.min(255, nilai));
      this._cekBersih();
    },

    setKondisi(nilai) {
      if (!KONDISI_PENCAHAYAAN[nilai]) return;
      this.kondisi = nilai;
      this._cekBersih();
    },

    _cekBersih() {
      const { gelap, terang } = KONDISI_PENCAHAYAAN[this.kondisi];
      if (this.ambang > gelap + MARGIN_BERSIH && this.ambang < terang - MARGIN_BERSIH) {
        this.diperiksaBersih[this.kondisi] = true;
      }
    },
  };
}

export default {
  id: 13,
  judul: "Thresholding",
  singkat: "Thresholding",
  modul: 4,
  tujuan: "Mengubah citra grayscale menjadi citra biner dan mengamati pengaruh nilai threshold pada hasil pemisahan garis dan lantai.",

  panduan: [
    "Geser slider Threshold. Amati perubahan citra biner di sisi kanan dan posisi garis oranye pada histogram. Piksel yang nilainya lebih kecil dari threshold diklasifikasikan sebagai garis.",
    "Atur threshold mendekati 0, kemudian mendekati 255. Amati bahwa threshold yang terlalu rendah membuat garis menghilang, sedangkan threshold yang terlalu tinggi membuat hampir seluruh citra dianggap garis.",
    "Pilih kondisi pencahayaan Normal, Redup, dan Silau. Amati pergeseran kelompok nilai pada histogram dan perubahan hasil citra biner untuk nilai threshold yang sama.",
    "Tentukan threshold yang memisahkan garis dan lantai dengan jelas pada minimal dua kondisi pencahayaan. Checklist pertama tercentang setelah target ini tercapai.",
    "Buka bagian coding Level 2. Aktifkan kode fungsi biner(nilaiPiksel, threshold) yang tersedia, lalu pilih Uji fungsi biner. Lab selesai setelah fungsi lulus seluruh kasus uji.",
  ],

  deskripsiKoding:
    "Kode fungsi biner(nilaiPiksel, threshold) tersedia di dalam komentar /* ... */. Hapus penanda komentar agar kode aktif. Fungsi menerima nilai piksel grayscale 0 sampai 255 dan nilai threshold, kemudian mengembalikan 1 untuk garis atau 0 untuk lantai. Tombol 'Uji fungsi biner' menjalankan empat pasangan nilai uji.",

  komponen: { thresholding: true },

  kontrol: [
    {
      jenis: "slider",
      id: "ambang",
      label: "Threshold",
      min: 0,
      max: 255,
      langkah: 1,
      nilaiAwal: 128,
      terapkan: (state, nilai) => state.setAmbang(nilai),
    },
    {
      jenis: "pilihan",
      id: "kondisi",
      label: "Kondisi pencahayaan",
      pilihan: [
        { label: "Normal", nilai: "normal" },
        { label: "Redup", nilai: "redup" },
        { label: "Silau", nilai: "silau" },
      ],
      terapkan: (state, nilai) => state.setKondisi(nilai),
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2],

  buatState: buatStateThresholding,

  pasangKoding(wadah, state) {
    const editor = buatEditor(wadah, { kodeAwal: TEMPLATE_JS });

    const barisTombol = document.createElement("div");
    barisTombol.className = "baris-tombol-koding";
    const tombolUji = document.createElement("button");
    tombolUji.type = "button";
    tombolUji.className = "tombol";
    tombolUji.textContent = "Uji fungsi biner";
    barisTombol.append(tombolUji);
    wadah.append(barisTombol);

    const hasilEl = document.createElement("div");
    hasilEl.className = "hasil-koding";
    wadah.append(hasilEl);

    const runner = buatRunner();

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
            const nilai = await runner.panggil("biner", [kasus.nilaiPiksel, kasus.ambang]);
            const lulus = nilai === kasus.referensi;
            semuaLulus = semuaLulus && lulus;
            baris.className = `baris-uji-koding ${lulus ? "lulus" : "gagal"}`;
            const tanda = document.createElement("span");
            tanda.className = "tanda-uji-koding";
            tanda.textContent = lulus ? "✓" : "✗";
            const teks = document.createElement("span");
            teks.textContent = `${kasus.label}: hasil kode = ${nilai}, seharusnya = ${kasus.referensi}`;
            baris.append(tanda, teks);
          } catch (err) {
            semuaLulus = false;
            baris.className = "baris-uji-koding gagal";
            baris.textContent = `${kasus.label}: ${err?.message ?? String(err)}`;
          }
          daftar.append(baris);
        }

        hasilEl.innerHTML = "";
        hasilEl.append(daftar);
        state.level2Lulus = semuaLulus;
        if (semuaLulus) {
          const catatan = document.createElement("p");
          catatan.className = "baris-status";
          catatan.textContent = "Semua uji lulus. Fungsi biner() sudah benar.";
          hasilEl.append(catatan);
        }
      } catch (err) {
        hasilEl.innerHTML = "";
        const kotak = document.createElement("div");
        kotak.className = "pesan-galat-koding";
        kotak.textContent = err?.message ?? String(err);
        hasilEl.append(kotak);
      } finally {
        tombolUji.disabled = false;
      }
    });
  },

  perbaruiPanel(panel, state) {
    const d = state.diperiksaBersih;
    const jumlahBersih = Object.values(d).filter(Boolean).length;
    const cukupKondisi = jumlahBersih >= 2;
    const tahapKode = state.level2Lulus
      ? "Level 2 ✓ (lab selesai)"
      : cukupKondisi
        ? "Level 2 belum lulus, lengkapi biner(nilaiPiksel, threshold)"
        : "cari dulu threshold yang sesuai pada minimal 2 kondisi";
    panel.setTeks(
      "status",
      `threshold sesuai ditemukan pada kondisi: normal ${d.normal ? "✓" : "…"} · redup ${d.redup ? "✓" : "…"} · silau ${d.silau ? "✓" : "…"} (${jumlahBersih}/3) · ${tahapKode}`,
    );
  },

  // Menemukan ambang bersih secara manual saja tidak lagi cukup — peserta
  // wajib mencoba dan berhasil melengkapi biner(nilaiPiksel, ambang).
  kriteriaSelesai: [
    {
      id: "ambangBersih",
      label: "Temukan threshold yang sesuai pada minimal 2 dari 3 kondisi pencahayaan (normal, redup, silau)",
      cek: (state) => Object.values(state.diperiksaBersih).filter(Boolean).length >= 2,
    },
    { id: "level2", label: "Fungsi biner(nilaiPiksel, threshold) lulus semua uji", cek: (state) => state.level2Lulus },
  ],
};
