/*
 * Model driver motor (Lab 8). Murni logika: tidak menyentuh DOM/Canvas.
 *
 * Tiga panel bertahap, satu state bersama:
 * - Panel 1: kenapa pin mikrokontroler tidak bisa langsung menggerakkan motor.
 * - Panel 2: H-bridge empat saklar — arah putar dari kombinasi saklar mana yang menyala.
 * - Panel 3: PWM — duty cycle mengatur tegangan rata-rata, jadi mengatur kecepatan.
 */

import { TEGANGAN_SUMBER } from "./rangkaian.js";

/**
 * Kenapa perlu driver (Panel 1). Angka nyata, bukan cuma "tidak bisa":
 * pin mikrokontroler dirancang untuk sinyal (logika), bukan daya. Arus
 * maksimum yang aman ditarik dari satu pin GPIO khas (Arduino/ESP32) jauh
 * lebih kecil daripada arus yang dibutuhkan motor DC kecil saat berputar
 * normal — apalagi saat start/stall, arusnya bisa berkali lipat lebih besar.
 */
export const ARUS_PIN_MAKS_MA = 20; // mA — batas aman arus keluar satu pin GPIO
export const ARUS_MOTOR_TIPIKAL_MA = 250; // mA — arus motor DC kecil saat berputar normal tanpa beban berat
export const ARUS_MOTOR_STALL_MA = 800; // mA — arus motor saat macet/stall (rotor tertahan) — jauh lebih besar dari arus normal

/**
 * Model motor DC sepotong sederhana (Panel 2 dan 3): pada keadaan tunak
 * (steady state) tanpa beban, tegangan yang diberikan ke motor sebagian
 * besar dilawan oleh ggl-balik (back-EMF) yang muncul karena motor berputar:
 *
 *   V = Ke·ω     (mengabaikan penurunan tegangan kecil di resistansi kumparan)
 *
 * dengan V tegangan motor (volt), ω kecepatan sudut (rad/s), dan Ke konstanta
 * ggl-balik motor (volt·detik/radian) — makin besar Ke, makin "berat" motor
 * berputar per volt yang diberikan. Dibalik untuk dapat kecepatan dari tegangan:
 *
 *   ω = V / Ke              lalu     RPM = ω × 60 / (2π)
 *
 * KE_MOTOR di bawah dipilih supaya pada tegangan penuh 5 V, motor berputar
 * sekitar 600 RPM — angka yang masuk akal untuk motor DC kecil bertenaga baterai.
 */
export const KE_MOTOR = 0.08; // volt·detik/radian

export function rpmDariTegangan(voltase) {
  const omega = voltase / KE_MOTOR; // rad/s, boleh negatif (arah mundur)
  return omega * (60 / (2 * Math.PI));
}

export function buatDriverMotor() {
  return {
    panelAktif: 1, // 1 | 2 | 3 — dipilih lewat tab

    // ---- Panel 2: H-bridge empat saklar ----
    // Motor punya dua terminal, A dan B. S1 menghubungkan A ke VCC, S2
    // menghubungkan A ke GND, S3 menghubungkan B ke VCC, S4 menghubungkan B ke GND.
    s1: false,
    s2: false,
    s3: false,
    s4: false,
    sudahMaju: false,
    sudahMundur: false,
    sudahShort: false,
    sudutMotor2: 0, // radian, akumulasi rotasi visual roda gigi motor

    // ---- Panel 3: PWM ----
    dutyCycle: 50, // persen, 0-100
    sudutMotor3: 0,

    /**
     * "maju" | "mundur" | "netral" | "short".
     * short = kedua saklar pada KAKI YANG SAMA menyala bersamaan (S1&S2, atau
     * S3&S4) — itu menghubungkan VCC langsung ke GND tanpa lewat motor sama
     * sekali, arus meledak tak terkendali. Inilah aturan emas H-bridge: jangan
     * pernah nyalakan dua saklar sekaki bersamaan.
     */
    get kondisiHBridge() {
      const legAShort = this.s1 && this.s2;
      const legBShort = this.s3 && this.s4;
      if (legAShort || legBShort) return "short";
      if (this.s1 && this.s4 && !this.s2 && !this.s3) return "maju";
      if (this.s2 && this.s3 && !this.s1 && !this.s4) return "mundur";
      return "netral"; // semua saklar mati (motor mengambang), atau S1+S3/S2+S4 (motor direm, tak ada beda tegangan)
    },

    /** Tegangan yang benar-benar sampai ke motor — positif = maju, negatif = mundur. */
    get teganganMotor2() {
      const k = this.kondisiHBridge;
      if (k === "maju") return TEGANGAN_SUMBER;
      if (k === "mundur") return -TEGANGAN_SUMBER;
      return 0;
    },

    get rpmMotor2() {
      return rpmDariTegangan(this.teganganMotor2);
    },

    setSaklar(nama, nilai) {
      if (!["s1", "s2", "s3", "s4"].includes(nama)) return;
      this[nama] = Boolean(nilai);
      const k = this.kondisiHBridge;
      if (k === "maju") this.sudahMaju = true;
      else if (k === "mundur") this.sudahMundur = true;
      else if (k === "short") this.sudahShort = true;
    },

    setPanelAktif(nomor) {
      nomor = Number(nomor);
      this.panelAktif = [1, 2, 3].includes(nomor) ? nomor : 1;
    },

    setDutyCycle(persen) {
      persen = Number(persen);
      if (!Number.isFinite(persen)) return;
      this.dutyCycle = Math.max(0, Math.min(100, persen));
    },

    /** Tegangan rata-rata PWM: rangkaian ON penuh selama duty%, OFF sisanya — rata-ratanya duty% × VCC. */
    get teganganRataDuty() {
      return (this.dutyCycle / 100) * TEGANGAN_SUMBER;
    },

    get rpmDuty() {
      return rpmDariTegangan(this.teganganRataDuty);
    },

    langkah(dt) {
      const omega2 = this.teganganMotor2 / KE_MOTOR;
      this.sudutMotor2 = (this.sudutMotor2 + omega2 * dt) % (2 * Math.PI);
      const omega3 = this.teganganRataDuty / KE_MOTOR;
      this.sudutMotor3 = (this.sudutMotor3 + omega3 * dt) % (2 * Math.PI);
    },
  };
}
