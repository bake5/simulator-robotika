/*
 * State bersama "robot + array sensor + lintasan" dipakai Lab 10, 11, 15, 16.
 * Menggabungkan kinematika (engine/robot.js), lintasan (engine/lintasan.js),
 * dan model sensor array (engine/rangkaian.js) — robot bergerak di sepanjang
 * lintasan 2D, delapan sensor di badannya membaca reflektansi persis seperti
 * Lab 6/7, cuma sekarang posisinya ikut berpindah mengikuti pose robot.
 *
 * TIDAK menghitung kecepatan roda dari sensor (itu keputusan kendali,
 * beda tiap lab — bawaan on-off di Lab 10, PID di Lab 11, dst). Lab
 * memanggil terapkanKecepatan(kiri, kanan) sendiri sebelum memanggil
 * langkah(dt), lihat labs/lab10-kendali-onoff.js sebagai contoh.
 */

import { SENSOR_JUMLAH, offsetSensor, adcDariCahaya, hitungErrorReferensi } from "./rangkaian.js";
import { LINTASAN, reflektansiDariJarak, jarakKeLintasan, posisiSepanjangLintasan } from "./lintasan.js";
import { langkahKinematika } from "./robot.js";

export const SENSOR_JARAK_DEPAN = 26; // satuan posisi — jarak batang sensor dari pusat robot, ke arah depan
const AMBANG_PUTIH_HILANG = 600; // sama seperti Lab 7 — ADC di atas ini dianggap "putih murni"
const PANJANG_JEJAK_MAKS = 800;
// Jarak maksimum robot boleh menjauh dari lintasan sebelum dianggap hilang dan
// simulasi dihentikan otomatis — jaring pengaman terakhir kalau kendali yang
// buruk melontarkan robot jauh dari lintasan (termasuk lintasan tertutup).
const JARAK_HILANG_MAKS = 150;
// Lintasan terbuka (mis. "Lurus") punya ujung, tidak melingkar kembali seperti
// lintasan tertutup. Begitu garis hilang dari semua sensor dan tidak ditemukan
// lagi selama jeda ini, robot dianggap sudah melewati ujung lintasan dan
// dihentikan di situ — bukan terus melaju tanpa arah sampai jauh dari lintasan.
const JEDA_GARIS_HILANG_LINTASAN_TERBUKA = 0.4;

/**
 * Posisi dunia (x,y) tiap sensor ke-0..7 pada robot di pose (x,y,sudut).
 * offsetSensor(0) paling negatif (Lab 6/7: "indeks 0 = paling kiri") harus
 * jatuh di SISI KIRI robot secara fisik, bukan kanan — sisi kiri robot yang
 * menghadap sudut adalah arah +90° darinya (konvensi CCW), makanya tandanya
 * dibalik di sini: lateral positif = kiri = pakai offsetSensor negatif.
 */
export function posisiSensorDiPose(x, y, sudut, indeks) {
  const lateral = -offsetSensor(indeks);
  return {
    x: x + SENSOR_JARAK_DEPAN * Math.cos(sudut) - lateral * Math.sin(sudut),
    y: y + SENSOR_JARAK_DEPAN * Math.sin(sudut) + lateral * Math.cos(sudut),
  };
}

/** Bacaan ADC kedelapan sensor pada robot di pose (x,y,sudut), di atas lintasan tertentu. */
export function bacaSensorDiPose(lintasan, x, y, sudut) {
  const hasil = [];
  for (let i = 0; i < SENSOR_JUMLAH; i++) {
    const p = posisiSensorDiPose(x, y, sudut, i);
    const { jarak } = jarakKeLintasan(lintasan, p.x, p.y);
    hasil.push(adcDariCahaya(reflektansiDariJarak(jarak)));
  }
  return hasil;
}

export function buatSimulasiLintasan({ namaLintasanAwal = "lurus" } = {}) {
  const state = {
    namaLintasan: namaLintasanAwal,
    berjalan: false,
    kecepatanDasar: 40,
    x: 0,
    y: 0,
    sudut: 0,
    kecepatanKiri: 0,
    kecepatanKanan: 0,
    jejak: [],
    satuPutaranTercapai: false,
    jumlahKeluarJalur: 0,
    keluarDariLintasan: false,
    waktuTempuh: 0,
    _diJalurSebelumnya: true,
    _posisiLintasanSebelumnya: 0,
    _progresLintasan: 0,
    _sisaWaktuJejak: 0,
    _waktuTanpaGaris: 0,

    _lintasanKustom: null,

    get lintasanAktif() {
      return this._lintasanKustom ?? LINTASAN[this.namaLintasan];
    },

    get sensorADC() {
      return bacaSensorDiPose(this.lintasanAktif, this.x, this.y, this.sudut);
    },

    get error() {
      return hitungErrorReferensi(this.sensorADC);
    },

    /** Robot dianggap masih "di jalur" kalau setidaknya satu sensor melihat sesuatu yang cukup gelap. */
    get diJalur() {
      return this.sensorADC.some((adc) => adc <= AMBANG_PUTIH_HILANG);
    },

    setLintasan(nama) {
      if (!LINTASAN[nama]) return;
      this._lintasanKustom = null;
      this.namaLintasan = nama;
      this.resetPosisi();
    },

    /** Pakai lintasan hasil bangunan sendiri (Mini Project Capstone) alih-alih salah satu preset di LINTASAN. */
    setLintasanKustom(lintasan) {
      this._lintasanKustom = lintasan;
      this.namaLintasan = "kustom";
      this.resetPosisi();
    },

    setKecepatanDasar(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.kecepatanDasar = Math.max(0, Math.min(100, nilai));
    },

    mulai() {
      this.berjalan = true;
    },

    berhenti() {
      this.berjalan = false;
    },

    resetPosisi() {
      const l = this.lintasanAktif;
      this.x = l.mulai.x;
      this.y = l.mulai.y;
      this.sudut = l.mulai.sudut;
      this.kecepatanKiri = 0;
      this.kecepatanKanan = 0;
      this.jejak = [];
      this.satuPutaranTercapai = false;
      this.jumlahKeluarJalur = 0;
      this.keluarDariLintasan = false;
      this.waktuTempuh = 0;
      this._diJalurSebelumnya = true;
      this._posisiLintasanSebelumnya = posisiSepanjangLintasan(l, this.x, this.y);
      this._progresLintasan = 0;
      this._sisaWaktuJejak = 0;
      this._waktuTanpaGaris = 0;
    },

    /** Dijepit ke ±100 — kontrak kendali(sensor) sama seperti PWM, tidak boleh melebihi 100% terlepas dari seberapa besar koreksi kendali menghitungnya. */
    terapkanKecepatan(kiri, kanan) {
      kiri = Number.isFinite(kiri) ? kiri : 0;
      kanan = Number.isFinite(kanan) ? kanan : 0;
      this.kecepatanKiri = Math.max(-100, Math.min(100, kiri));
      this.kecepatanKanan = Math.max(-100, Math.min(100, kanan));
    },

    langkah(dt) {
      if (!this.berjalan) return;
      this.waktuTempuh += dt;

      const hasil = langkahKinematika(this, this.kecepatanKiri, this.kecepatanKanan, dt);
      this.x = hasil.x;
      this.y = hasil.y;
      this.sudut = hasil.sudut;

      const lintasan = this.lintasanAktif;

      // Jaring pengaman jarak — berlaku untuk semua lintasan, jaga-jaga kalau
      // kendali yang sangat buruk (mis. Kp/Kd terlalu besar di Lab 11/15)
      // melontarkan robot jauh dari lintasan.
      if (jarakKeLintasan(lintasan, this.x, this.y).jarak > JARAK_HILANG_MAKS) {
        this.berjalan = false;
        this.keluarDariLintasan = true;
        return;
      }

      const diJalurSekarang = this.diJalur;
      if (this._diJalurSebelumnya && !diJalurSekarang) this.jumlahKeluarJalur += 1;
      this._diJalurSebelumnya = diJalurSekarang;

      if (!lintasan.tertutup) {
        if (diJalurSekarang) {
          this._waktuTanpaGaris = 0;
        } else {
          this._waktuTanpaGaris += dt;
          if (this._waktuTanpaGaris >= JEDA_GARIS_HILANG_LINTASAN_TERBUKA) {
            this.berjalan = false;
            this.keluarDariLintasan = true;
            return;
          }
        }
      }

      this._sisaWaktuJejak -= dt;
      if (this._sisaWaktuJejak <= 0) {
        this._sisaWaktuJejak += 1 / 20;
        this.jejak.push({ x: this.x, y: this.y, diJalur: diJalurSekarang });
        if (this.jejak.length > PANJANG_JEJAK_MAKS) this.jejak.shift();
      }

      if (lintasan.tertutup) {
        const posisiBaru = posisiSepanjangLintasan(lintasan, this.x, this.y);
        const total = lintasan.titik.length;
        let delta = posisiBaru - this._posisiLintasanSebelumnya;
        const setengah = total / 2;
        if (delta > setengah) delta -= total; // lompat mundur besar dekat sambungan → sebenarnya maju melewati sambungan
        else if (delta < -setengah) delta += total; // lompat maju besar dekat sambungan → sebenarnya mundur melewati sambungan
        this._progresLintasan += delta;
        this._posisiLintasanSebelumnya = posisiBaru;
        if (this._progresLintasan >= total) this.satuPutaranTercapai = true;
      }
    },
  };

  state.resetPosisi();
  return state;
}
