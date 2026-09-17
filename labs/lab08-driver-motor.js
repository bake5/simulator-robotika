/*
 * Lab 8 — Driver Motor.
 * Tiga panel bertahap dengan satu state bersama (engine/motor.js):
 * Panel 1 kenapa perlu driver, Panel 2 H-bridge empat saklar (arah putar),
 * Panel 3 PWM (kecepatan lewat duty cycle). Level coding 1 saja — murni eksplorasi klik.
 */

import { buatDriverMotor } from "../engine/motor.js";
import { gambarDriverMotor, saklarDiTitik } from "../render/motorView.js";

export default {
  id: 8,
  judul: "Driver Motor",
  singkat: "Driver Motor",
  modul: 3,
  tujuan: "Memahami peran driver motor, pengaturan arah melalui H-bridge, dan pengaturan kecepatan melalui PWM.",

  panduan: [
    "Buka Panel 1, lalu bandingkan motor yang dihubungkan langsung ke pin mikrokontroler dengan motor yang dihubungkan melalui driver. Perhatikan arus pada kedua rangkaian. Perbedaan hasilnya menunjukkan alasan motor memerlukan jalur daya melalui driver.",
    "Buka Panel 2, lalu klik saklar S1 sampai S4 pada kanvas. Kombinasi S1 dan S4 menghasilkan arah maju, sedangkan S2 dan S3 menghasilkan arah mundur. Mengaktifkan dua saklar pada sisi yang sama, yaitu S1 dan S2 atau S3 dan S4, menimbulkan hubung singkat. Kondisi tersebut hanya boleh diamati di simulator.",
    "Buka Panel 3, lalu ubah duty cycle. Amati perubahan lebar pulsa, tegangan rata-rata yang ditunjukkan oleh garis hijau putus-putus, dan kecepatan motor. Duty cycle yang lebih besar menghasilkan tegangan rata-rata dan kecepatan motor yang lebih tinggi.",
    "Temukan arah maju, arah mundur, dan kondisi hubung singkat masing-masing minimal satu kali. Checklist akan tercentang setelah ketiga kondisi tersebut tercapai.",
  ],

  komponen: { driverMotor: true },

  kontrol: [
    {
      jenis: "tab",
      id: "panel",
      label: "Panel",
      pilihan: [
        { label: "1. Kebutuhan driver", nilai: 1 },
        { label: "2. H-bridge", nilai: 2 },
        { label: "3. PWM", nilai: 3 },
      ],
      terapkan: (state, nilai) => state.setPanelAktif(nilai),
    },
    {
      jenis: "slider",
      id: "duty",
      label: "Duty cycle (Panel 3)",
      min: 0,
      max: 100,
      langkah: 1,
      nilaiAwal: 50,
      satuan: "%",
      terapkan: (state, nilai) => state.setDutyCycle(nilai),
    },
    { jenis: "nilai", id: "vRataAngka", label: "V rata-rata", satuan: "V" },
    { jenis: "nilai", id: "rpmAngka", label: "Kecepatan", satuan: "RPM" },
    {
      jenis: "rumus",
      id: "rumusMotor",
      judul: "Dari duty cycle ke kecepatan motor",
      baris: [
        { id: "vRata", simbol: "V rata-rata = duty% × VCC" },
        { id: "omega", simbol: "ω = V ÷ Ke" },
        { id: "rpm", simbol: "RPM = ω × 60 ÷ (2π)" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1],

  buatState: () => buatDriverMotor(),

  langkah: (state, dt) => state.langkah(dt),

  /** Panel 2: klik salah satu saklar S1-S4 untuk membalik keadaannya. */
  pasangInteraksi(kanvas, state) {
    kanvas.addEventListener("pointerdown", (e) => {
      if (state.panelAktif !== 2) return;
      const rect = kanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nama = saklarDiTitik(rect.width, rect.height, x, y);
      if (nama) state.setSaklar(nama, !state[nama]);
    });
  },

  perbaruiPanel(panel, state) {
    // Slider duty cycle, kartu V rata-rata/Kecepatan, dan kartu rumus cuma relevan
    // di Panel 3 (PWM) — kalau selalu tampil, peserta di Panel 1/2 melihat kontrol
    // yang tidak terhubung dengan apa pun yang ada di kanvas, dan menggeser
    // slidernya kelihatan tidak berbuat apa-apa (padahal cuma belum di panel yang tepat).
    const panel3 = state.panelAktif === 3;
    panel.setTampil("duty", panel3);
    panel.setTampil("vRataAngka", panel3);
    panel.setTampil("rpmAngka", panel3);
    panel.setTampil("rumusMotor", panel3);

    panel.setAngka("vRataAngka", state.teganganRataDuty.toFixed(2));
    panel.setAngka("rpmAngka", Math.round(state.rpmDuty).toString());

    panel.setRumus("rumusMotor", "vRata", `= ${state.dutyCycle}% × 5 V = ${state.teganganRataDuty.toFixed(2)} V`);
    panel.setRumus("rumusMotor", "omega", `= ${state.teganganRataDuty.toFixed(2)} ÷ 0,08 = ${(state.teganganRataDuty / 0.08).toFixed(1)} rad/s`);
    panel.setRumus("rumusMotor", "rpm", `= ${Math.round(state.rpmDuty)} RPM`);

    const kondisi = state.kondisiHBridge;
    const progres = `maju ${state.sudahMaju ? "✓" : "…"} · mundur ${state.sudahMundur ? "✓" : "…"} · hubung singkat ${state.sudahShort ? "✓" : "…"}`;
    panel.setTeks(
      "status",
      state.panelAktif === 2 ? `Kondisi H-bridge ${kondisi} · ${progres}` : `Progres Panel 2 · ${progres}`,
    );
  },

  kriteriaSelesai: [
    { id: "maju", label: "Temukan kombinasi saklar untuk arah maju", cek: (state) => state.sudahMaju },
    { id: "mundur", label: "Temukan kombinasi saklar untuk arah mundur", cek: (state) => state.sudahMundur },
    { id: "short", label: "Amati kondisi hubung singkat di simulator", cek: (state) => state.sudahShort },
  ],
};
