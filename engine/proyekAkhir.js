/*
 * Mini Project Capstone (Modul 5) — beda dari 16 lab lain, di sini TIDAK ADA
 * lintasan baku. Peserta menyusun lintasannya sendiri dari brick (lurus,
 * tajam kiri/kanan, halus kiri/kanan, lihat engine/lintasan.js), memilih
 * mode sensor (photodiode atau kamera, sama seperti Lab 16), mengatur
 * kendali PID/kecepatan, lalu menjalankan robot di lintasan rancangannya
 * sendiri — lewat kendali PID bawaan (Level 1) atau kode kendali(sensor)
 * sendiri (Level 2/3, kontrak sama persis dengan lab-lab lain).
 *
 * Menggabungkan komponen yang sama dengan Lab 16 (buatSimulasiLintasan,
 * sensor photodiode & kamera, kendali PID) tapi TANPA sesi terukur/ekspor
 * CSV — itu urusan Lab 16, di sini murni ruang berkarya bebas.
 */

import { buatSimulasiLintasan, bacaSensorDiPose } from "./simulasiLintasan.js";
import { bacaRegionKameraDiPose } from "./kameraRobot.js";
import { bangunLintasanDariBrick } from "./lintasan.js";

export function buatProyekAkhir() {
  const dasar = buatSimulasiLintasan({ namaLintasanAwal: "lurus" });
  const resetDasar = dasar.resetPosisi.bind(dasar);

  Object.defineProperty(dasar, "sensorADC", {
    configurable: true,
    get() {
      return this.mode === "kamera"
        ? bacaRegionKameraDiPose(this.lintasanAktif, this.x, this.y, this.sudut, this.ambang)
        : bacaSensorDiPose(this.lintasanAktif, this.x, this.y, this.sudut);
    },
  });

  const state = Object.assign(dasar, {
    bricks: [],
    mode: "photodiode", // "photodiode" | "kamera"
    ambang: 128,
    kecepatanDasar: 35,
    kp: 0.6,
    kd: 0.15,
    ki: 0,
    integral: 0,
    errorSebelumnya: 0,
    riwayatError: [],

    _sisaWaktuKendali: 0,
    _kodeAktif: false,
    _bahasaAktif: "js",
    _runner: null,
    _sedangMemanggil: false,
    _kecepatanKodeTerakhir: null,
    _galatKode: null,

    /** Tambah satu brick di ujung lintasan yang sedang disusun, lalu bangun ulang & reset posisi robot ke titik awal lintasan baru. */
    tambahBrick(jenisBrick) {
      this.bricks = [...this.bricks, jenisBrick];
      this._bangunUlangLintasan();
    },

    hapusBrickTerakhir() {
      if (!this.bricks.length) return;
      this.bricks = this.bricks.slice(0, -1);
      this._bangunUlangLintasan();
    },

    resetTrack() {
      this.bricks = [];
      this._bangunUlangLintasan();
    },

    _bangunUlangLintasan() {
      this.setLintasanKustom(bangunLintasanDariBrick(this.bricks));
    },

    setMode(m) {
      if (m !== "photodiode" && m !== "kamera") return;
      this.mode = m;
      this.resetPosisi();
    },
    setAmbang(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.ambang = Math.max(0, Math.min(255, v));
    },
    setKp(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.kp = v;
    },
    setKd(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.kd = v;
    },
    setKi(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.ki = v;
    },
    setKecepatanDasar(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.kecepatanDasar = Math.max(0, Math.min(100, v));
    },

    resetPosisi() {
      resetDasar();
      this.integral = 0;
      this.errorSebelumnya = 0;
      this.riwayatError = [];
    },

    /** Dipanggil tiap langkah fisika setelah state.langkah(dt) — merekam grafik error, tidak terikat konsep "sesi" seperti Lab 16. */
    catatError(dt) {
      this.riwayatError.push(this.error);
      if (this.riwayatError.length > 200) this.riwayatError.shift();
    },
  });

  // Mulai dari lintasan kosong (belum ada brick), bukan preset "lurus" yang
  // dipakai buatSimulasiLintasan cuma sebagai placeholder konstruksi awal.
  state._lintasanKustom = bangunLintasanDariBrick(state.bricks);
  state.resetPosisi();
  return state;
}
