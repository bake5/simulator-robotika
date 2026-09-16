/*
 * Lab 12: Konsep Piksel.
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
  judul: "Konsep Piksel",
  singkat: "Konsep Piksel",
  modul: 4,
  tujuan: "Gambar digital tersusun dari piksel bernilai 0-255 (grayscale).",

  panduan: [
    "Geser slider zoom untuk memperbesar frame sampai terlihat jelas kotak-kotak piksel individualnya.",
    "Arahkan kursor atau ketuk sebuah piksel untuk melihat nilai grayscale-nya, 0 (hitam pekat) sampai 255 (putih penuh).",
    "Periksa nilai piksel di area garis gelap dan di area lantai terang, lalu bandingkan kedua angkanya.",
    "Konsep ini sama dengan yang dipakai di Lab 14: delapan kelompok kolom piksel dirata-ratakan sekaligus, bukan dibaca satu per satu, meniru delapan photodiode di Lab 7.",
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
      `sudah periksa garis ${state.sudahPeriksaGaris ? "✓" : "…"} · sudah periksa lantai ${state.sudahPeriksaLantai ? "✓" : "…"}`,
    );
  },

  kriteriaSelesai: [
    { id: "garis", label: "Periksa nilai piksel di area garis gelap", cek: (state) => state.sudahPeriksaGaris },
    { id: "lantai", label: "Periksa nilai piksel di area lantai terang", cek: (state) => state.sudahPeriksaLantai },
  ],
};
