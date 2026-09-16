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
  tujuan: "Memahami dari mana angka bacaan sensor berasal: cahaya → resistansi → arus → tegangan → ADC 0-1023.",

  panduan: [
    "Klik dan seret sumber cahaya di kanvas. Makin dekat sumber cahaya ke photodiode, makin terang cahaya yang diterimanya. Slider di panel kanan mengatur seberapa terang sumber cahaya itu sendiri.",
    "Catatan penting: photodiode sungguhan menghasilkan arus yang sebanding dengan cahaya, bukan mengubah resistansinya sendiri. Resistansi yang berubah karena cahaya adalah ciri komponen lain, yaitu LDR atau photoresistor. Di lab ini, photodiode disederhanakan agar berperilaku seperti LDR: resistansinya (disingkat R_PD) berubah karena cahaya, sehingga rumus pembagi tegangan yang sama persis seperti Lab 3 dan Lab 4 dapat dipakai. Pada lab sebelumnya nilai resistor diatur langsung oleh peserta, sedangkan di lab ini nilai R_PD diatur oleh intensitas cahaya.",
    "R_PD lalu masuk ke rangkaian pembagi tegangan dengan rumus yang sama persis seperti Lab 3 dan Lab 4. Lihat kartu rumus pertama. R_PD di sini sengaja dijaga tidak jauh berbeda ordenya dari resistor tetap (10 kΩ) supaya ketiga kondisi mudah dicapai. LDR sungguhan bisa memiliki resistansi gelap yang jauh lebih tinggi.",
    "Tegangan hasil pembagi itu diukur mikrokontroler lewat ADC (Analog-to-Digital Converter) yang mengubahnya menjadi angka bulat 0-1023. Lihat kartu rumus kedua. Angka inilah yang sebenarnya dibaca kode program, bukan voltase.",
    "Amati angka ADC pada tiga kondisi: gelap total dengan slider intensitas di 0, sedang, dan terang penuh dengan slider intensitas di maksimum serta sumber cahaya diseret sedekat mungkin ke photodiode. Tahan tiap kondisi sebentar sampai status tercapai berubah menjadi tanda centang.",
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
      judul: "1. Cahaya → resistansi photodiode (R_PD)",
      baris: [
        { id: "efektif", simbol: "Cahaya efektif = intensitas × (jarak_min ÷ jarak)²" },
        { id: "resistansi", simbol: "R_PD = R_maks − (R_maks − R_min) × (cahaya ÷ 100)" },
      ],
    },
    {
      jenis: "rumus",
      id: "rumusAdc",
      judul: "2. Resistansi → tegangan → ADC (pembagi tegangan, sama seperti Lab 3/4)",
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
