/*
 * Lab 3: rangkaian pembagi tegangan dengan dua resistor.
 * Dua slider mengubah R1 dan R2 agar hubungan antara rasio resistansi
 * dan tegangan keluaran terlihat langsung.
 */

import { buatPembagiTegangan, TEGANGAN_SUMBER } from "../engine/rangkaian.js";

export default {
  id: 3,
  judul: "Pembagi Tegangan",
  singkat: "Pembagi Tegangan",
  modul: 1,
  tujuan: "Memahami cara dua resistor membagi tegangan sumber menjadi tegangan keluaran.",

  panduan: [
    "Atur R1 dan R2 ke nilai yang sama. R1 adalah resistor atas yang terhubung ke sumber 5 V, sedangkan R2 adalah resistor bawah yang terhubung ke GND 0 V. Amati tegangan keluaran (Vout) pada titik tengah yang berubah menjadi 2,5 V karena kedua resistor membagi tegangan sama besar.",
    "Atur R1 lebih besar daripada R2. Amati Vout yang menurun karena bagian tegangan pada R2 menjadi lebih kecil. Temukan kombinasi yang menghasilkan Vout maksimal 1,5 V.",
    "Atur R2 lebih besar daripada R1. Amati Vout yang meningkat karena bagian tegangan pada R2 menjadi lebih besar. Temukan kombinasi yang menghasilkan Vout minimal 3,5 V.",
    "Bandingkan ketiga kondisi pada panel Kontrol dan kartu Rumus. Setelah target tegangan rendah, seimbang, dan tinggi tercapai, checklist akan tercentang dan status lab berubah menjadi Selesai. Jelaskan hubungan antara nilai R1, nilai R2, dan tegangan keluaran Vout.",
  ],

  komponen: { pembagiTegangan: true },

  kontrol: [
    {
      jenis: "slider",
      id: "resistorAtas",
      label: "R1, resistor atas",
      min: 1,
      max: 10,
      langkah: 0.5,
      nilaiAwal: 10,
      satuan: "kΩ",
      terapkan: (state, nilai) => state.setResistansiAtas(nilai * 1000),
    },
    {
      jenis: "slider",
      id: "resistorBawah",
      label: "R2, resistor bawah",
      min: 1,
      max: 10,
      langkah: 0.5,
      nilaiAwal: 5,
      satuan: "kΩ",
      terapkan: (state, nilai) => state.setResistansiBawah(nilai * 1000),
    },
    { jenis: "nilai", id: "arus", label: "Arus", satuan: "mA" },
    { jenis: "nilai", id: "vKeluar", label: "Vout", satuan: "V" },
    { jenis: "nilai", id: "rasio", label: "Bagian R2", satuan: "%" },
    {
      jenis: "rumus",
      id: "rumus",
      judul: "Rumus dan perhitungan saat ini",
      baris: [
        { id: "total", simbol: "Rtotal = R1 + R2" },
        { id: "keluar", simbol: "Vout = Vsumber × R2 ÷ (R1 + R2)" },
        { id: "arus", simbol: "I = Vsumber ÷ (R1 + R2)" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatPembagiTegangan(),

  langkah: (state, dt) => state.langkah(dt),

  perbaruiPanel(panel, state) {
    panel.setAngka("arus", state.arusMiliAmp.toFixed(2));
    panel.setAngka("vKeluar", state.teganganKeluar.toFixed(2));
    panel.setAngka("rasio", (state.rasioBawah * 100).toFixed(1));

    const vSumber = TEGANGAN_SUMBER.toFixed(2);
    const r1 = (state.resistansiAtas / 1000).toFixed(1);
    const r2 = (state.resistansiBawah / 1000).toFixed(1);
    const total = (state.resistansiTotal / 1000).toFixed(1);
    const vKeluar = state.teganganKeluar.toFixed(2);
    const mA = state.arusMiliAmp.toFixed(2);

    panel.setRumus("rumus", "total", `= ${r1} kΩ + ${r2} kΩ = ${total} kΩ`);
    panel.setRumus("rumus", "keluar", `= ${vSumber} V × ${r2} kΩ ÷ ${total} kΩ = ${vKeluar} V`);
    panel.setRumus("rumus", "arus", `= ${vSumber} V ÷ ${total} kΩ = ${mA} mA`);

    const kondisi = [
      `rendah ${state.kondisiTercapai.rendah ? "✓" : "…"}`,
      `seimbang ${state.kondisiTercapai.seimbang ? "✓" : "…"}`,
      `tinggi ${state.kondisiTercapai.tinggi ? "✓" : "…"}`,
    ].join(" · ");
    panel.setTeks("status", `Target tercapai: ${kondisi}`);
  },

  kriteriaSelesai: [
    { id: "rendah", label: "Temukan Vout maksimal 1,5 V", cek: (state) => state.kondisiTercapai.rendah },
    { id: "seimbang", label: "Atur R1 dan R2 sama untuk menghasilkan Vout 2,5 V", cek: (state) => state.kondisiTercapai.seimbang },
    { id: "tinggi", label: "Temukan Vout minimal 3,5 V", cek: (state) => state.kondisiTercapai.tinggi },
  ],
};
