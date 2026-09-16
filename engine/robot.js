/*
 * Model gerak robot dua roda (kinematika differential drive) — dipakai Lab 9
 * dan jadi fondasi gerak untuk Lab 10, 11, 15, 16 (robot di lintasan).
 * Murni logika: tidak menyentuh DOM/Canvas.
 */

// satuan posisi yang sama dipakai di seluruh engine (lihat rangkaian.js) —
// bukan sentimeter sungguhan, cuma satuan relatif yang konsisten di simulator.
export const ROBOT_LEBAR_RODA = 40; // L — jarak antar roda kiri-kanan (wheelbase)
export const ROBOT_KECEPATAN_MAKS = 120; // satuan posisi/detik, dicapai saat slider di 100%
export const ROBOT_JEJARI = 22; // untuk menggambar badan robot

/**
 * Satu langkah kinematika differential drive — dipakai bersama oleh Lab 9
 * (arena kosong) dan Lab 10/11/15/16 (robot di lintasan), supaya persamaan
 * gerak robotnya SATU-SATUNYA, tidak dua salinan yang bisa mencong.
 *
 * kecepatanKiri, kecepatanKanan: -100..100 (persen kecepatan maksimum roda,
 * gaya sama seperti PWM di Lab 8 — 100% = ROBOT_KECEPATAN_MAKS).
 *
 * Kinematika differential drive standar:
 *   vKiri  = (kecepatanKiri  ÷ 100) × V_MAKS
 *   vKanan = (kecepatanKanan ÷ 100) × V_MAKS
 *   v = (vKanan + vKiri) ÷ 2                    — kecepatan linier pusat robot
 *   ω = (vKanan − vKiri) ÷ L                     — kecepatan sudut (rad/s), L = lebar roda
 *   dx/dt = v·cos(θ)   dy/dt = v·sin(θ)   dθ/dt = ω
 *
 * θ = 0 menghadap sumbu-x positif (kanan), bertambah berlawanan jarum jam —
 * konvensi matematika standar, BUKAN konvensi layar (y ke bawah); renderer
 * yang membalik sumbu-y saat menggambar, bukan model ini.
 */
export function langkahKinematika(pose, kecepatanKiri, kecepatanKanan, dt) {
  const vKiri = (kecepatanKiri / 100) * ROBOT_KECEPATAN_MAKS;
  const vKanan = (kecepatanKanan / 100) * ROBOT_KECEPATAN_MAKS;
  const v = (vKanan + vKiri) / 2;
  const omega = (vKanan - vKiri) / ROBOT_LEBAR_RODA;
  return {
    x: pose.x + v * Math.cos(pose.sudut) * dt,
    y: pose.y + v * Math.sin(pose.sudut) * dt,
    sudut: pose.sudut + omega * dt,
    v,
    omega,
  };
}

/**
 * Klasifikasi pola gerak dari sepasang kecepatan roda — dipakai Lab 9 untuk
 * mendeteksi keempat pola otomatis:
 * - "lurus": kedua roda sama persis (searah, sama cepat)
 * - "rotasiTempat": kedua roda berlawanan besarnya sama (poros tepat di tengah robot)
 * - "pivot": satu roda diam, satu berputar (poros di roda yang diam)
 * - "melengkung": kedua roda searah tapi beda kecepatan (manuver membelok)
 * - "diam": kedua roda diam
 */
export function polaGerakDari(kecepatanKiri, kecepatanKanan) {
  const EPSILON = 1;
  const kiri0 = Math.abs(kecepatanKiri) < EPSILON;
  const kanan0 = Math.abs(kecepatanKanan) < EPSILON;
  if (kiri0 && kanan0) return "diam";
  if (Math.abs(kecepatanKiri - kecepatanKanan) < EPSILON) return "lurus";
  if (Math.abs(kecepatanKiri + kecepatanKanan) < EPSILON) return "rotasiTempat";
  if (kiri0 || kanan0) return "pivot";
  return "melengkung";
}

const WAKTU_ZONA = 0.5; // detik bertahan di satu pola sebelum dihitung "pernah terjadi"
export const ARENA_SETENGAH_LEBAR = 260;
export const ARENA_SETENGAH_TINGGI = 170;
export const TARGET_UKURAN = 50; // sisi kotak target parkir
export const TARGET_POSISI = { x: 170, y: -90 }; // pusat kotak target, tetap supaya bisa diuji (Level 2)
const PANJANG_JEJAK_MAKS = 600;

export function buatGerakRobot() {
  return {
    x: 0,
    y: 0,
    sudut: 0,
    kecepatanKiri: 0,
    kecepatanKanan: 0,
    jejak: [{ x: 0, y: 0 }],
    polaTercapai: { lurus: false, rotasiTempat: false, pivot: false, melengkung: false },
    parkirTercapai: false,
    level2Lulus: false,
    _polaSebelumnya: null,
    _lamaDiPola: 0,
    _sisaWaktuJejak: 0,

    get pola() {
      return polaGerakDari(this.kecepatanKiri, this.kecepatanKanan);
    },

    /** Kecepatan linier pusat robot sekarang (satuan posisi/detik), dari roda saat ini — bukan hasil integrasi. */
    get v() {
      const vKiri = (this.kecepatanKiri / 100) * ROBOT_KECEPATAN_MAKS;
      const vKanan = (this.kecepatanKanan / 100) * ROBOT_KECEPATAN_MAKS;
      return (vKanan + vKiri) / 2;
    },

    /** Kecepatan sudut sekarang (rad/detik). */
    get omega() {
      const vKiri = (this.kecepatanKiri / 100) * ROBOT_KECEPATAN_MAKS;
      const vKanan = (this.kecepatanKanan / 100) * ROBOT_KECEPATAN_MAKS;
      return (vKanan - vKiri) / ROBOT_LEBAR_RODA;
    },

    /** Robot dianggap terparkir kalau pusatnya berada di dalam kotak target. */
    get diTarget() {
      return (
        Math.abs(this.x - TARGET_POSISI.x) <= TARGET_UKURAN / 2 &&
        Math.abs(this.y - TARGET_POSISI.y) <= TARGET_UKURAN / 2
      );
    },

    setKecepatan(kiri, kanan) {
      kiri = Number(kiri);
      kanan = Number(kanan);
      if (Number.isFinite(kiri)) this.kecepatanKiri = Math.max(-100, Math.min(100, kiri));
      if (Number.isFinite(kanan)) this.kecepatanKanan = Math.max(-100, Math.min(100, kanan));
    },

    resetJejak() {
      this.jejak = [{ x: this.x, y: this.y }];
    },

    resetPosisi() {
      this.x = 0;
      this.y = 0;
      this.sudut = 0;
      this.kecepatanKiri = 0;
      this.kecepatanKanan = 0;
      this.resetJejak();
    },

    langkah(dt) {
      const hasil = langkahKinematika(this, this.kecepatanKiri, this.kecepatanKanan, dt);
      this.x = Math.max(-ARENA_SETENGAH_LEBAR, Math.min(ARENA_SETENGAH_LEBAR, hasil.x));
      this.y = Math.max(-ARENA_SETENGAH_TINGGI, Math.min(ARENA_SETENGAH_TINGGI, hasil.y));
      this.sudut = hasil.sudut;

      const pola = this.pola;
      if (pola !== "diam") {
        if (pola === this._polaSebelumnya) {
          this._lamaDiPola += dt;
          if (this._lamaDiPola >= WAKTU_ZONA) this.polaTercapai[pola] = true;
        } else {
          this._polaSebelumnya = pola;
          this._lamaDiPola = 0;
        }
      }

      if (this.diTarget) this.parkirTercapai = true;

      this._sisaWaktuJejak -= dt;
      if (this._sisaWaktuJejak <= 0) {
        this._sisaWaktuJejak += 1 / 20; // 20 titik jejak per detik, cukup halus tanpa memberatkan
        this.jejak.push({ x: this.x, y: this.y });
        if (this.jejak.length > PANJANG_JEJAK_MAKS) this.jejak.shift();
      }
    },
  };
}

/**
 * Kendali referensi Level 2 Lab 9: kendali proporsional sederhana menuju
 * target (x,y). Dipakai juga sebagai acuan penilaian "uji" — bukan satu-
 * satunya cara benar, tapi cara yang wajar dan pasti sampai.
 *
 * errorSudut = arah ke target − arah hadap sekarang, dinormalisasi ke [-π, π]
 * kecepatanDasar = jarak ke target, dijepit supaya tidak ekstrem
 * belok = errorSudut ÷ π × 100                — makin besar errorSudut, makin tajam belok
 * kecepatanKiri  = dasar − belok
 * kecepatanKanan = dasar + belok
 */
export function gerakReferensi(x, y, sudut, targetX, targetY) {
  const dx = targetX - x;
  const dy = targetY - y;
  const jarak = Math.hypot(dx, dy);
  if (jarak < 10) return [0, 0];

  let errorSudut = Math.atan2(dy, dx) - sudut;
  errorSudut = Math.atan2(Math.sin(errorSudut), Math.cos(errorSudut));

  const dasar = Math.max(25, Math.min(80, jarak));
  const belok = (errorSudut / Math.PI) * 100;
  let kiri = dasar - belok;
  let kanan = dasar + belok;
  const puncak = Math.max(Math.abs(kiri), Math.abs(kanan), 100);
  kiri = (kiri / puncak) * 100;
  kanan = (kanan / puncak) * 100;
  return [kiri, kanan];
}
