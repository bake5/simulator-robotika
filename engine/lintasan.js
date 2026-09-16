/*
 * Definisi lintasan 2D untuk robot line follower (Lab 10, 11, 15, 16) —
 * lintasan direpresentasikan sebagai polyline (deretan titik), dan reflektansi
 * di satu titik dihitung dari jarak tegak lurus terpendek ke polyline itu,
 * memakai kurva peralihan halus yang SAMA konsepnya dengan fraksiHitamDariPosisi
 * di engine/rangkaian.js (Lab 6/7) — bedanya di sana 1D (posisi di sepanjang
 * sumbu-x), di sini 2D (jarak ke sebuah kurva di bidang).
 */

import { REFLEKTANSI_PUTIH, REFLEKTANSI_HITAM } from "./rangkaian.js";

export const LEBAR_GARIS_LINTASAN = 24; // satuan posisi, sama dengan LEBAR_GARIS Lab 6/7
export const LEBAR_TRANSISI_LINTASAN = 8;

/** Reflektansi (0-100%) dari jarak tegak lurus terpendek ke garis tengah lintasan. */
export function reflektansiDariJarak(jarak) {
  const setengahLebar = LEBAR_GARIS_LINTASAN / 2;
  let fraksiHitam;
  if (jarak <= setengahLebar) fraksiHitam = 1;
  else if (jarak >= setengahLebar + LEBAR_TRANSISI_LINTASAN) fraksiHitam = 0;
  else fraksiHitam = 1 - (jarak - setengahLebar) / LEBAR_TRANSISI_LINTASAN;
  return REFLEKTANSI_PUTIH - (REFLEKTANSI_PUTIH - REFLEKTANSI_HITAM) * fraksiHitam;
}

/** Jarak titik (px,py) ke ruas garis (ax,ay)-(bx,by), plus t (0-1) proyeksi sepanjang ruas. */
function jarakKeRuas(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const panjangKuadrat = dx * dx + dy * dy;
  let t = panjangKuadrat === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / panjangKuadrat;
  t = Math.max(0, Math.min(1, t));
  const xProyeksi = ax + t * dx;
  const yProyeksi = ay + t * dy;
  return { jarak: Math.hypot(px - xProyeksi, py - yProyeksi), t };
}

/**
 * Jarak titik (x,y) ke lintasan (polyline, tertutup atau tidak), plus indeks
 * segmen terdekat dan t di dalam segmen itu — indeksSegmen+t dipakai sebagai
 * "posisi sepanjang lintasan" untuk mendeteksi satu putaran penuh (Lab 10).
 */
export function jarakKeLintasan(lintasan, x, y) {
  const { titik, tertutup } = lintasan;
  const jumlahSegmen = tertutup ? titik.length : titik.length - 1;
  let terbaik = { jarak: Infinity, indeksSegmen: 0, t: 0 };
  for (let i = 0; i < jumlahSegmen; i++) {
    const a = titik[i];
    const b = titik[(i + 1) % titik.length];
    const hasil = jarakKeRuas(x, y, a.x, a.y, b.x, b.y);
    if (hasil.jarak < terbaik.jarak) terbaik = { jarak: hasil.jarak, indeksSegmen: i, t: hasil.t };
  }
  return terbaik;
}

/** Posisi sepanjang lintasan sebagai satu angka real (indeksSegmen + t), untuk deteksi putaran penuh. */
export function posisiSepanjangLintasan(lintasan, x, y) {
  const { indeksSegmen, t } = jarakKeLintasan(lintasan, x, y);
  return indeksSegmen + t;
}

/** Lintasan lurus: satu ruas panjang mendatar, tidak tertutup — untuk eksplorasi bebas, tanpa target "satu putaran". */
export function buatLintasanLurus() {
  return {
    nama: "lurus",
    tertutup: false,
    titik: [
      { x: -220, y: 0 },
      { x: 220, y: 0 },
    ],
    mulai: { x: -200, y: 0, sudut: 0 },
  };
}

/**
 * Lintasan oval (bentuk stadion — dua ruas lurus disambung dua setengah
 * lingkaran) — lintasan tertutup, dipakai untuk kriteria "satu putaran penuh".
 */
export function buatLintasanOval() {
  const A = 150; // setengah panjang bagian lurus
  const B = 80; // radius setengah lingkaran di kedua ujung
  const JUMLAH_PER_LENGKUNG = 24;
  const titik = [];

  // ruas lurus atas: dari kiri ke kanan
  titik.push({ x: -A, y: B });
  titik.push({ x: A, y: B });
  // setengah lingkaran kanan: dari atas (90°) ke bawah (-90°), searah jarum jam lewat 0°
  for (let i = 1; i < JUMLAH_PER_LENGKUNG; i++) {
    const sudut = Math.PI / 2 - (Math.PI * i) / JUMLAH_PER_LENGKUNG;
    titik.push({ x: A + B * Math.cos(sudut), y: B * Math.sin(sudut) });
  }
  // ruas lurus bawah: dari kanan ke kiri
  titik.push({ x: A, y: -B });
  titik.push({ x: -A, y: -B });
  // setengah lingkaran kiri: dari bawah (-90°) ke atas (90°) lewat 180°
  for (let i = 1; i < JUMLAH_PER_LENGKUNG; i++) {
    const sudut = -Math.PI / 2 - (Math.PI * i) / JUMLAH_PER_LENGKUNG;
    titik.push({ x: -A + B * Math.cos(sudut), y: B * Math.sin(sudut) });
  }

  return {
    nama: "belokanHalus",
    tertutup: true,
    titik,
    mulai: { x: -A, y: B, sudut: 0 },
    panjangTotal: titik.length,
  };
}

/**
 * Lintasan tajam: persegi panjang dengan sudut dibulatkan radius KECIL —
 * dipakai Lab 11 untuk menguji kendali yang koreksinya lamban atau berlebihan
 * (overshoot besar di tikungan kalau Kd terlalu kecil, atau malah berosilasi
 * kalau Kp terlalu besar). Radiusnya sengaja jauh lebih kecil dari lintasan
 * "halus" (Lab 10/11) supaya sudutnya terasa tegas, TAPI tidak nol — sudut
 * benar-benar 90° tanpa radius sama sekali tidak bisa diikuti sensor manapun
 * (garis berbelok tepat di titik yang sama saat masih ada di bawah batang
 * sensor, tidak ada ruang untuk bereaksi bertahap), jadi bukan menguji
 * tuning, cuma membuat lab mustahil diselesaikan siapa pun.
 */
export function buatLintasanTajam() {
  const A = 150;
  const B = 80;
  const R = 35; // radius sudut — jauh lebih kecil dari B=80 milik lintasan halus
  const JUMLAH_PER_SUDUT = 10;
  const titik = [];

  function tambahSudut(pusatX, pusatY, sudutAwal) {
    for (let i = 1; i < JUMLAH_PER_SUDUT; i++) {
      const sudut = sudutAwal - (Math.PI / 2) * (i / JUMLAH_PER_SUDUT);
      titik.push({ x: pusatX + R * Math.cos(sudut), y: pusatY + R * Math.sin(sudut) });
    }
  }

  titik.push({ x: -A + R, y: B }, { x: A - R, y: B }); // tepi atas
  tambahSudut(A - R, B - R, Math.PI / 2); // sudut kanan-atas
  titik.push({ x: A, y: B - R }, { x: A, y: -B + R }); // tepi kanan
  tambahSudut(A - R, -B + R, 0); // sudut kanan-bawah
  titik.push({ x: A - R, y: -B }, { x: -A + R, y: -B }); // tepi bawah
  tambahSudut(-A + R, -B + R, -Math.PI / 2); // sudut kiri-bawah
  titik.push({ x: -A, y: -B + R }, { x: -A, y: B - R }); // tepi kiri
  tambahSudut(-A + R, B - R, Math.PI); // sudut kiri-atas

  return { nama: "tajam", tertutup: true, titik, mulai: { x: -A + R, y: B, sudut: 0 } };
}

/**
 * Lintasan zigzag: lingkaran yang jari-jarinya digoyang sinusoidal,
 * r(θ) = R0 + A·sin(k·θ) — otomatis tertutup rapi (θ menyapu penuh satu
 * putaran), berkelok-kelok terus-menerus sepanjang lintasan, beda karakter
 * dari lintasan tajam (belokan jarang tapi tegas) — bagus untuk melihat
 * kendali yang berosilasi terus-menerus kalau parameternya kurang pas.
 */
export function buatLintasanZigzag() {
  const R0 = 140;
  const AMPLITUDO = 32;
  const JUMLAH_GELOMBANG = 5;
  const JUMLAH_TITIK = 96;
  const titik = [];
  for (let i = 0; i < JUMLAH_TITIK; i++) {
    const sudut = (2 * Math.PI * i) / JUMLAH_TITIK;
    const r = R0 + AMPLITUDO * Math.sin(JUMLAH_GELOMBANG * sudut);
    titik.push({ x: r * Math.cos(sudut), y: r * Math.sin(sudut) });
  }
  // arah hadap awal = arah garis singgung di titik pertama, dihitung numerik
  // dari selisih ke titik berikutnya — supaya robot mulai lurus mengikuti
  // lintasan, bukan menyerong dari langkah pertama.
  const sudutAwal = Math.atan2(titik[1].y - titik[0].y, titik[1].x - titik[0].x);
  return {
    nama: "zigzag",
    tertutup: true,
    titik,
    mulai: { x: titik[0].x, y: titik[0].y, sudut: sudutAwal },
  };
}

export const LINTASAN = {
  lurus: buatLintasanLurus(),
  belokanHalus: buatLintasanOval(),
  tajam: buatLintasanTajam(),
  zigzag: buatLintasanZigzag(),
};
