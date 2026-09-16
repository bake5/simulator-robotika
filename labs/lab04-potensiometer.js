/*
 * Lab 4 — Variabel Resistor (potensiometer).
 * Knob diputar langsung di kanvas (drag), bukan slider di panel — supaya terasa
 * seperti memutar potensiometer sungguhan dan sinyal analog terasa kontinu.
 */

import { buatPotensiometer, TEGANGAN_SUMBER, POT_RESISTANSI_TOTAL } from "../engine/rangkaian.js";
import { posisiPersenPotensiometer } from "../render/rangkaianView.js";

export default {
  id: 4,
  judul: "Variabel Resistor",
  singkat: "Variabel Resistor",
  modul: 1,
  tujuan: "Memahami sinyal analog kontinyu.",

  panduan: [
    "Klik knob di kanvas dan seret: searah jarum jam menaikkan tegangan, berlawanan arah menurunkannya.",
    "Sapu penuh dari posisi minimum (0%) sampai maksimum (100%). Perhatikan tegangan berubah bertahap, bukan meloncat antara dua nilai seperti saklar pada Lab 1. Perubahan bertahap ini disebut sinyal analog.",
    "Panel kanan menampilkan target persentase. Tahan knob di sekitar angka itu (tanda hijau pada trek) selama sekitar 1 detik sampai lab ditandai selesai.",
    "Sinyal analog seperti ini nanti dibaca mikrokontroler sebagai angka ADC 0–1023. Topik ini mulai dijelajahi di Lab 5.",
    "Lihat kartu Rumus. Potensiometer sebenarnya terdiri dari dua resistor yang jumlahnya tetap 10 kΩ, dan wiper hanya menggeser titik pembagian di antara keduanya. Prinsipnya sama dengan pembagi tegangan pada Lab 3, hanya sekarang resistansi yang diubah, tegangan sumbernya tetap.",
  ],

  komponen: { potensiometer: true },

  kontrol: [
    { jenis: "nilai", id: "tegangan", label: "Tegangan", satuan: "V" },
    { jenis: "nilai", id: "posisi", label: "Posisi", satuan: "%" },
    {
      jenis: "rumus",
      id: "rumus",
      judul: "Rumus & perhitungan saat ini",
      baris: [
        { id: "bawah", simbol: "R_bawah (ke wiper) = (posisi ÷ 100) × R_total" },
        { id: "keluar", simbol: "V_keluar = (R_bawah ÷ R_total) × V_sumber" },
        { id: "cek", simbol: "Cek: R_atas + R_bawah = R_total" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatPotensiometer(),

  langkah: (state, dt) => state.langkah(dt),

  /** Pasang drag-to-turn di kanvas — dipanggil sekali oleh aplikasiLab setelah kanvas siap. */
  pasangInteraksi(kanvas, state) {
    let menyeret = false;

    const perbarui = (e) => {
      state.setPosisi(posisiPersenPotensiometer(kanvas, e.clientX, e.clientY));
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
    panel.setAngka("tegangan", state.tegangan.toFixed(2));
    panel.setAngka("posisi", Math.round(state.posisi).toString());

    const rBawah = Math.round(state.resistansiBawah);
    const rAtas = Math.round(state.resistansiAtas);
    const posisi = Math.round(state.posisi);
    const vKeluar = state.tegangan.toFixed(2);
    const vSumber = TEGANGAN_SUMBER.toFixed(2);

    panel.setRumus("rumus", "bawah", `= (${posisi} ÷ 100) × ${POT_RESISTANSI_TOTAL} Ω = ${rBawah} Ω`);
    panel.setRumus("rumus", "keluar", `= (${rBawah} Ω ÷ ${POT_RESISTANSI_TOTAL} Ω) × ${vSumber} V = ${vKeluar} V`);
    panel.setRumus("rumus", "cek", `${rAtas} Ω + ${rBawah} Ω = ${rAtas + rBawah} Ω ✓`);

    const sapu = `min ${state.sudahMin ? "✓" : "…"} · maks ${state.sudahMax ? "✓" : "…"}`;
    const tahan = state.tahanTercapai
      ? `tahan di ${state.target}% ✓`
      : state.diTarget
        ? `menahan di ${state.target}%…`
        : `menuju ${state.target}%…`;
    panel.setTeks("status", `Sapu penuh: ${sapu} · ${tahan}`);
  },

  kriteriaSelesai: [
    { id: "min", label: "Putar knob sampai minimum", cek: (state) => state.sudahMin },
    { id: "max", label: "Putar knob sampai maksimum", cek: (state) => state.sudahMax },
    { id: "tahan", label: "Tahan knob di nilai target yang diminta", cek: (state) => state.tahanTercapai },
  ],
};
