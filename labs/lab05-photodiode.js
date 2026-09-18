/*
 * Lab 5: Photodiode.
 * Lab pembuka Modul 2. Lab ini menyatukan semua rumus dari Modul 1 (pembagi
 * tegangan dari Lab 3 & 4) dan menambahkan satu langkah baru, yaitu
 * kuantisasi ke ADC 0-1023.
 * Sumber cahaya diseret di kanvas; slider mengatur intensitasnya.
 */

import {
  buatPhotodiode,
  TEGANGAN_SUMBER,
  PD_JARAK_MIN,
  PD_R_MIN,
  PD_R_MAKS,
  PD_R_TETAP,
  ADC_MAKS,
} from "../engine/rangkaian.js";
import { posisiJarakDariPointer } from "../render/rangkaianView.js";

const LABEL_ZONA = { gelap: "gelap", sedang: "sedang", terang: "terang penuh" };

export default {
  id: 5,
  judul: "Photodiode",
  singkat: "Photodiode",
  modul: 2,
  tujuan: "Memahami hubungan intensitas cahaya dengan arus photodiode, tegangan keluaran, dan nilai ADC 0 sampai 1023.",

  panduan: [
    "Klik dan seret sumber cahaya di kanvas. Makin dekat sumber cahaya ke photodiode, makin terang cahaya yang diterimanya. Slider di panel kanan mengatur seberapa terang sumber cahaya itu sendiri.",
    "Photodiode pada rangkaian fisik menghasilkan arus yang sebanding dengan cahaya, bukan mengubah resistansinya sendiri. Resistansi yang berubah karena cahaya adalah ciri komponen lain, yaitu LDR atau photoresistor. Pada lab ini, photodiode disederhanakan agar berperilaku seperti LDR. Resistansinya, yang disingkat R_PD, berubah karena cahaya sehingga rumus pembagi tegangan dari Lab 3 dan Lab 4 dapat digunakan kembali. Pada lab sebelumnya, nilai resistor diatur langsung oleh peserta. Pada lab ini, nilai R_PD ditentukan oleh intensitas cahaya.",
    "R_PD kemudian digunakan dalam rangkaian pembagi tegangan dengan rumus seperti pada Lab 3 dan Lab 4. Lihat kartu rumus pertama. Nilai R_PD pada simulator dibuat sebanding dengan resistor tetap 10 kΩ agar kondisi gelap, sedang, dan terang mudah diamati. Pada LDR fisik, resistansi dalam kondisi gelap dapat jauh lebih tinggi.",
    "Tegangan hasil pembagi diukur oleh mikrokontroler melalui ADC atau Analog-to-Digital Converter, kemudian diubah menjadi angka bulat dari 0 sampai 1023. Lihat kartu rumus kedua. Nilai ADC inilah yang dibaca oleh program, bukan nilai tegangannya secara langsung.",
    "Amati nilai ADC pada kondisi gelap total, sedang, dan terang penuh. Kondisi gelap diperoleh dengan mengatur intensitas ke 0. Kondisi terang penuh diperoleh dengan mengatur intensitas ke nilai maksimum dan menempatkan sumber cahaya sedekat mungkin dengan photodiode. Pertahankan setiap kondisi sampai statusnya berubah menjadi tanda centang.",
  ],

  komponen: { photodiode: true },

  kontrol: [
    {
      jenis: "slider",
      id: "intensitas",
      label: "Intensitas sumber cahaya",
      min: 0,
      max: 100,
      langkah: 1,
      nilaiAwal: 100,
      satuan: "%",
      terapkan: (state, nilai) => state.setIntensitas(nilai),
    },
    { jenis: "nilai", id: "cahaya", label: "Cahaya di sensor", satuan: "%" },
    { jenis: "nilai", id: "tegangan", label: "Tegangan", satuan: "V" },
    { jenis: "nilai", id: "adc", label: "ADC", satuan: "" },
    {
      jenis: "rumus",
      id: "rumusCahaya",
      judul: "1. Model hubungan cahaya dan R_PD pada simulator",
      baris: [
        { id: "efektif", simbol: "Cahaya efektif = intensitas × (jarak_min ÷ jarak)²" },
        { id: "resistansi", simbol: "R_PD = R_maks − (R_maks − R_min) × (cahaya ÷ 100)" },
      ],
    },
    {
      jenis: "rumus",
      id: "rumusAdc",
      judul: "2. Perhitungan tegangan dan ADC dengan pembagi tegangan",
      baris: [
        { id: "arus", simbol: "I = V_sumber ÷ (R_PD + R_tetap)" },
        { id: "tegangan", simbol: "V_keluar = I × R_tetap" },
        { id: "adc", simbol: "ADC = bulatkan((V_keluar ÷ V_sumber) × 1023)" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatPhotodiode(),

  langkah: (state, dt) => state.langkah(dt),

  /** Seret sumber cahaya sepanjang kanvas. Dipanggil sekali setelah kanvas siap. */
  pasangInteraksi(kanvas, state) {
    let menyeret = false;

    const perbarui = (e) => {
      state.setJarak(posisiJarakDariPointer(kanvas, e.clientX));
    };

    kanvas.style.touchAction = "none";
    kanvas.style.cursor = "grab";

    kanvas.addEventListener("pointerdown", (e) => {
      menyeret = true;
      kanvas.style.cursor = "grabbing";
      kanvas.setPointerCapture(e.pointerId);
      perbarui(e);
    });
    kanvas.addEventListener("pointermove", (e) => {
      if (menyeret) perbarui(e);
    });
    const lepas = () => {
      menyeret = false;
      kanvas.style.cursor = "grab";
    };
    kanvas.addEventListener("pointerup", lepas);
    kanvas.addEventListener("pointercancel", lepas);
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("cahaya", state.cahayaEfektif.toFixed(0));
    panel.setAngka("tegangan", state.tegangan.toFixed(2));
    panel.setAngka("adc", state.adc.toString());

    const cahaya = state.cahayaEfektif;
    const rPd = Math.round(state.resistansi);
    panel.setRumus(
      "rumusCahaya",
      "efektif",
      `= ${state.intensitas.toFixed(0)}% × (${PD_JARAK_MIN} ÷ ${state.jarak.toFixed(0)})² = ${cahaya.toFixed(1)}%`,
    );
    panel.setRumus(
      "rumusCahaya",
      "resistansi",
      `= ${PD_R_MAKS.toLocaleString("id-ID")} Ω − (${PD_R_MAKS.toLocaleString("id-ID")} − ${PD_R_MIN.toLocaleString("id-ID")}) Ω × ${cahaya.toFixed(0)}% = ${rPd.toLocaleString("id-ID")} Ω`,
    );

    const vSumber = TEGANGAN_SUMBER.toFixed(2);
    const mA = state.arusMiliAmp.toFixed(3);
    const vKeluar = state.tegangan.toFixed(2);
    panel.setRumus("rumusAdc", "arus", `= ${vSumber} V ÷ (${rPd.toLocaleString("id-ID")} + ${PD_R_TETAP.toLocaleString("id-ID")}) Ω = ${mA} mA`);
    panel.setRumus("rumusAdc", "tegangan", `= ${mA} mA × ${PD_R_TETAP.toLocaleString("id-ID")} Ω = ${vKeluar} V`);
    panel.setRumus("rumusAdc", "adc", `= bulatkan((${vKeluar} ÷ ${vSumber}) × ${ADC_MAKS}) = ${state.adc}`);

    const daftarZona = ["gelap", "sedang", "terang"]
      .map((z) => `${LABEL_ZONA[z]} ${state.zonaTercapai[z] ? "✓" : "…"}`)
      .join(" · ");
    panel.setTeks("status", `Kondisi sekarang: ${LABEL_ZONA[state.zona]}. Tercapai: ${daftarZona}`);
  },

  kriteriaSelesai: [
    { id: "gelap", label: "Amati bacaan ADC di kondisi gelap", cek: (state) => state.zonaTercapai.gelap },
    { id: "sedang", label: "Amati bacaan ADC di kondisi sedang", cek: (state) => state.zonaTercapai.sedang },
    { id: "terang", label: "Amati bacaan ADC di kondisi terang penuh", cek: (state) => state.zonaTercapai.terang },
  ],
};
