/*
 * "Kamera" robot di lintasan (Lab 15/16) — dibangun dari komponen yang sama
 * persis dengan array photodiode (engine/simulasiLintasan.js) dan pembagian
 * frame 8 region (engine/kamera.js): alih-alih delapan titik diskrit, di
 * sini disampel GRID piksel di depan robot dari medan reflektansi yang SAMA
 * (jarakKeLintasan/reflektansiDariJarak), lalu di-threshold dan dibagi 8
 * region — hasil akhirnya array 8 angka ADC yang bisa dipakai kendali(sensor)
 * TANPA perubahan sedikit pun, persis maksud "kamera sebagai virtual sensor
 * array" di CLAUDE.md.
 *
 * PENYEDERHANAAN PEDAGOGIS: untuk MENGHITUNG region ADC (bacaFrameKameraDiPose,
 * dipakai kendali(sensor)), bidang pandang dimodelkan sebagai persegi
 * panjang datar (ortografik), bukan trapesium perspektif kamera sungguhan —
 * cukup untuk menunjukkan konsepnya (grid piksel → threshold → region)
 * tanpa kerumitan proyeksi kamera nyata, dan supaya tiap kolom region
 * mewakili lebar fisik yang sama persis seperti array photodiode Lab 7.
 * Untuk TAMPILAN panel "pandangan kamera" saja dipakai bacaFrameKameraTampilan
 * yang bidang pandangnya berbentuk kerucut (lihat fungsi itu) — supaya
 * terlihat seperti kamera sungguhan tanpa mengubah kendali(sensor).
 */

import { FRAME_LEBAR, FRAME_TINGGI, frameBinerDari, hitungRegionDariBiner } from "./kamera.js";
import { jarakKeLintasan, reflektansiDariJarak } from "./lintasan.js";

export const KAMERA_JARAK_DEKAT = 16; // satuan posisi — tepi bidang pandang terdekat dari pusat robot
export const KAMERA_JARAK_JAUH = 42; // tepi bidang pandang terjauh (dipakai MENGHITUNG region ADC, lihat catatan penyederhanaan pedagogis di atas)
export const KAMERA_LEBAR_FOV = 150; // lebar bidang pandang (kiri-kanan), mirip rentang array photodiode (±70)

/*
 * Parameter kamera TAMPILAN SAJA (panel "pandangan kamera"), tidak
 * memengaruhi kendali(sensor) sedikit pun — lihat bacaFrameKameraTampilan.
 *
 * Perspektif jalan sungguhan BUKAN sekadar "baris atas = jarak jauh, baris
 * bawah = jarak dekat, diselang-seling rata" — kamera sungguhan dipasang di
 * suatu KETINGGIAN, menunduk ke depan, dan baris-baris gambarnya berjarak
 * SAMA RATA dalam SUDUT tunduk, bukan dalam jarak. Jarak menyusuri lintasan
 * lantai dari sudut tunduk itu adalah: jarak = tinggi ÷ tan(sudut) — inilah
 * kenapa jalan di foto terlihat SEMPIT untuk sebagian besar gambar lalu
 * MELEBAR TAJAM hanya di beberapa baris paling bawah, bukan melebar rata
 * dari atas ke bawah.
 */
const TAMPILAN_TINGGI_KAMERA = 40; // satuan posisi — tinggi kamera di atas bidang lintasan
const TAMPILAN_SUDUT_BAWAH = (45 * Math.PI) / 180; // sudut tunduk di baris PALING BAWAH (paling dekat)
const TAMPILAN_SUDUT_ATAS = (16 * Math.PI) / 180; // sudut tunduk di baris PALING ATAS (paling jauh, mendekati horizon)
const TAMPILAN_SUDUT_FOV_LATERAL = (80 * Math.PI) / 180; // total sudut pandang kiri-kanan

/**
 * Posisi dunia (x,y) piksel kamera ke-(kolom,baris) pada robot di pose (x,y,sudut).
 * baris=0 dipetakan ke tepi TERJAUH, baris terakhir ke tepi TERDEKAT — supaya
 * saat digambar (baris 0 di atas panel, baris terakhir di bawah) hasilnya
 * terlihat seperti kamera menghadap depan sungguhan: bagian jauh di atas,
 * bagian dekat robot di bawah, bukan terbalik.
 */
export function posisiPikselKamera(x, y, sudut, kolom, baris) {
  const depan = KAMERA_JARAK_JAUH - ((KAMERA_JARAK_JAUH - KAMERA_JARAK_DEKAT) * (baris + 0.5)) / FRAME_TINGGI;
  const lateral = KAMERA_LEBAR_FOV / 2 - (KAMERA_LEBAR_FOV * (kolom + 0.5)) / FRAME_LEBAR; // positif = kiri, konsisten dengan posisiSensorDiPose
  return {
    x: x + depan * Math.cos(sudut) - lateral * Math.sin(sudut),
    y: y + depan * Math.sin(sudut) + lateral * Math.cos(sudut),
  };
}

/** Frame grayscale (grid FRAME_TINGGI × FRAME_LEBAR) yang "dilihat" kamera robot pada pose (x,y,sudut) di atas lintasan. */
export function bacaFrameKameraDiPose(lintasan, x, y, sudut) {
  const grid = [];
  for (let b = 0; b < FRAME_TINGGI; b++) {
    const baris = [];
    for (let k = 0; k < FRAME_LEBAR; k++) {
      const p = posisiPikselKamera(x, y, sudut, k, b);
      const { jarak } = jarakKeLintasan(lintasan, p.x, p.y);
      const reflektansi = reflektansiDariJarak(jarak);
      baris.push(Math.round((reflektansi / 100) * 255));
    }
    grid.push(baris);
  }
  return grid;
}

/** Rantai lengkap pose robot → frame → threshold → 8 region ADC, siap dipakai kendali(sensor). */
export function bacaRegionKameraDiPose(lintasan, x, y, sudut, ambang) {
  const frame = bacaFrameKameraDiPose(lintasan, x, y, sudut);
  return hitungRegionDariBiner(frameBinerDari(frame, ambang));
}

/**
 * Versi TAMPILAN SAJA untuk panel "pandangan kamera" (render/kameraRobotView.js)
 * — TIDAK dipakai untuk menghitung region ADC, jadi tidak memengaruhi
 * kendali(sensor) sedikit pun. Bedanya dari bacaFrameKameraDiPose: dimodelkan
 * sebagai kamera sungguhan (tinggi + sudut tunduk, lihat parameter di atas),
 * bukan persegi panjang lebar tetap — jarak & lebar bidang pandang tiap
 * baris diturunkan dari sudut lewat trigonometri, bukan diselang-seling rata.
 */
export function bacaFrameKameraTampilan(lintasan, x, y, sudut) {
  const grid = [];
  for (let b = 0; b < FRAME_TINGGI; b++) {
    const baris = [];
    const sudutTunduk =
      TAMPILAN_SUDUT_ATAS + ((TAMPILAN_SUDUT_BAWAH - TAMPILAN_SUDUT_ATAS) * (b + 0.5)) / FRAME_TINGGI;
    const depan = TAMPILAN_TINGGI_KAMERA / Math.tan(sudutTunduk);
    const lebarPadaBaris = 2 * depan * Math.tan(TAMPILAN_SUDUT_FOV_LATERAL / 2);
    for (let k = 0; k < FRAME_LEBAR; k++) {
      const lateral = lebarPadaBaris / 2 - (lebarPadaBaris * (k + 0.5)) / FRAME_LEBAR;
      const p = {
        x: x + depan * Math.cos(sudut) - lateral * Math.sin(sudut),
        y: y + depan * Math.sin(sudut) + lateral * Math.cos(sudut),
      };
      const { jarak } = jarakKeLintasan(lintasan, p.x, p.y);
      const reflektansi = reflektansiDariJarak(jarak);
      baris.push(Math.round((reflektansi / 100) * 255));
    }
    grid.push(baris);
  }
  return grid;
}
