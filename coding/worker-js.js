/*
 * Web Worker yang mengevaluasi kode JavaScript peserta dan memanggil fungsi
 * tertentu di dalamnya. Tidak ada akses DOM dari sini (bawaan Web Worker).
 * Protokol pesan: lihat coding/api.md.
 */

self.onmessage = (e) => {
  const pesan = e.data;

  if (pesan.tipe === "muatKode") {
    try {
      // eval tak-langsung (0, eval) menjalankan kode di scope global worker,
      // supaya `function namaFungsi(...) {...}` yang peserta tulis otomatis
      // muncul sebagai self.namaFungsi dan bisa dipanggil pesan "panggil".
      (0, eval)(pesan.kode);
      self.postMessage({ tipe: "siap" });
    } catch (err) {
      self.postMessage({ tipe: "galat", pesan: String(err?.message ?? err) });
    }
    return;
  }

  if (pesan.tipe === "panggil") {
    try {
      const fn = self[pesan.nama];
      if (typeof fn !== "function") {
        self.postMessage({
          tipe: "galat",
          id: pesan.id,
          pesan: `Fungsi "${pesan.nama}" tidak ditemukan. Pastikan Anda menulis "function ${pesan.nama}(...) { ... }".`,
        });
        return;
      }
      const nilai = fn(...pesan.argumen);
      self.postMessage({ tipe: "hasil", id: pesan.id, nilai });
    } catch (err) {
      self.postMessage({ tipe: "galat", id: pesan.id, pesan: String(err?.message ?? err) });
    }
  }
};
