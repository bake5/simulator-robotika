/*
 * Lab 1: LED On Off.
 * Lab paling sederhana, sekaligus contoh pola berkas definisi lab.
 */

import { buatRangkaianLED } from "../engine/rangkaian.js";

export default {
  id: 1,
  judul: "LED On Off",
  singkat: "LED On Off",
  modul: 1,
  tujuan: "Memahami sinyal digital HIGH dan LOW.",

  panduan: [
    "Klik saklar untuk menutup rangkaian. Arus mengalir, LED menyala, dan indikator menunjukkan HIGH (5 V).",
    "Klik saklar lagi untuk membuka rangkaian. LED mati dan indikator kembali ke LOW (0 V).",
    "Ulangi menyalakan dan mematikan LED masing-masing minimal 3 kali sampai lab ditandai selesai.",
    "Ini adalah sinyal digital: mikrokontroler hanya mengenal dua keadaan, HIGH dan LOW. Konsep yang sama akan dipakai pada pembacaan sensor garis di lab-lab berikutnya.",
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
    { id: "mati", label: "Matikan LED minimal 3 kali", cek: (state) => state.hitungMati >= 3 },
  ],
};
