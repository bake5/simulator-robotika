/*
 * Satu-satunya pintu akses localStorage.
 * Semua dibungkus try-catch karena mode private browsing bisa menolak localStorage.
 */

const KUNCI_PROGRES = "sim.progres";
const AWALAN_SIM = "sim.";

function baca(kunci, cadangan) {
  try {
    const mentah = localStorage.getItem(kunci);
    return mentah === null ? cadangan : JSON.parse(mentah);
  } catch {
    return cadangan;
  }
}

function tulis(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* penyimpanan tidak tersedia — simulator tetap jalan tanpa progres tersimpan */
  }
}

/** Daftar id lab yang sudah selesai. */
export function bacaProgres() {
  const progres = baca(KUNCI_PROGRES, []);
  return Array.isArray(progres) ? progres : [];
}

export function labSelesai(id) {
  return bacaProgres().includes(id);
}

export function tandaiSelesai(id) {
  const progres = bacaProgres();
  if (!progres.includes(id)) {
    progres.push(id);
    tulis(KUNCI_PROGRES, progres);
  }
}

/** Hapus seluruh data simulator (progres dan kode tersimpan). */
export function resetProgres() {
  try {
    const kunciSim = [];
    for (let i = 0; i < localStorage.length; i++) {
      const kunci = localStorage.key(i);
      if (kunci && kunci.startsWith(AWALAN_SIM)) kunciSim.push(kunci);
    }
    kunciSim.forEach((kunci) => localStorage.removeItem(kunci));
  } catch {
    /* abaikan */
  }
}

/** Kode terakhir peserta per lab per level, kunci: sim.kode.lab07.js2 / sim.kode.lab11.py */
export function simpanKode(idLab, level, kode) {
  const nomor = String(idLab).padStart(2, "0");
  tulis(`sim.kode.lab${nomor}.${level}`, kode);
}

export function bacaKode(idLab, level) {
  const nomor = String(idLab).padStart(2, "0");
  return baca(`sim.kode.lab${nomor}.${level}`, null);
}
