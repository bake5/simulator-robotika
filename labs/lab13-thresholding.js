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

const TEMPLATE_JS = `function biner(nilaiPiksel, ambang) {
  // nilaiPiksel: satu angka grayscale 0-255. ambang: nilai pemisah 0-255
  // kembalikan 1 kalau piksel dianggap garis (lebih gelap dari ambang), 0 kalau dianggap lantai
  // contoh: nilaiPiksel = 30 (gelap), ambang = 128 -> garis -> kembalikan 1
  //
  // Kode yang benar sudah ditulis di bawah, di dalam komentar /* ... */. Hapus
  // baris "/*" dan baris "*/" di bawah ini (dua baris saja) supaya kode itu aktif.

  /*
  return nilaiPiksel < ambang ? 1 : 0;
  */
}
`;

function buatKasusUji() {
  return [
    { label: "Piksel gelap (30) vs ambang 128", nilaiPiksel: 30, ambang: 128, referensi: binerDariPiksel(30, 128) },
    { label: "Piksel terang (220) vs ambang 128", nilaiPiksel: 220, ambang: 128, referensi: binerDariPiksel(220, 128) },
    { label: "Piksel (100) vs ambang 100", nilaiPiksel: 100, ambang: 100, referensi: binerDariPiksel(100, 100) },
    { label: "Piksel (100) vs ambang 101", nilaiPiksel: 100, ambang: 101, referensi: binerDariPiksel(100, 101) },
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
  tujuan: "Mengubah grayscale jadi biner dengan nilai ambang, memahami efek ambang terlalu rendah atau tinggi.",

  panduan: [
    "Geser slider ambang dan perhatikan gambar biner di kanan. Garis putus-putus oranye di histogram menandai posisi ambang saat ini.",
    "Ambang terlalu rendah (dekat 0) membuat hampir semua piksel dianggap lantai, sehingga garis nyaris hilang dari hasil biner. Ambang terlalu tinggi (dekat 255) membuat hampir semua piksel dianggap garis.",
    "Ganti kondisi pencahayaan ke Redup atau Silau. Histogramnya akan menyempit dan bergeser, sehingga ambang yang tadinya pas di kondisi Normal bisa jadi tidak lagi memisahkan dengan bersih.",
    "Cari ambang yang memisahkan dengan bersih (di celah antara dua gerombolan nilai histogram) di minimal dua kondisi pencahayaan berbeda.",
    "Level 2: buka kartu kode di bawah. Kode biner(nilaiPiksel, ambang) yang benar sudah tertulis di sana, ditandai di dalam komentar. Baca dulu kodenya, lalu hapus baris '/*' dan baris '*/' supaya kode itu aktif, dan klik \"Uji fungsi biner\" untuk memeriksa. Lab ini selesai setelah dua syarat terpenuhi: ambang bersih ditemukan di minimal dua kondisi pencahayaan (langkah sebelumnya), dan Level 2 lulus semua uji.",
  ],

  deskripsiKoding:
    "Kode biner(nilaiPiksel, ambang) yang benar sudah disediakan di bawah, di dalam komentar /* ... */. Hapus baris '/*' dan baris '*/' supaya kode itu aktif, tidak perlu menulis perbandingannya dari nol. Fungsi ini menerima dua angka, satu nilai piksel grayscale (0-255) dan satu nilai ambang, lalu mengembalikan 1 (piksel dianggap garis) atau 0 (piksel dianggap lantai). Tombol 'Uji fungsi biner' memanggil fungsi Anda empat kali, dengan empat pasangan nilaiPiksel dan ambang yang berbeda.",

  komponen: { thresholding: true },

  kontrol: [
    {
      jenis: "slider",
      id: "ambang",
      label: "Ambang (threshold)",
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
            teks.textContent = `${kasus.label}: kode Anda = ${nilai}, seharusnya = ${kasus.referensi}`;
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
          catatan.textContent = "Semua uji lulus. Fungsi biner() Anda sudah benar.";
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
        ? "Level 2 belum lulus, lengkapi biner(nilaiPiksel, ambang)"
        : "cari dulu ambang bersih di minimal 2 kondisi";
    panel.setTeks(
      "status",
      `ambang bersih ditemukan di: normal ${d.normal ? "✓" : "…"} · redup ${d.redup ? "✓" : "…"} · silau ${d.silau ? "✓" : "…"} (${jumlahBersih}/3) · ${tahapKode}`,
    );
  },

  // Menemukan ambang bersih secara manual saja tidak lagi cukup — peserta
  // wajib mencoba dan berhasil melengkapi biner(nilaiPiksel, ambang).
  kriteriaSelesai: [
    {
      id: "ambangBersih",
      label: "Temukan ambang bersih di minimal 2 dari 3 kondisi pencahayaan (normal, redup, silau)",
      cek: (state) => Object.values(state.diperiksaBersih).filter(Boolean).length >= 2,
    },
    { id: "level2", label: "Fungsi biner(nilaiPiksel, ambang) buatanmu lulus semua uji", cek: (state) => state.level2Lulus },
  ],
};
