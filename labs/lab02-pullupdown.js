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
  judul: "Aktif High dan Aktif Low",
  singkat: "Aktif High/Low",
  modul: 1,
  tujuan: "Memahami kondisi aktif high dan aktif low melalui rangkaian pull-up dan pull-down.",

  panduan: [
    "Lepaskan resistor dari pin sinyal. Amati indikator yang berubah antara HIGH? dan LOW? tanpa pola. Pin berada dalam kondisi mengambang sehingga nilai logikanya tidak dapat ditentukan dengan stabil.",
    "Pilih mode Rakit Pull-Up, lalu pasang resistor ke VCC. Tahan dan lepaskan tombol. Saat tombol dilepas, indikator menunjukkan HIGH dengan tegangan 5 V. Saat tombol ditekan, indikator menunjukkan LOW dengan tegangan 0 V. Tombol ini bersifat aktif low karena kondisi aktif terjadi saat sinyal LOW.",
    "Pilih mode Rakit Pull-Down, lalu pasang resistor ke GND. Tahan dan lepaskan tombol. Saat tombol dilepas, indikator menunjukkan LOW dengan tegangan 0 V. Saat tombol ditekan, indikator menunjukkan HIGH dengan tegangan 5 V. Tombol ini bersifat aktif high karena kondisi aktif terjadi saat sinyal HIGH.",
    "Pasang resistor pada posisi yang tidak sesuai dengan mode rangkaian, lalu tekan dan lepaskan tombol. Amati bahwa sinyal tertahan pada satu nilai sehingga tombol tidak mengubah kondisi logika.",
    "Bandingkan rangkaian pull-up dan pull-down. Jelaskan hubungan antara posisi resistor, kondisi tombol, nilai HIGH atau LOW, dan penentuan aktif high atau aktif low. Setelah kedua rangkaian dirakit dan diuji dengan benar, checklist akan tercentang dan status lab berubah menjadi Selesai.",
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
    { id: "pullup", label: "Rakit dan uji pull-up (tekan = LOW, lepas = HIGH)", cek: (state) => state.modeTuntas("pullup") },
    { id: "pulldown", label: "Rakit dan uji pull-down (tekan = HIGH, lepas = LOW)", cek: (state) => state.modeTuntas("pulldown") },
  ],
};
