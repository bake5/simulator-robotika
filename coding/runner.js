/*
 * Kelola Web Worker yang menjalankan kode peserta: memuat kode, memanggil
 * satu fungsi di dalamnya dengan argumen tertentu, dan menegakkan timeout.
 * Kode macet (mis. perulangan tak berujung) → worker dimatikan dan diganti
 * yang baru, halaman tetap hidup. Generik untuk JavaScript (berkasWorker
 * bawaan "./worker-js.js", Level 2) maupun Python (berkasWorker
 * "./worker-py.js", Level 3, dipakai mulai Lab 11) — keduanya memakai
 * protokol pesan yang sama persis, lihat coding/api.md.
 */

export class GalatKode extends Error {}

const PESAN_TIMEOUT = "Kode terlalu lama berjalan, kemungkinan ada perulangan tak berujung.";

export function buatRunner({ timeoutMs = 50, berkasWorker = "./worker-js.js" } = {}) {
  let worker = null;
  let idBerikut = 1;
  const penantianPanggil = new Map(); // id -> { resolve, reject, timer }
  let penantianMuat = null; // { resolve, reject } — cuma satu muatKode boleh menggantung sekaligus

  function buatWorkerBaru() {
    worker?.terminate();
    worker = new Worker(new URL(berkasWorker, import.meta.url));
    worker.onmessage = (e) => tanganiPesan(e.data);
    worker.onerror = (e) => {
      e.preventDefault?.();
      const galat = new GalatKode(e.message || "Kode bermasalah.");
      if (penantianMuat) {
        penantianMuat.reject(galat);
        penantianMuat = null;
      }
      for (const [id, p] of penantianPanggil) {
        clearTimeout(p.timer);
        p.reject(galat);
      }
      penantianPanggil.clear();
    };
  }

  function tanganiPesan(pesan) {
    if (pesan.tipe === "siap") {
      penantianMuat?.resolve();
      penantianMuat = null;
      return;
    }
    if (pesan.tipe === "galat" && pesan.id === undefined) {
      penantianMuat?.reject(new GalatKode(pesan.pesan));
      penantianMuat = null;
      return;
    }
    const p = penantianPanggil.get(pesan.id);
    if (!p) return;
    penantianPanggil.delete(pesan.id);
    clearTimeout(p.timer);
    if (pesan.tipe === "hasil") p.resolve(pesan.nilai);
    else p.reject(new GalatKode(pesan.pesan));
  }

  buatWorkerBaru();

  return {
    /** Muat sumber kode peserta. Menolak (reject) kalau ada galat sintaks. */
    muatKode(kode) {
      return new Promise((resolve, reject) => {
        penantianMuat = { resolve, reject };
        worker.postMessage({ tipe: "muatKode", kode });
      });
    },

    /**
     * Panggil satu fungsi di kode yang sudah dimuat. Timeout → worker lama
     * dimatikan & diganti baru (kode perlu dimuat ulang lewat muatKode
     * sebelum panggilan berikutnya).
     */
    panggil(nama, argumen) {
      const id = idBerikut++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          penantianPanggil.delete(id);
          buatWorkerBaru();
          reject(new GalatKode(PESAN_TIMEOUT));
        }, timeoutMs);
        penantianPanggil.set(id, { resolve, reject, timer });
        worker.postMessage({ tipe: "panggil", id, nama, argumen });
      });
    },

    hentikan() {
      worker?.terminate();
      worker = null;
    },
  };
}
