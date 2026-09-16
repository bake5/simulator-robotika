/*
 * Web Worker yang menjalankan kode Python peserta lewat Pyodide (Level 3,
 * dipakai mulai Lab 11). Memakai protokol pesan yang SAMA PERSIS dengan
 * coding/worker-js.js (lihat coding/api.md) supaya coding/runner.js bisa
 * mengelola worker JS maupun Python dengan kode yang sama.
 *
 * CATATAN JUJUR (per Agustus 2026): Pyodide adalah runtime Python lengkap
 * dikompilasi ke WebAssembly, ukurannya puluhan MB. Sesuai keputusan di
 * CLAUDE.md, dimuat LAZY dari CDN — cuma diunduh saat peserta pertama kali
 * membuka lab dengan Level 3, lalu di-cache browser untuk pemakaian
 * berikutnya (termasuk lab Level 3 lain, satu unduhan dipakai bersama).
 * Belum ada salinan Pyodide ter-vendor lokal di proyek ini — kalau CDN
 * tidak terjangkau (put us offline atau diblokir jaringan sekolah/kampus),
 * worker mengirim pesan galat yang menjelaskan itu ke peserta, bukan
 * gagal diam-diam. Menambahkan salinan lokal sebagai fallback sungguhan
 * adalah pekerjaan lanjutan yang belum dikerjakan di sesi ini.
 */

const CDN_PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

let pyodidePromise = null; // Promise<pyodide> — dimuat sekali per worker, dipakai ulang untuk semua panggilan berikutnya

function muatPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      importScripts(CDN_PYODIDE);
      return self.loadPyodide();
    })();
  }
  return pyodidePromise;
}

function pesanGalatRamah(err) {
  const teks = String(err?.message ?? err);
  if (/importScripts|Failed to fetch|NetworkError|Load failed/i.test(teks)) {
    return "Python (Pyodide) gagal dimuat dari internet. Periksa koneksi internet lalu coba lagi — unduhan pertama perlu jaringan aktif.";
  }
  return teks;
}

self.onmessage = async (e) => {
  const pesan = e.data;

  if (pesan.tipe === "muatKode") {
    try {
      const pyodide = await muatPyodide();
      pyodide.runPython(pesan.kode);
      self.postMessage({ tipe: "siap" });
    } catch (err) {
      self.postMessage({ tipe: "galat", pesan: pesanGalatRamah(err) });
    }
    return;
  }

  if (pesan.tipe === "panggil") {
    try {
      const pyodide = await muatPyodide();
      const fn = pyodide.globals.get(pesan.nama);
      if (typeof fn !== "function") {
        self.postMessage({
          tipe: "galat",
          id: pesan.id,
          pesan: `Fungsi "${pesan.nama}" tidak ditemukan. Pastikan Anda menulis "def ${pesan.nama}(...):".`,
        });
        return;
      }
      const hasilPy = fn(...pesan.argumen);
      const nilai = hasilPy && typeof hasilPy.toJs === "function" ? hasilPy.toJs() : hasilPy;
      if (hasilPy && typeof hasilPy.destroy === "function") hasilPy.destroy();
      self.postMessage({ tipe: "hasil", id: pesan.id, nilai });
    } catch (err) {
      self.postMessage({ tipe: "galat", id: pesan.id, pesan: pesanGalatRamah(err) });
    }
  }
};
