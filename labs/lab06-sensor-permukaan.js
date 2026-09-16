/*
 * Lab 6 — Satu Photodiode di Atas Permukaan.
 * Lab kedua Modul 2: photodiode dan rangkaian pembagi tegangannya sama persis
 * dengan Lab 5. Yang baru adalah sumber cahayanya sekarang pantulan dari
 * permukaan bergaris yang diseret, bukan lampu yang didekat-jauhkan.
 */

import {
  buatSensorPermukaan,
  REFLEKTANSI_PUTIH,
  REFLEKTANSI_HITAM,
  TEGANGAN_SUMBER,
  PD_R_TETAP,
  ADC_MAKS,
} from "../engine/rangkaian.js";
import { deltaPosisiDariPiksel } from "../render/rangkaianView.js";

export default {
  id: 6,
  judul: "Satu Photodiode di Atas Permukaan",
  singkat: "Photodiode di Permukaan",
  modul: 2,
  tujuan: "Memahami pantulan cahaya pada permukaan gelap dibandingkan permukaan terang.",

  panduan: [
    "Klik permukaan pada kanvas, lalu seret ke kiri atau ke kanan. Sensor tetap diam di tempat, sedangkan permukaan bergaris bergerak di bawahnya.",
    "Sensor ini sama seperti pada Lab 5, yaitu pemancar cahaya dan photodiode penerima, tetapi sekarang menghadap ke bawah sehingga cahaya memantul dari permukaan, bukan datang langsung dari lampu. Permukaan putih memantulkan hampir semua cahaya, sedangkan permukaan hitam menyerapnya. Prinsipnya sama dengan konsep 'resistor yang diatur' pada Lab 3 sampai Lab 5, hanya saja sekarang warna permukaan yang mengatur nilai resistansi.",
    "Perhatikan lingkaran putus-putus oranye di tengah sensor. Lingkaran itu menunjukkan area pandang (footprint) photodiode, bukan satu titik pengukuran. Saat tepi garis masuk sebagian ke area itu, bacaan ADC berubah ke nilai antara, tidak langsung melompat. Seret permukaan melewati tepi garis dan amati perubahan nilai ini pada grafik.",
    "Lihat kartu rumus pertama untuk formula transisi tersebut, dan kartu rumus kedua untuk formula pembagi tegangan menuju ADC. Kedua formula ini sama dengan formula pada Lab 5.",
    "Geser permukaan sampai sensor berada tepat di atas warna hitam, lalu geser lagi sampai sensor berada tepat di atas warna putih. Tahan posisi tersebut sebentar sampai kedua kondisi tercapai.",
  ],

  komponen: { sensorPermukaan: true },

  kontrol: [
    { jenis: "nilai", id: "reflektansi", label: "Reflektansi", satuan: "%" },
    { jenis: "nilai", id: "tegangan", label: "Tegangan", satuan: "V" },
    { jenis: "nilai", id: "adc", label: "ADC", satuan: "" },
    {
      jenis: "rumus",
      id: "rumusReflektansi",
      judul: "1. Posisi permukaan → reflektansi (pola sama seperti R_PD di Lab 5)",
      baris: [
        { id: "fraksi", simbol: "fraksiHitam: 0 = di luar garis, 1 = di dalam garis, dihaluskan di tepi" },
        { id: "reflektansi", simbol: "Reflektansi = putih − (putih − hitam) × fraksiHitam" },
      ],
    },
    {
      jenis: "rumus",
      id: "rumusAdc",
      judul: "2. Reflektansi → arus, tegangan, ADC (sama persis dengan Lab 5)",
      baris: [
        { id: "arus", simbol: "I = V_sumber ÷ (R_PD + R_tetap)" },
        { id: "tegangan", simbol: "V_keluar = I × R_tetap" },
        { id: "adc", simbol: "ADC = bulatkan((V_keluar ÷ V_sumber) × 1023)" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatSensorPermukaan(),

  langkah: (state, dt) => state.langkah(dt),

  /** Seret permukaan relatif terhadap kursor — dipanggil sekali setelah kanvas siap. */
  pasangInteraksi(kanvas, state) {
    let menyeret = false;
    let posisiAwal = 0;
    let xAwal = 0;

    kanvas.style.touchAction = "none";
    kanvas.style.cursor = "grab";

    kanvas.addEventListener("pointerdown", (e) => {
      menyeret = true;
      posisiAwal = state.posisi;
      xAwal = e.clientX;
      kanvas.style.cursor = "grabbing";
      kanvas.setPointerCapture(e.pointerId);
    });
    kanvas.addEventListener("pointermove", (e) => {
      if (!menyeret) return;
      state.setPosisi(posisiAwal + deltaPosisiDariPiksel(e.clientX - xAwal));
    });
    const lepas = () => {
      menyeret = false;
      kanvas.style.cursor = "grab";
    };
    kanvas.addEventListener("pointerup", lepas);
    kanvas.addEventListener("pointercancel", lepas);
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("reflektansi", state.reflektansi.toFixed(0));
    panel.setAngka("tegangan", state.tegangan.toFixed(2));
    panel.setAngka("adc", state.adc.toString());

    const fraksi = state.fraksiHitam;
    const kondisiFraksi =
      fraksi <= 0 ? "sepenuhnya putih" : fraksi >= 1 ? "sepenuhnya hitam" : "transisi tepi garis";
    panel.setRumus("rumusReflektansi", "fraksi", `= ${fraksi.toFixed(2)} (${kondisiFraksi})`);
    panel.setRumus(
      "rumusReflektansi",
      "reflektansi",
      `= ${REFLEKTANSI_PUTIH}% − (${REFLEKTANSI_PUTIH} − ${REFLEKTANSI_HITAM})% × ${fraksi.toFixed(2)} = ${state.reflektansi.toFixed(1)}%`,
    );

    const rPd = Math.round(state.resistansi);
    const vSumber = TEGANGAN_SUMBER.toFixed(2);
    const mA = (state.arus * 1000).toFixed(3);
    const vKeluar = state.tegangan.toFixed(2);
    panel.setRumus("rumusAdc", "arus", `= ${vSumber} V ÷ (${rPd.toLocaleString("id-ID")} + ${PD_R_TETAP.toLocaleString("id-ID")}) Ω = ${mA} mA`);
    panel.setRumus("rumusAdc", "tegangan", `= ${mA} mA × ${PD_R_TETAP.toLocaleString("id-ID")} Ω = ${vKeluar} V`);
    panel.setRumus("rumusAdc", "adc", `= bulatkan((${vKeluar} ÷ ${vSumber}) × ${ADC_MAKS}) = ${state.adc}`);

    const label = { hitam: "di atas hitam", putih: "di atas putih", transisi: "di tepi garis (transisi)" };
    panel.setTeks(
      "status",
      `Kondisi sekarang: ${label[state.kondisi]}. Tercapai: hitam ${state.tercapai.hitam ? "✓" : "…"} · putih ${state.tercapai.putih ? "✓" : "…"}`,
    );
  },

  kriteriaSelesai: [
    { id: "hitam", label: "Geser sensor ke atas warna hitam", cek: (state) => state.tercapai.hitam },
    { id: "putih", label: "Geser sensor ke atas warna putih", cek: (state) => state.tercapai.putih },
  ],
};
