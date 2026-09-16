/*
 * Lab 14 — Pembagian Frame jadi 8 Region.
 * Momen kunci penghubung Modul 2 dan Modul 4: frame kamera dibagi 8 kolom,
 * tiap kolom dihitung proporsi piksel gelapnya, hasilnya diubah ke skala ADC
 * yang SAMA PERSIS dengan array 8 photodiode Lab 7. Ini sengaja dibuat
 * berperilaku identik supaya kode kendali(sensor) yang sama nanti bisa
 * dipakai untuk kedua mode sensor tanpa perubahan (lihat Lab 15/16).
 *
 * Level 1: eksplorasi (geser garis, slider ambang).
 * Level 2/3: peserta menulis hitungRegion(frameBiner), frame yang SUDAH
 * di-threshold (grid 0/1), karena thresholding-nya sendiri sudah dikuasai di
 * Lab 13. Fokus lab ini murni konsep pembagian region.
 */

import { buatFrame, frameBinerDari, hitungRegionDariBiner, FRAME_LEBAR } from "../engine/kamera.js";
import { gambarFrameRegion, geometriFrame } from "../render/kameraView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const TEMPLATE_JS = `function hitungRegion(frameBiner) {
  // frameBiner: grid 2D angka 0 atau 1 (hasil thresholding), baris x kolom
  // kembalikan array 8 angka ADC (0-1023): makin gelap regionnya, makin kecil angkanya
  //
  // Kode yang menghitung ini sudah ditulis lengkap dan benar di bawah, di dalam
  // komentar /* ... */. Bacalah dulu, lalu hapus baris "/*" dan baris "*/" di
  // bawah ini (dua baris saja) supaya kode itu aktif dan bisa diuji.

  /*
  const lebar = frameBiner[0].length;
  const lebarRegion = lebar / 8;
  const hasil = [];

  for (let r = 0; r < 8; r++) {
    // kolomAwal dan kolomAkhir menandai batas kolom milik region ke-r ini.
    const kolomAwal = Math.floor(r * lebarRegion);
    const kolomAkhir = Math.floor((r + 1) * lebarRegion);
    let totalHitam = 0;
    let jumlahPiksel = 0;

    for (const baris of frameBiner) {
      for (let k = kolomAwal; k < kolomAkhir; k++) {
        totalHitam += baris[k]; // baris[k] bernilai 0 atau 1
        jumlahPiksel += 1;
      }
    }

    // Contoh hitungan: kalau di region ini ada 20 piksel dan 15 di antaranya
    // hitam, maka proporsiGelap = 15 / 20 = 0.75, dan
    // ADC = (1 - proporsiGelap) * 1023 = (1 - 0.75) * 1023 ≈ 256.
    // Semakin gelap regionnya, semakin kecil angka ADC-nya.
    const proporsiGelap = totalHitam / jumlahPiksel;
    hasil.push(Math.round((1 - proporsiGelap) * 1023));
  }

  return hasil;
  */
}
`;

const TEMPLATE_PY = `def hitung_region(frame_biner):
    # frame_biner: list 2D angka 0 atau 1 (hasil thresholding), baris x kolom
    # kembalikan list 8 angka ADC (0-1023): makin gelap regionnya, makin kecil angkanya
    #
    # Kode yang menghitung ini sudah ditulis lengkap dan benar di bawah, di antara
    # tanda kutip tiga (""" ... """). Bacalah dulu, lalu hapus baris yang berisi
    # """ di atas dan di bawah blok itu (dua baris saja) supaya kode itu aktif.

    """
    lebar = len(frame_biner[0])
    lebar_region = lebar / 8
    hasil = []

    for r in range(8):
        # kolom_awal dan kolom_akhir menandai batas kolom milik region ke-r ini.
        kolom_awal = int(r * lebar_region)
        kolom_akhir = int((r + 1) * lebar_region)
        total_hitam = 0
        jumlah_piksel = 0

        for baris in frame_biner:
            for k in range(kolom_awal, kolom_akhir):
                total_hitam += baris[k]  # baris[k] bernilai 0 atau 1
                jumlah_piksel += 1

        # Contoh hitungan: kalau di region ini ada 20 piksel dan 15 di antaranya
        # hitam, maka proporsi_gelap = 15 / 20 = 0.75, dan
        # ADC = (1 - proporsi_gelap) * 1023 = (1 - 0.75) * 1023 ≈ 256.
        # Semakin gelap regionnya, semakin kecil angka ADC-nya.
        proporsi_gelap = total_hitam / jumlah_piksel
        hasil.append(round((1 - proporsi_gelap) * 1023))

    return hasil
    """
`;

function buatKasusUji() {
  return [
    { label: "Garis di kolom paling kiri", posisiGaris: 2 },
    { label: "Garis tepat di tengah", posisiGaris: FRAME_LEBAR / 2 },
    { label: "Garis di kolom paling kanan", posisiGaris: FRAME_LEBAR - 2 },
  ].map(({ label, posisiGaris }) => {
    const frameBiner = frameBinerDari(buatFrame(posisiGaris), 128);
    return { label, frameBiner, referensi: hitungRegionDariBiner(frameBiner) };
  });
}

function formatArray(arr) {
  return `[${arr.map((n) => Math.round(n)).join(", ")}]`;
}

function cocokReferensi(hasil, referensi, toleransi = 60) {
  return (
    Array.isArray(hasil) &&
    hasil.length === referensi.length &&
    hasil.every((n, i) => typeof n === "number" && Number.isFinite(n) && Math.abs(n - referensi[i]) <= toleransi)
  );
}

function buatStateFrameRegion() {
  return {
    posisiGaris: FRAME_LEBAR / 2,
    ambang: 128,
    sudahKiri: false,
    sudahKanan: false,
    level2Lulus: false,

    get frame() {
      return buatFrame(this.posisiGaris);
    },

    get frameBiner() {
      return frameBinerDari(this.frame, this.ambang);
    },

    get regionADC() {
      return hitungRegionDariBiner(this.frameBiner);
    },

    setPosisiGaris(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.posisiGaris = Math.max(0, Math.min(FRAME_LEBAR, nilai));
      if (this.posisiGaris <= 2) this.sudahKiri = true;
      if (this.posisiGaris >= FRAME_LEBAR - 2) this.sudahKanan = true;
    },

    setAmbang(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.ambang = Math.max(0, Math.min(255, nilai));
    },
  };
}

export default {
  id: 14,
  judul: "Pembagian Frame jadi 8 Region",
  singkat: "Frame jadi 8 Region",
  modul: 4,
  tujuan: "Frame kamera dibagi 8 kolom, hasilnya berperilaku seperti array 8 photodiode.",
  rasioKanvas: 0.95, // lebih tinggi dari standar (0.6) — frame perlu ruang lebar penuh mengikuti rasio aslinya (lihat gambarFrameRegion), plus ruang untuk bar chart 8 region di bawahnya.

  panduan: [
    "Seret garis di dalam frame ke kiri dan ke kanan. Bar chart di bawah frame menampilkan nilai 8 region, dengan bentuk yang sama seperti bar chart array sensor di Lab 7. Bedanya, nilai ini dihitung dari gambar kamera, bukan dari photodiode fisik.",
    "Garis putus-putus oranye membagi frame jadi 8 kolom (region). Setiap bar mewakili satu region.",
    "Ubah slider ambang dan amati nilai tiap region ikut berubah. Ini menunjukkan kenapa thresholding di Lab 13 harus dilakukan lebih dulu, sebelum frame kamera bisa dipakai sebagai data sensor.",
    "Level 2/3: buka kartu kode di bawah. Kode hitungRegion(frameBiner) di JavaScript maupun hitung_region(frame_biner) di Python sudah tertulis lengkap di sana, ditandai di dalam komentar. Baca dulu kodenya, lalu hapus tanda komentarnya supaya kode itu aktif, dan tekan tombol Uji.",
    "Lab ini ditandai selesai kalau dua syarat terpenuhi: kamu sudah menggeser garis sampai mentok kiri dan mentok kanan, dan kode Level 2 atau Level 3 sudah lulus semua kasus uji.",
  ],

  deskripsiKoding:
    "Kode hitungRegion(frameBiner) (JavaScript) dan hitung_region(frame_biner) (Python) yang benar sudah disediakan di bawah, di dalam komentar. Hapus tanda komentarnya supaya kode itu aktif, tidak perlu menulis logikanya dari nol. Fungsi ini menerima grid 2D berisi angka 0 atau 1, hasil thresholding, dan mengembalikan array 8 angka ADC seperti bacaan array photodiode Lab 7. Tombol 'Uji' memanggil fungsi Anda tiga kali, sekali untuk tiap posisi garis (kolom paling kiri, tengah, kolom paling kanan).",

  komponen: { frameRegion: true },

  kontrol: [
    {
      jenis: "slider",
      id: "ambang",
      label: "Ambang (threshold)",
      min: 0,
      max: 255,
      langkah: 1,
      nilaiAwal: 128,
      terapkan: (state, nilai) => state.setAmbang(nilai),
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2, 3],

  buatState: buatStateFrameRegion,

  pasangInteraksi(kanvas, state) {
    let menyeret = false;
    let posisiAwal = 0;
    let xAwal = 0;

    kanvas.style.touchAction = "none";
    kanvas.style.cursor = "grab";

    kanvas.addEventListener("pointerdown", (e) => {
      menyeret = true;
      posisiAwal = state.posisiGaris;
      xAwal = e.clientX;
      kanvas.style.cursor = "grabbing";
      kanvas.setPointerCapture(e.pointerId);
    });
    kanvas.addEventListener("pointermove", (e) => {
      if (!menyeret) return;
      const rect = kanvas.getBoundingClientRect();
      const { pixelSize } = geometriFrame(rect.width, rect.height * 0.5, 1);
      state.setPosisiGaris(posisiAwal + (e.clientX - xAwal) / pixelSize);
    });
    const lepas = () => {
      menyeret = false;
      kanvas.style.cursor = "grab";
    };
    kanvas.addEventListener("pointerup", lepas);
    kanvas.addEventListener("pointercancel", lepas);
  },

  pasangKoding(wadah, state) {
    const barisTab = document.createElement("div");
    barisTab.className = "baris-tab";
    const tabJs = document.createElement("button");
    tabJs.type = "button";
    tabJs.className = "tab-item aktif";
    tabJs.textContent = "JavaScript (Level 2)";
    const tabPy = document.createElement("button");
    tabPy.type = "button";
    tabPy.className = "tab-item";
    tabPy.textContent = "Python (Level 3)";
    barisTab.append(tabJs, tabPy);
    wadah.append(barisTab);

    const panelJs = document.createElement("div");
    const panelPy = document.createElement("div");
    panelPy.hidden = true;
    wadah.append(panelJs, panelPy);

    tabJs.addEventListener("click", () => {
      tabJs.classList.add("aktif");
      tabPy.classList.remove("aktif");
      panelJs.hidden = false;
      panelPy.hidden = true;
    });
    tabPy.addEventListener("click", () => {
      tabPy.classList.add("aktif");
      tabJs.classList.remove("aktif");
      panelPy.hidden = false;
      panelJs.hidden = true;
    });

    function pasangSatuBahasa(panel, { kodeAwal, berkasWorker, timeoutMs, namaFungsi, namaBahasa }) {
      const editor = buatEditor(panel, { kodeAwal });
      const barisTombol = document.createElement("div");
      barisTombol.className = "baris-tombol-koding";
      const tombolUji = document.createElement("button");
      tombolUji.type = "button";
      tombolUji.className = "tombol";
      tombolUji.textContent = namaBahasa === "Python" ? "Uji hitung_region (memuat Python pertama kali bisa beberapa detik)" : "Uji hitungRegion";
      barisTombol.append(tombolUji);
      panel.append(barisTombol);

      const hasilEl = document.createElement("div");
      hasilEl.className = "hasil-koding";
      panel.append(hasilEl);

      tombolUji.addEventListener("click", async () => {
        tombolUji.disabled = true;
        hasilEl.innerHTML = "";
        try {
          const runner = buatRunner({ berkasWorker, timeoutMs });
          await runner.muatKode(editor.ambilKode());
          const daftar = document.createElement("div");
          daftar.className = "daftar-uji-koding";
          let semuaLulus = true;

          for (const kasus of buatKasusUji()) {
            const baris = document.createElement("div");
            try {
              const nilai = await runner.panggil(namaFungsi, [kasus.frameBiner]);
              const lulus = cocokReferensi(nilai, kasus.referensi);
              semuaLulus = semuaLulus && lulus;
              baris.className = `baris-uji-koding ${lulus ? "lulus" : "gagal"}`;
              const tanda = document.createElement("span");
              tanda.className = "tanda-uji-koding";
              tanda.textContent = lulus ? "✓" : "✗";
              const teks = document.createElement("span");
              teks.textContent = `${kasus.label}: kode Anda = ${Array.isArray(nilai) ? formatArray(nilai) : String(nilai)}, seharusnya ≈ ${formatArray(kasus.referensi)}`;
              baris.append(tanda, teks);
            } catch (err) {
              semuaLulus = false;
              baris.className = "baris-uji-koding gagal";
              baris.textContent = `${kasus.label}: ${err?.message ?? String(err)}`;
            }
            daftar.append(baris);
          }

          hasilEl.append(daftar);
          runner.hentikan();
          if (semuaLulus) state.level2Lulus = true;
        } catch (err) {
          const kotak = document.createElement("div");
          kotak.className = "pesan-galat-koding";
          kotak.textContent = err?.message ?? String(err);
          hasilEl.append(kotak);
        } finally {
          tombolUji.disabled = false;
        }
      });
    }

    pasangSatuBahasa(panelJs, { kodeAwal: TEMPLATE_JS, berkasWorker: "./worker-js.js", timeoutMs: 50, namaFungsi: "hitungRegion", namaBahasa: "JavaScript" });
    pasangSatuBahasa(panelPy, { kodeAwal: TEMPLATE_PY, berkasWorker: "./worker-py.js", timeoutMs: 8000, namaFungsi: "hitung_region", namaBahasa: "Python" });
  },

  perbaruiPanel(panel, state) {
    const sapuSelesai = state.sudahKiri && state.sudahKanan;
    const tahapKode = state.level2Lulus
      ? "Level 2/3 ✓ (lab selesai)"
      : sapuSelesai
        ? "Level 2/3 belum lulus, coba lengkapi hitungRegion(frameBiner)"
        : "geser dulu garis sampai ujung kiri dan kanan";
    panel.setTeks(
      "status",
      `sapu penuh: kiri ${state.sudahKiri ? "✓" : "…"} · kanan ${state.sudahKanan ? "✓" : "…"} · ${tahapKode}`,
    );
  },

  // Sapu penuh kiri/kanan saja tidak lagi cukup — peserta wajib mencoba dan
  // berhasil melengkapi hitungRegion(frameBiner) (JS Level 2 atau Python Level 3).
  kriteriaSelesai: [
    { id: "kiri", label: "Geser garis sampai mentok ujung kiri", cek: (state) => state.sudahKiri },
    { id: "kanan", label: "Geser garis sampai mentok ujung kanan", cek: (state) => state.sudahKanan },
    { id: "level2", label: "Fungsi hitungRegion(frameBiner) buatanmu lulus semua uji", cek: (state) => state.level2Lulus },
  ],
};
