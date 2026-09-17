/*
 * Lab 12: Piksel dan Citra Digital.
 * Lab pembuka Modul 4 (Kamera). Gambar digital tersusun dari piksel, tiap
 * piksel cuma satu angka grayscale 0-255 (0 = hitam pekat, 255 = putih
 * penuh). Frame di sini menggambarkan pandangan dari atas garis di lantai,
 * gelap di area garis dan terang di area lantai. Konsep ini sama dengan
 * yang dibagi jadi 8 region di Lab 14, cuma di sini dilihat piksel demi
 * piksel dulu.
 */

import { buatFrame, FRAME_LEBAR, FRAME_TINGGI } from "../engine/kamera.js";
import { gambarKonsepPiksel, pikselDiTitik } from "../render/kameraView.js";

export function buatKonsepPiksel() {
  return {
    frame: buatFrame(),
    zoom: 2,
    pilihan: null,
    sudahPeriksaGaris: false,
    sudahPeriksaLantai: false,

    setZoom(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.zoom = Math.max(1, Math.min(8, nilai));
    },

    pilihPiksel(kolom, baris) {
      if (kolom === null || kolom < 0 || kolom >= FRAME_LEBAR || baris < 0 || baris >= FRAME_TINGGI) {
        this.pilihan = null;
        return;
      }
      this.pilihan = { kolom, baris };
      const nilai = this.frame[baris][kolom];
      if (nilai < 100) this.sudahPeriksaGaris = true;
      if (nilai > 150) this.sudahPeriksaLantai = true;
    },

    get nilaiDipilih() {
      return this.pilihan ? this.frame[this.pilihan.baris][this.pilihan.kolom] : null;
    },
  };
}

export default {
  id: 12,
  judul: "Piksel dan Citra Digital",
  singkat: "Piksel dan Citra Digital",
  modul: 4,
  tujuan: "Mengenali piksel sebagai unsur dasar citra digital dan membandingkan nilai grayscale pada garis dan lantai.",

  panduan: [
    "Geser slider Zoom ke kanan. Amati kotak-kotak piksel yang terlihat semakin jelas. Perbesaran hanya mengubah tampilan, bukan jumlah atau nilai piksel pada citra.",
    "Arahkan penunjuk atau ketuk salah satu piksel. Amati nilai grayscale yang ditampilkan, dari 0 untuk hitam hingga 255 untuk putih.",
    "Pilih piksel pada area garis gelap, kemudian pilih piksel pada area lantai terang. Bandingkan nilainya dan perhatikan bahwa area yang lebih gelap memiliki nilai lebih kecil.",
    "Periksa kedua area hingga checklist tercentang. Hasil ini menjadi dasar thresholding pada Lab 13, yaitu pemisahan piksel garis dan lantai berdasarkan nilainya.",
  ],

  komponen: { konsepPiksel: true },

  kontrol: [
    {
      jenis: "slider",
      id: "zoom",
      label: "Zoom",
      min: 1,
      max: 8,
      langkah: 0.5,
      nilaiAwal: 2,
      satuan: "×",
      terapkan: (state, nilai) => state.setZoom(nilai),
    },
    { jenis: "nilai", id: "nilaiPiksel", label: "Nilai piksel dipilih", satuan: "" },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: buatKonsepPiksel,

  pasangInteraksi(kanvas, state) {
    function tunjuk(e) {
      const rect = kanvas.getBoundingClientRect();
      const p = pikselDiTitik(rect.width, rect.height, state.zoom, e.clientX - rect.left, e.clientY - rect.top);
      state.pilihPiksel(p?.kolom ?? null, p?.baris ?? null);
    }
    kanvas.addEventListener("pointermove", tunjuk);
    kanvas.addEventListener("pointerdown", tunjuk);
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("nilaiPiksel", state.nilaiDipilih === null ? "—" : String(state.nilaiDipilih));
    panel.setTeks(
      "status",
      `garis diperiksa ${state.sudahPeriksaGaris ? "✓" : "…"} · lantai diperiksa ${state.sudahPeriksaLantai ? "✓" : "…"}`,
    );
  },

  kriteriaSelesai: [
    { id: "garis", label: "Periksa nilai piksel di area garis gelap", cek: (state) => state.sudahPeriksaGaris },
    { id: "lantai", label: "Periksa nilai piksel di area lantai terang", cek: (state) => state.sudahPeriksaLantai },
  ],
};
