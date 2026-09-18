/*
 * Lab 4 — Potensiometer.
 * Kenop diputar langsung di kanvas (drag), bukan slider di panel — supaya terasa
 * seperti memutar potensiometer sungguhan dan sinyal analog terasa kontinu.
 */

import { buatPotensiometer, TEGANGAN_SUMBER, POT_RESISTANSI_TOTAL } from "../engine/rangkaian.js";
import { posisiPersenPotensiometer } from "../render/rangkaianView.js";

export default {
  id: 4,
  judul: "Potensiometer",
  singkat: "Potensiometer",
  modul: 1,
  tujuan: "Memahami perubahan sinyal analog melalui potensiometer sebagai pembagi tegangan yang dapat diatur.",

  panduan: [
    "Klik kenop pada diagram, lalu seret searah dan berlawanan arah jarum jam. Amati bahwa putaran searah jarum jam menaikkan posisi dan tegangan, sedangkan putaran berlawanan arah menurunkannya.",
    "Gerakkan kenop dari posisi minimum 0% sampai maksimum 100%. Amati tegangan berubah secara bertahap dari 0 V sampai 5 V, bukan hanya berpindah antara dua kondisi seperti pada Lab 1. Perubahan berkelanjutan ini merupakan sinyal analog.",
    "Arahkan kenop ke nilai target yang ditampilkan pada panel Kontrol, lalu pertahankan posisinya selama sekitar satu detik. Setelah posisi minimum, maksimum, dan target tercapai, checklist akan tercentang dan status lab berubah menjadi Selesai.",
    "Bandingkan keluaran potensiometer dengan keluaran saklar pada Lab 1. Jelaskan perbedaan antara sinyal analog yang memiliki rentang nilai dan sinyal digital yang hanya memiliki dua kondisi logika.",
    "Amati perhitungan pada panel Rumus. Potensiometer membagi resistansi total 10 kΩ menjadi dua bagian yang berubah mengikuti posisi kenop. Hubungkan hasilnya dengan prinsip pembagi tegangan pada Lab 3 dan pembacaan ADC pada lab berikutnya.",
  ],

  komponen: { potensiometer: true },

  kontrol: [
    { jenis: "nilai", id: "tegangan", label: "Tegangan", satuan: "V" },
    { jenis: "nilai", id: "posisi", label: "Posisi", satuan: "%" },
    {
      jenis: "rumus",
      id: "rumus",
      judul: "Rumus dan perhitungan saat ini",
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
    panel.setTeks("status", `Rentang gerak: ${sapu} · ${tahan}`);
  },

  kriteriaSelesai: [
    { id: "min", label: "Putar kenop sampai minimum", cek: (state) => state.sudahMin },
    { id: "max", label: "Putar kenop sampai maksimum", cek: (state) => state.sudahMax },
    { id: "tahan", label: "Tahan kenop pada nilai target yang diminta", cek: (state) => state.tahanTercapai },
  ],
};
