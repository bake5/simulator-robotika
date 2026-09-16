/*
 * Lab 2 — Resistor Pull-Up dan Pull-Down.
 * Praktek rakit: pasang resistor ke VCC (pull-up) atau GND (pull-down),
 * rasakan pin mengambang, lalu uji tekan-lepas tombol di kedua konfigurasi.
 */

import { buatRangkaianPull } from "../engine/rangkaian.js";

function statusMode(state, nama, label) {
  if (state.modeTuntas(nama)) return `${label} ✓`;
  const rakit = state.rakitan[nama];
  const benar = rakit.resistor === (nama === "pullup" ? "vcc" : "gnd");
  if (!benar) return `${label}: rakit dulu`;
  if (!rakit.ujiTekan) return `${label}: tekan tombolnya`;
  return `${label}: lepas tombolnya`;
}

export default {
  id: 2,
  judul: "Resistor Pull-Up dan Pull-Down",
  singkat: "Pull-Up & Pull-Down",
  modul: 1,
  tujuan: "Merakit resistor pull-up dan pull-down, memahami asal sinyal aktif low dan aktif high.",

  panduan: [
    "Amati pin sinyal tanpa resistor terpasang. Nilainya tidak stabil dan berubah-ubah tanpa pola karena pin dalam kondisi mengambang. Karena itu, pin input selalu memerlukan resistor pull-up atau pull-down.",
    "Mode Rakit Pull-Up: tombol menghubungkan pin ke GND. Pasang resistor ke VCC, lalu tahan dan lepas tombol. Lepas = HIGH, tekan = LOW → tombol ini aktif low.",
    "Mode Rakit Pull-Down: tombol menghubungkan pin ke VCC. Pasang resistor ke GND, lalu tahan dan lepas tombol. Lepas = LOW, tekan = HIGH → aktif high.",
    "Coba juga pasang resistor pada posisi yang salah. Sinyal akan tertahan di satu nilai dan tombol tidak berpengaruh.",
    "Banyak modul sensor garis memakai logika aktif low: garis hitam = pantulan rendah = nilai rendah. Konsep ini muncul lagi mulai Lab 6.",
  ],

  komponen: { rangkaianPull: true },

  kontrol: [
    {
      jenis: "tab",
      id: "mode",
      label: "Mode rakit",
      pilihan: [
        { nilai: "pullup", label: "Rakit Pull-Up" },
        { nilai: "pulldown", label: "Rakit Pull-Down" },
      ],
      terapkan: (state, nilai) => state.setMode(nilai),
    },
    {
      jenis: "pilihan",
      id: "resistor",
      label: "Pasang resistor ke",
      pilihan: [
        { nilai: "vcc", label: "VCC (atas)" },
        { nilai: "gnd", label: "GND (bawah)" },
        { nilai: "", label: "Lepas" },
      ],
      terapkan: (state, nilai) => state.setResistor(nilai || null),
    },
    {
      jenis: "tombolTahan",
      id: "tombol",
      label: "Tahan tombol",
      terapkan: (state, nilai) => state.setTombol(nilai),
    },
    { jenis: "indikatorLogika", id: "logika", label: "Pin sinyal" },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatRangkaianPull(),

  langkah: (state, dt) => state.langkah(dt),

  perbaruiPanel(panel, state) {
    const keluar = state.output;
    if (keluar === "AMBANG") {
      panel.setIndikator("logika", {
        nilai: state.logikaTampak ? "HIGH?" : "LOW?",
        varian: "ambang",
        keterangan: "mengambang, nilai tidak stabil",
      });
    } else {
      panel.setIndikator("logika", {
        nilai: keluar,
        varian: keluar === "HIGH" ? "tinggi" : "rendah",
        tegangan: keluar === "HIGH" ? 5 : 0,
      });
    }
    // sinkronkan pilihan resistor dengan rakitan mode aktif (tiap mode punya rakitan sendiri)
    panel.setNilai("resistor", state.rakitAktif.resistor ?? "");
    panel.setTeks(
      "status",
      `${statusMode(state, "pullup", "Pull-up")} · ${statusMode(state, "pulldown", "Pull-down")}`,
    );
  },

  kriteriaSelesai: [
    { id: "pullup", label: "Rakit dan uji pull up (tekan = LOW, lepas = HIGH)", cek: (state) => state.modeTuntas("pullup") },
    { id: "pulldown", label: "Rakit dan uji pull down (tekan = HIGH, lepas = LOW)", cek: (state) => state.modeTuntas("pulldown") },
  ],
};
