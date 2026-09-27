/*
 * Rumus kendali robot line follower — dari yang paling sederhana (on-off,
 * Lab 10) sampai PID lengkap (Lab 11). Semua memakai kontrak yang sama:
 * kendali(sensor) menerima array 8 angka ADC, mengembalikan
 * [kecepatanKiri, kecepatanKanan]. Identik dengan kontrak Level 2/3 yang
 * ditulis peserta sendiri (lihat coding/api.md) — fungsi di sini juga dipakai
 * sebagai perilaku bawaan Level 1 dan acuan penilaian Level 2/3.
 */

import { hitungErrorReferensi } from "./rangkaian.js";

/**
 * Kendali on-off (bang-bang) — Lab 10. Hanya dua keadaan: belok kanan tajam
 * atau belok kiri tajam. Tidak ada keadaan "lurus" dan tidak ada tingkat
 * "belok sedikit" — error sekecil apa pun mendapat koreksi penuh, lalu
 * koreksi balik setelah melewati garis. Inilah zigzag yang dibahas Lab 10
 * dan alasan Lab 11 memerlukan kendali proporsional.
 *
 * Catatan sejarah: versi sebelumnya memakai daerah mati ±AMBANG_ONOFF dengan
 * keadaan lurus. Dengan itu robot yang mulai tepat di tengah garis tidak
 * pernah berzigzag, sehingga tidak selaras dengan materi LMS. Konstanta
 * AMBANG_ONOFF dipertahankan hanya untuk kompatibilitas impor.
 */
export const AMBANG_ONOFF = 0; // skala error sama seperti Lab 7, -100..100

export function kendaliOnOffReferensi(sensor, kecepatanDasar) {
  const error = hitungErrorReferensi(sensor);
  const KECEPATAN_BELOK = kecepatanDasar * 0.15; // roda bagian dalam tetap diputar pelan, bukan nol, supaya tidak diam total
  if (error >= 0) return [kecepatanDasar, KECEPATAN_BELOK]; // garis condong ke kanan (atau tepat di tengah) → putar ke kanan
  return [KECEPATAN_BELOK, kecepatanDasar]; // garis condong ke kiri → putar ke kiri
}

/**
 * Kendali proporsional / PD / PID — Lab 11.
 *
 *   error(t)  = hitungErrorReferensi(sensor)              — sama seperti Lab 7, -100..100
 *   P = Kp × error(t)
 *   I = Ki × Σ error(t)·dt                                 — akumulasi error dari waktu ke waktu
 *   D = Kd × (error(t) − error(t−1)) ÷ dt                   — laju perubahan error
 *   koreksi = P + I + D
 *   kecepatanKiri  = kecepatanDasar + koreksi
 *   kecepatanKanan = kecepatanDasar − koreksi
 *
 * (error > 0 berarti garis condong ke KANAN — lihat offsetSensor/posisiSensorDiPose
 * di engine/simulasiLintasan.js. Supaya robot berbelok ke kanan mengejarnya,
 * roda KIRI harus lebih cepat dari roda kanan — sama seperti arah pada
 * kendaliOnOffReferensi di atas, cuma di sini besarnya sebanding dengan error,
 * bukan cuma "kanan tajam / kiri tajam".)
 *
 * Kp saja (P) sudah menghaluskan zigzag Lab 10 karena koreksinya SEBANDING
 * dengan seberapa jauh melenceng, bukan cuma "kanan/kiri/lurus". Kd meredam
 * osilasi (overshoot) yang muncul kalau Kp terlalu besar. Ki mengoreksi bias
 * kecil yang menetap (jarang perlu di simulator ini, tapi disediakan supaya
 * peserta bisa mengalami sendiri efeknya — termasuk efek buruknya kalau
 * kebesaran, yaitu integral windup).
 *
 * objekPID: { kp, kd, ki, integral, errorSebelumnya } — disimpan di luar
 * (state Lab 11) supaya integral & error sebelumnya bertahan antar panggilan.
 */
export function kendaliPID(sensor, kecepatanDasar, objekPID, dt) {
  const error = hitungErrorReferensi(sensor);
  const p = objekPID.kp * error;
  objekPID.integral += error * dt;
  const i = objekPID.ki * objekPID.integral;
  const turunan = dt > 0 ? (error - objekPID.errorSebelumnya) / dt : 0;
  const d = objekPID.kd * turunan;
  objekPID.errorSebelumnya = error;

  const koreksi = p + i + d;
  return { kecepatan: [kecepatanDasar + koreksi, kecepatanDasar - koreksi], error, p, i, d };
}
