/*
 * Lab 3 — Resistor dan Pembagi Tegangan.
 * Slider resistor mengubah arus; kecerahan LED, angka arus/tegangan,
 * dan grafik tegangan real time memperlihatkan hukum Ohm bekerja.
 */

import { buatRangkaianResistor, TEGANGAN_SUMBER } from "../engine/rangkaian.js";

const LABEL_ZONA = { redup: "redup", normal: "normal", terang: "sangat terang" };

export default {
  id: 3,
  judul: "Resistor dan Pembagi Tegangan",
  singkat: "Resistor & Pembagi Tegangan",
  modul: 1,
  tujuan: "Memahami hubungan resistansi, arus, dan tegangan.",

  panduan: [
    "Geser slider resistor dan perhatikan: resistansi kecil menghasilkan arus besar sehingga LED terang, resistansi besar menghasilkan arus kecil sehingga LED redup. Ini adalah hukum Ohm.",
    "Perhatikan pembagian tegangan: tegangan baterai 5 V terbagi antara resistor dan LED. Tegangan LED relatif tetap di sekitar 2 V. Nilai yang berubah signifikan adalah arusnya.",
    "Grafik di bawah rangkaian merekam kedua tegangan tersebut secara real time. Geser slider secara perlahan dan amati pergerakan garis pada grafik.",
    "Geser slider untuk menemukan nilai resistor yang membuat LED redup, normal, dan sangat terang. Tahan slider pada tiap kondisi selama beberapa detik hingga status tercapai untuk ketiganya.",
    "Geser ke resistansi paling kecil. Arus akan melewati batas aman. Pada rangkaian sungguhan, kondisi ini dapat merusak LED. Oleh karena itu, LED selalu dipasangi resistor seri, umumnya bernilai 220-330 Ω.",
    "Lihat kartu Rumus. Hukum Ohm menghitung arus dari selisih tegangan sumber dan tegangan beban (LED), dibagi resistansi. Tegangan resistor kemudian didapat dari arus dikalikan resistansi. Baris terakhir menunjukkan bahwa tegangan resistor dan tegangan beban selalu berjumlah sama dengan tegangan sumber.",
  ],

  komponen: { rangkaianResistor: true },

  kontrol: [
    {
      jenis: "slider",
      id: "resistor",
      label: "Nilai resistor",
      min: 50,
      max: 2000,
      langkah: 10,
      nilaiAwal: 1000,
      satuan: "Ω",
      terapkan: (state, nilai) => state.setResistor(nilai),
    },
    { jenis: "nilai", id: "arus", label: "Arus", satuan: "mA" },
    { jenis: "nilai", id: "vResistor", label: "V resistor", satuan: "V" },
    { jenis: "nilai", id: "vLed", label: "V LED", satuan: "V" },
    {
      jenis: "rumus",
      id: "rumus",
      judul: "Rumus & perhitungan saat ini",
      baris: [
        { id: "ohm", simbol: "Hukum Ohm: I = (V_sumber − V_beban) ÷ R" },
        { id: "vr", simbol: "Tegangan resistor: V_R = I × R" },
        { id: "cek", simbol: "Cek pembagian tegangan: V_R + V_beban = V_sumber" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatRangkaianResistor(),

  langkah: (state, dt) => state.langkah(dt),

  perbaruiPanel(panel, state) {
    panel.setAngka("arus", state.arusMiliAmp.toFixed(1));
    panel.setAngka("vResistor", state.teganganResistor.toFixed(2));
    panel.setAngka("vLed", state.teganganLED.toFixed(2));

    const vSumber = TEGANGAN_SUMBER.toFixed(2);
    const vBeban = state.teganganLED.toFixed(2);
    const vR = state.teganganResistor.toFixed(2);
    const r = Math.round(state.resistansi);
    const mA = state.arusMiliAmp.toFixed(1);
    const jumlah = (state.teganganResistor + state.teganganLED).toFixed(2);

    panel.setRumus("rumus", "ohm", `= (${vSumber} V − ${vBeban} V) ÷ ${r} Ω = ${mA} mA`);
    panel.setRumus("rumus", "vr", `= ${mA} mA × ${r} Ω = ${vR} V`);
    panel.setRumus("rumus", "cek", `${vR} V + ${vBeban} V = ${jumlah} V ✓`);

    const daftarZona = ["redup", "normal", "terang"]
      .map((z) => `${LABEL_ZONA[z]} ${state.zonaTercapai[z] ? "✓" : "…"}`)
      .join(" · ");
    panel.setTeks("status", `LED sekarang: ${LABEL_ZONA[state.zona]}. Zona tercapai: ${daftarZona}`);
  },

  kriteriaSelesai: [
    { id: "redup", label: "Temukan nilai resistor yang membuat LED redup", cek: (state) => state.zonaTercapai.redup },
    { id: "normal", label: "Temukan nilai resistor yang membuat LED normal", cek: (state) => state.zonaTercapai.normal },
    { id: "terang", label: "Temukan nilai resistor yang membuat LED sangat terang", cek: (state) => state.zonaTercapai.terang },
  ],
};
