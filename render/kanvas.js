/*
 * Util Canvas 2D: skala HiDPI, pembacaan token warna, dan loop render
 * dengan fixed timestep fisika terpisah dari frame rate render.
 */

const singgahanWarna = new Map();

/** Baca warna dari token CSS, contoh: warnaToken("--oranye"). Jangan hardcode warna. */
export function warnaToken(nama) {
  if (!singgahanWarna.has(nama)) {
    const nilai = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
    singgahanWarna.set(nama, nilai);
  }
  return singgahanWarna.get(nama);
}

/**
 * Sesuaikan ukuran kanvas dengan lebar wadahnya dan devicePixelRatio.
 * Mengembalikan { ctx, ukuran } — ukuran() memberi lebar/tinggi dalam piksel CSS.
 */
export function siapkanKanvas(kanvas, rasio = 0.6) {
  const ctx = kanvas.getContext("2d");

  function sesuaikan() {
    const lebar = kanvas.parentElement.clientWidth - 24; // dikurangi padding kartu
    if (lebar <= 0) return;
    const tinggi = Math.round(lebar * rasio);
    const dpr = window.devicePixelRatio || 1;
    kanvas.style.height = `${tinggi}px`;
    kanvas.width = Math.round(lebar * dpr);
    kanvas.height = Math.round(tinggi * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  sesuaikan();
  const pengamat = new ResizeObserver(sesuaikan);
  pengamat.observe(kanvas.parentElement);

  return {
    ctx,
    ukuran: () => ({ lebar: kanvas.clientWidth, tinggi: kanvas.clientHeight }),
  };
}

/**
 * Loop simulasi: fisika fixed timestep (default 120 Hz), render tiap frame.
 * Frame rate boleh turun di perangkat lambat tanpa memengaruhi akurasi fisika.
 * Mengembalikan fungsi untuk menghentikan loop.
 */
export function mulaiLoop({ langkah = null, gambar, hzFisika = 120 }) {
  const dtTetap = 1 / hzFisika;
  let waktuSebelumnya = performance.now();
  let akumulator = 0;
  let idBingkai = 0;
  let berhenti = false;

  function bingkai(kini) {
    if (berhenti) return;
    // batasi dt agar tab yang lama tersembunyi tidak "mengejar" ribuan langkah
    const dt = Math.min((kini - waktuSebelumnya) / 1000, 0.25);
    waktuSebelumnya = kini;

    if (langkah) {
      akumulator += dt;
      while (akumulator >= dtTetap) {
        langkah(dtTetap);
        akumulator -= dtTetap;
      }
    }

    gambar(kini / 1000);
    idBingkai = requestAnimationFrame(bingkai);
  }

  idBingkai = requestAnimationFrame(bingkai);
  return () => {
    berhenti = true;
    cancelAnimationFrame(idBingkai);
  };
}
