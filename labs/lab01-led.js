/*
 * Lab 1: LED ON/OFF.
 * Lab paling sederhana, sekaligus contoh pola berkas definisi lab.
 */

import { buatRangkaianLED } from "../engine/rangkaian.js";

export default {
  id: 1,
  judul: "LED ON/OFF",
  singkat: "LED ON/OFF",
  modul: 1,
  tujuan: "Memahami sinyal digital HIGH dan LOW.",

  panduan: [
    "Aktifkan saklar pada panel Kontrol. Amati saklar pada diagram yang kini berada dalam kondisi tertutup. Pada kondisi ini, LED menyala dan indikator berubah menjadi HIGH dengan tegangan 5 V.",
    "Nonaktifkan saklar. Amati saklar pada diagram yang kini berada dalam kondisi terbuka. Pada kondisi ini, LED padam dan indikator berubah menjadi LOW dengan tegangan 0 V.",
    "Nyalakan dan padamkan LED masing-masing minimal tiga kali. Jumlah percobaan dapat dilihat pada panel Kontrol. Setelah kedua target tercapai, checklist akan tercentang dan status lab berubah menjadi Selesai.",
    "Bandingkan kedua kondisi tersebut. Jelaskan hubungan antara posisi saklar, kondisi LED, dan tegangan yang ditampilkan.",
  ],

  // renderer merakit tampilan dari daftar komponen ini
  komponen: { rangkaianLED: true },

  kontrol: [
    {
      jenis: "toggle",
      id: "saklar",
      label: "Saklar",
      terapkan: (state, nilai) => state.setSaklar(nilai),
    },
    { jenis: "indikatorLogika", id: "logika", label: "Level tegangan" },
    { jenis: "teks", id: "hitungan" },
  ],

  levelCoding: [1],

  buatState: () => buatRangkaianLED(),

  // dipanggil tiap frame oleh aplikasiLab
  perbaruiPanel(panel, state) {
    panel.setLogika("logika", state.saklar, state.tegangan);
    panel.setTeks("hitungan", `Nyala ${state.hitungNyala}× · Mati ${state.hitungMati}× (target masing-masing 3×)`);
  },

  kriteriaSelesai: [
    { id: "nyala", label: "Nyalakan LED minimal 3 kali", cek: (state) => state.hitungNyala >= 3 },
    { id: "mati", label: "Padamkan LED minimal 3 kali", cek: (state) => state.hitungMati >= 3 },
  ],
};
