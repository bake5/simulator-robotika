/*
 * Model kamera sebagai grid piksel grayscale (Lab 12-15) — jembatan Modul 2
 * (array photodiode) ke Modul 3 (kamera). Frame sintetis kecil (bukan foto
 * sungguhan, konsisten dengan gaya flat simulator ini) menggambarkan
 * pandangan dari atas garis di lantai, disusun dari piksel bernilai 0-255
 * (0 = hitam pekat, 255 = putih penuh) — persis definisi grayscale 8-bit
 * yang dipakai kamera sungguhan.
 */

export const FRAME_LEBAR = 32; // jumlah kolom piksel
export const FRAME_TINGGI = 20; // jumlah baris piksel
export const LEBAR_GARIS_PIKSEL = 6; // lebar garis dalam satuan kolom piksel
export const TRANSISI_PIKSEL = 2.5; // lebar zona peralihan halus tepi garis, satuan kolom piksel

/**
 * Tiga kondisi pencahayaan (Lab 13) — mengubah nilai piksel paling gelap dan
 * paling terang yang bisa dicapai frame. Kondisi redup dan silau sengaja
 * dibuat KONTRASNYA MENYEMPIT (gelap dan terang saling mendekat), meniru
 * masalah nyata: cahaya kurang membuat semuanya keabu-abuan gelap, cahaya
 * berlebih (silau/overexposed) membuat semuanya keabu-abuan terang — di
 * kedua kasus, garis dan lantai jadi lebih sulit dibedakan lewat satu ambang.
 */
export const KONDISI_PENCAHAYAAN = {
  normal: { gelap: 25, terang: 230, label: "Normal" },
  redup: { gelap: 65, terang: 150, label: "Redup" },
  silau: { gelap: 120, terang: 250, label: "Silau" },
};

/**
 * Nilai grayscale satu piksel (kolom, baris) — piksel di dalam LEBAR_GARIS_PIKSEL
 * dari posisiGaris (satuan kolom) bernilai gelap, di luar TRANSISI_PIKSEL lagi
 * bernilai terang, di antaranya diinterpolasi halus. Pola yang sama dengan
 * fraksiHitamDariPosisi di engine/rangkaian.js, cuma sekarang 2D (per kolom
 * DAN baris — baris dipakai untuk menggeser posisi garis, meniru tikungan
 * terlihat dari kamera, dipakai Lab 14/15).
 */
export function nilaiPiksel(kolom, baris, posisiGarisPerBaris, kondisi = "normal") {
  const { gelap, terang } = KONDISI_PENCAHAYAAN[kondisi] ?? KONDISI_PENCAHAYAAN.normal;
  const posisiGaris = typeof posisiGarisPerBaris === "function" ? posisiGarisPerBaris(baris) : posisiGarisPerBaris;
  const jarak = Math.abs(kolom + 0.5 - posisiGaris);
  const setengah = LEBAR_GARIS_PIKSEL / 2;
  let fraksiHitam;
  if (jarak <= setengah) fraksiHitam = 1;
  else if (jarak >= setengah + TRANSISI_PIKSEL) fraksiHitam = 0;
  else fraksiHitam = 1 - (jarak - setengah) / TRANSISI_PIKSEL;
  return Math.round(terang - (terang - gelap) * fraksiHitam);
}

/** Grid lengkap FRAME_TINGGI × FRAME_LEBAR nilai piksel 0-255. */
export function buatFrame(posisiGarisPerBaris = FRAME_LEBAR / 2, kondisi = "normal") {
  const grid = [];
  for (let b = 0; b < FRAME_TINGGI; b++) {
    const baris = [];
    for (let k = 0; k < FRAME_LEBAR; k++) baris.push(nilaiPiksel(k, b, posisiGarisPerBaris, kondisi));
    grid.push(baris);
  }
  return grid;
}

/**
 * Thresholding (Lab 13): ubah satu nilai piksel grayscale jadi biner.
 * Ambang lazimnya di-set supaya piksel LEBIH GELAP dari ambang → 1 (garis),
 * lebih terang → 0 (lantai) — makanya tandanya "<", bukan ">".
 */
export function binerDariPiksel(nilaiPiksel, ambang) {
  return nilaiPiksel < ambang ? 1 : 0;
}

/** Frame biner lengkap — dipakai untuk menggambar hasil thresholding di kanvas Lab 13. */
export function frameBinerDari(frame, ambang) {
  return frame.map((baris) => baris.map((v) => binerDariPiksel(v, ambang)));
}

/**
 * Membagi lebar frame jadi 8 kolom region (Lab 14) — momen kunci penghubung
 * Modul 2 dan 3: tiap region dihitung proporsi piksel gelapnya (0-1), lalu
 * dikonversi ke skala ADC yang SAMA PERSIS dengan array photodiode Lab 7,
 * supaya kode kendali(sensor) yang sama bisa dipakai untuk kedua mode sensor
 * tanpa perubahan sedikit pun (persis yang dibutuhkan Lab 15/16).
 *
 *   lebarRegion = FRAME_LEBAR ÷ 8
 *   proporsiGelap[r] = rata-rata biner(piksel) semua piksel di region r
 *   ADC[r] = (1 − proporsiGelap[r]) × 1023      — makin gelap, makin kecil ADC,
 *                                                   sama arah dengan photodiode
 */
export const JUMLAH_REGION = 8;

/**
 * hitungRegion(frameBiner) — kontrak Level 2/3 Lab 14. frameBiner: grid 2D
 * angka 0/1 SUDAH di-threshold (bukan grayscale mentah, thresholding-nya
 * sudah dikuasai di Lab 13, di sini fokus ke konsep BARU yaitu membagi jadi
 * 8 region). Dipakai juga sebagai acuan penilaian Level 2/3.
 *
 *   lebarRegion = lebar frame ÷ 8
 *   proporsiGelap[r] = rata-rata frameBiner semua piksel di region r (0-1)
 *   ADC[r] = (1 − proporsiGelap[r]) × 1023      — makin gelap, makin kecil,
 *                                                   arah yang sama dengan photodiode Lab 7
 */
export function hitungRegionDariBiner(frameBiner) {
  const lebar = frameBiner[0]?.length ?? 0;
  const lebarRegion = lebar / JUMLAH_REGION;
  const hasil = [];
  for (let r = 0; r < JUMLAH_REGION; r++) {
    const kolomAwal = Math.floor(r * lebarRegion);
    const kolomAkhir = Math.floor((r + 1) * lebarRegion);
    let totalHitam = 0;
    let jumlahPiksel = 0;
    for (const baris of frameBiner) {
      for (let k = kolomAwal; k < kolomAkhir; k++) {
        totalHitam += baris[k];
        jumlahPiksel += 1;
      }
    }
    const proporsiGelap = jumlahPiksel > 0 ? totalHitam / jumlahPiksel : 0;
    hasil.push(Math.round((1 - proporsiGelap) * 1023));
  }
  return hasil;
}

/** Rantai lengkap grayscale + ambang → 8 nilai region, dipakai tampilan Level 1. */
export function hitungRegionReferensi(frame, ambang) {
  return hitungRegionDariBiner(frameBinerDari(frame, ambang));
}
