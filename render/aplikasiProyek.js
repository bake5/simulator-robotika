/*
 * Orkestrator halaman Mini Project Capstone (proyek.html?) — beda dari
 * render/aplikasiLab.js karena bukan salah satu dari 16 lab bernomor (tidak
 * ada di labs/daftar.js), dan punya satu kartu tambahan yang tidak dipunyai
 * lab lain: palet brick untuk menyusun lintasan sendiri.
 */

import { buatProyekAkhir } from "../engine/proyekAkhir.js";
import { KATALOG_BRICK } from "../engine/lintasan.js";
import { kendaliPID } from "../engine/kendali.js";
import { siapkanKanvas, mulaiLoop } from "./kanvas.js";
import { bangunKontrol, isiPanduan } from "./panel.js";
import { gambarEksperimen } from "./kameraRobotView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

// Di dalam iframe LMS, tautan "Beranda" cuma membuka daftar 16 lab di luar
// konteks Mini Project yang sedang dikerjakan peserta — sama seperti
// render/aplikasiLab.js, disembunyikan supaya peserta tetap fokus.
if (window.self !== window.top) {
  document.getElementById("tautanKembali")?.remove();
}

const PANDUAN = [
  "Susun lintasanmu sendiri: klik brick di kartu 'Bricks Lintasan' satu per satu (lurus, tajam kiri/kanan, halus kiri/kanan). Setiap klik menyambung brick baru di ujung lintasan yang sedang disusun, seperti menyambung rel kereta. Pakai 'Hapus terakhir' kalau salah pilih, atau 'Reset lintasan' untuk mengulang dari kosong.",
  "Pilih mode sensor: Photodiode (array 8 sensor titik, seperti Modul 3) atau Kamera (frame dibagi 8 region, seperti Modul 4). Kontrak kendali(sensor) sama persis di kedua mode.",
  "Atur Kp, Kd, Ki, kecepatan dasar, dan ambang (khusus mode kamera) sampai robot mengikuti lintasan rancanganmu dengan halus lewat kendali PID bawaan (Level 1).",
  "Level 2/3: buka kartu kode di bawah. Kode kendali(sensor) yang benar sudah tertulis lengkap di sana (JavaScript maupun Python), ditandai di dalam komentar. Baca dulu kodenya, lalu hapus tanda komentarnya supaya kode itu aktif, dan tekan 'Pakai kode ini' — atau tulis ulang pendekatanmu sendiri dari kode itu sebagai titik awal. Bedanya dari solusi PID di Lab 11/15/16: kecepatan dasarnya di sini tidak konstan, otomatis melambat begitu error membesar (lagi menikung tajam) dan mempercepat lagi begitu error mengecil (lurusan) — cocok untuk lintasan buatanmu sendiri yang mungkin mencampur lurusan panjang dan tikungan tajam sekaligus.",
  "Tekan 'Jalankan' untuk menguji rancanganmu dari awal lintasan. Tidak ada kriteria selesai baku di sini — rancangan lintasan, parameter kendali, dan kode adalah milikmu sendiri. Dokumentasikan hasil kerjamu (screenshot/video dan penjelasan) untuk dikumpulkan lewat assignment Mini Project Capstone di LMS.",
];

const TEMPLATE_JS = `let integral = 0;
let errorSebelumnya = 0;

function kendali(sensor) {
  // sensor: array 8 angka ADC. Bentuknya sama persis di kedua mode
  // (photodiode maupun kamera), kode ini tidak perlu tahu mode mana yang aktif.
  const dt = 0.1;

  let totalBobot = 0;
  let totalTertimbang = 0;
  for (let i = 0; i < sensor.length; i++) {
    const bobot = 1023 - sensor[i];
    totalBobot += bobot;
    totalTertimbang += i * bobot;
  }
  const posisiIndeks = totalTertimbang / totalBobot;
  const error = ((posisiIndeks - 3.5) / 3.5) * 100;

  // Kode PID yang benar sudah ditulis lengkap di bawah, di dalam komentar
  // /* ... */ — mirip solusi Lab 11/15/16, bedanya kecepatan dasarnya di
  // sini TIDAK konstan (lihat penjelasan di dalam kode di bawah). Bacalah
  // dulu, lalu hapus baris "/*" dan baris "*/" di bawah ini supaya kode
  // itu aktif — atau jadikan titik awal untuk pendekatanmu sendiri.

  /*
  const Kp = 0.6;
  const Kd = 0.15;
  const Ki = 0;

  // Kecepatan dasar mengikuti besar |error| SAAT INI, bukan angka tetap.
  // Di lintasan buatan sendiri yang mungkin mencampur lurusan panjang dan
  // tikungan tajam, kecepatan tetap memaksa memilih: cukup cepat di
  // lurusan tapi keluar jalur di tikungan, atau aman di tikungan tapi
  // lambat terus di lurusan. Triknya: error kecil berarti robot di tengah
  // garis (lurusan, atau tikungan yang sedang dikendalikan dengan baik),
  // error besar berarti sedang menikung tajam dan robot belum sempat
  // menyesuaikan arah — jadi kecepatan diturunkan otomatis sebanding
  // dengan besar error itu, dinaikkan lagi begitu error mengecil.
  const KECEPATAN_MAKS = 60;
  const KECEPATAN_MIN = 20;
  const PENGURANGAN_PER_ERROR = 0.5;
  const KECEPATAN_DASAR = Math.max(KECEPATAN_MIN, KECEPATAN_MAKS - Math.abs(error) * PENGURANGAN_PER_ERROR);

  const p = Kp * error;
  integral += error * dt;
  const iTerm = Ki * integral;
  const turunan = (error - errorSebelumnya) / dt;
  const d = Kd * turunan;
  errorSebelumnya = error;

  const koreksi = p + iTerm + d;

  return [KECEPATAN_DASAR + koreksi, KECEPATAN_DASAR - koreksi];
  */
}
`;

const TEMPLATE_PY = `integral = 0
error_sebelumnya = 0

def kendali(sensor):
    global integral, error_sebelumnya
    dt = 0.1

    total_bobot = 0
    total_tertimbang = 0
    for i in range(len(sensor)):
        bobot = 1023 - sensor[i]
        total_bobot += bobot
        total_tertimbang += i * bobot
    posisi_indeks = total_tertimbang / total_bobot
    error = ((posisi_indeks - 3.5) / 3.5) * 100

    # Kode PID yang benar sudah ditulis lengkap di bawah, di antara tanda
    # kutip tiga (""" ... """) — mirip solusi Lab 11/15/16, bedanya
    # kecepatan dasarnya di sini TIDAK konstan (lihat penjelasan di dalam
    # kode di bawah). Bacalah dulu, lalu hapus baris yang berisi """ di
    # atas dan di bawah blok itu supaya kode itu aktif — atau jadikan
    # titik awal untuk pendekatanmu sendiri.

    """
    Kp = 0.6
    Kd = 0.15
    Ki = 0

    # Kecepatan dasar mengikuti besar |error| SAAT INI, bukan angka tetap.
    # Di lintasan buatan sendiri yang mungkin mencampur lurusan panjang
    # dan tikungan tajam, kecepatan tetap memaksa memilih: cukup cepat di
    # lurusan tapi keluar jalur di tikungan, atau aman di tikungan tapi
    # lambat terus di lurusan. Triknya: error kecil berarti robot di
    # tengah garis (lurusan, atau tikungan yang sedang dikendalikan
    # dengan baik), error besar berarti sedang menikung tajam dan robot
    # belum sempat menyesuaikan arah — jadi kecepatan diturunkan otomatis
    # sebanding dengan besar error itu, dinaikkan lagi begitu error
    # mengecil.
    kecepatan_maks = 60
    kecepatan_min = 20
    pengurangan_per_error = 0.5
    kecepatan_dasar = max(kecepatan_min, kecepatan_maks - abs(error) * pengurangan_per_error)

    p = Kp * error
    integral += error * dt
    i_term = Ki * integral
    turunan = (error - error_sebelumnya) / dt
    d = Kd * turunan
    error_sebelumnya = error

    koreksi = p + i_term + d

    return [kecepatan_dasar + koreksi, kecepatan_dasar - koreksi]
    """
`;

const state = buatProyekAkhir();

isiPanduan(document.getElementById("isiPanduan"), PANDUAN);

const panel = bangunKontrol(
  document.getElementById("isiKontrol"),
  [
    {
      jenis: "pilihan",
      id: "mode",
      label: "Mode sensor",
      pilihan: [
        { label: "Photodiode", nilai: "photodiode" },
        { label: "Kamera", nilai: "kamera" },
      ],
      terapkan: (s, v) => s.setMode(v),
    },
    { jenis: "slider", id: "kecepatanDasar", label: "Kecepatan dasar", min: 0, max: 100, langkah: 1, nilaiAwal: 35, satuan: "%", terapkan: (s, v) => s.setKecepatanDasar(v) },
    { jenis: "slider", id: "ambang", label: "Ambang kamera", min: 0, max: 255, langkah: 1, nilaiAwal: 128, terapkan: (s, v) => s.setAmbang(v) },
    { jenis: "slider", id: "kp", label: "Kp (proporsional)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.6, terapkan: (s, v) => s.setKp(v) },
    { jenis: "slider", id: "kd", label: "Kd (turunan)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.15, terapkan: (s, v) => s.setKd(v) },
    { jenis: "slider", id: "ki", label: "Ki (integral)", min: 0, max: 1, langkah: 0.02, nilaiAwal: 0, terapkan: (s, v) => s.setKi(v) },
    {
      jenis: "tombol",
      id: "jalankan",
      label: "Jalankan",
      terapkan: (s) => {
        if (!s.bricks.length) return;
        s.resetPosisi();
        s.mulai();
      },
    },
    { jenis: "tombol", id: "reset", label: "Reset posisi", sekunder: true, terapkan: (s) => { s.berhenti(); s.resetPosisi(); } },
    { jenis: "teks", id: "status" },
  ],
  (kontrol, nilai) => kontrol.terapkan?.(state, nilai),
);

// ---- Palet brick: bukan salah satu jenis kontrol umum di panel.js, cuma dipakai halaman ini ----
const paletBrick = document.getElementById("paletBrick");
for (const brick of KATALOG_BRICK) {
  const tombol = document.createElement("button");
  tombol.type = "button";
  tombol.className = "tombol-brick";
  tombol.textContent = brick.label;
  tombol.addEventListener("click", () => {
    state.berhenti();
    state.tambahBrick(brick.id);
  });
  paletBrick.append(tombol);
}
document.getElementById("tombolUndoBrick").addEventListener("click", () => {
  state.berhenti();
  state.hapusBrickTerakhir();
});
document.getElementById("tombolResetBrick").addEventListener("click", () => {
  state.berhenti();
  state.resetTrack();
});

// ---- Kartu kode: sama persis pola Lab 16 (JS Level 2 / Python Level 3, solusi lengkap ter-comment) ----
document.getElementById("deskripsiKoding").textContent =
  "Kode kendali(sensor) yang benar sudah disediakan di bawah, di dalam komentar (JavaScript memakai /* ... */, Python memakai \"\"\" ... \"\"\"), berbasis PID seperti solusi Lab 11/15/16 tapi dengan kecepatan dasar yang menyesuaikan besar error (melambat di tikungan tajam, mempercepat di lurusan) — cocok untuk lintasan buatanmu sendiri yang bisa mencampur keduanya. Hapus tanda komentarnya supaya kode itu aktif, atau tulis ulang pendekatanmu sendiri. Fungsi ini menerima array 8 angka ADC dan mengembalikan [kecepatanKiri, kecepatanKanan]. Setelah menekan 'Pakai kode ini', fungsi ini dipanggil berulang sekitar 10 kali per detik selama robot berjalan, menggantikan kendali PID bawaan (Level 1).";

function pasangKoding(wadah, state) {
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

  function pasangSatuBahasa(panelBahasa, { kodeAwal, berkasWorker, timeoutMs, namaBahasa }) {
    const editor = buatEditor(panelBahasa, { kodeAwal });
    const barisTombol = document.createElement("div");
    barisTombol.className = "baris-tombol-koding";
    const tombolPakai = document.createElement("button");
    tombolPakai.type = "button";
    tombolPakai.className = "tombol";
    tombolPakai.textContent = namaBahasa === "Python" ? "Pakai kode ini (memuat Python pertama kali bisa beberapa detik)" : "Pakai kode ini";
    barisTombol.append(tombolPakai);
    panelBahasa.append(barisTombol);

    const hasilEl = document.createElement("div");
    hasilEl.className = "hasil-koding";
    panelBahasa.append(hasilEl);

    function tampilkanPesan(teks, galat) {
      hasilEl.innerHTML = "";
      const kotak = document.createElement("div");
      kotak.className = galat ? "pesan-galat-koding" : "baris-uji-koding lulus";
      kotak.textContent = teks;
      hasilEl.append(kotak);
    }

    tombolPakai.addEventListener("click", async () => {
      document.getElementById("kanvasLab")?.scrollIntoView({ behavior: "smooth", block: "center" });
      tombolPakai.disabled = true;
      tampilkanPesan(namaBahasa === "Python" ? "Memuat Python…" : "Memuat kode…", false);
      try {
        const runner = buatRunner({ berkasWorker, timeoutMs });
        await runner.muatKode(editor.ambilKode());
        state._runner?.hentikan();
        state._runner = runner;
        state._bahasaAktif = namaBahasa;
        state._kodeAktif = true;
        state._kecepatanKodeTerakhir = null;
        state._galatKode = null;
        tampilkanPesan(`Kode ${namaBahasa} dimuat. Tekan 'Jalankan' untuk menjalankan robot dengan kode ini.`, false);
      } catch (err) {
        tampilkanPesan(err?.message ?? String(err), true);
      } finally {
        tombolPakai.disabled = false;
      }
    });
  }

  pasangSatuBahasa(panelJs, { kodeAwal: TEMPLATE_JS, berkasWorker: "./worker-js.js", timeoutMs: 50, namaBahasa: "JavaScript" });
  pasangSatuBahasa(panelPy, { kodeAwal: TEMPLATE_PY, berkasWorker: "./worker-py.js", timeoutMs: 8000, namaBahasa: "Python" });

  const tombolBawaan = document.createElement("button");
  tombolBawaan.type = "button";
  tombolBawaan.className = "tombol-sekunder tombol-aksi";
  tombolBawaan.textContent = "Kembali ke kendali PID bawaan (slider)";
  tombolBawaan.addEventListener("click", () => {
    state._kodeAktif = false;
  });
  wadah.append(tombolBawaan);
}

pasangKoding(document.getElementById("isiKoding"), state);

// ---- Kanvas + loop ----
const kanvas = document.getElementById("kanvasLab");
const { ctx, ukuran } = siapkanKanvas(kanvas, 0.75);

function langkah(state, dt) {
  if (!state.berjalan) return;

  state._sisaWaktuKendali -= dt;
  if (state._sisaWaktuKendali <= 0) {
    state._sisaWaktuKendali += 1 / 10;
    const sensor = state.sensorADC;

    if (state._kodeAktif && state._runner) {
      if (!state._sedangMemanggil) {
        state._sedangMemanggil = true;
        state._runner
          .panggil("kendali", [sensor])
          .then((hasil) => {
            if (Array.isArray(hasil) && hasil.length === 2 && hasil.every((n) => typeof n === "number" && Number.isFinite(n))) {
              state._kecepatanKodeTerakhir = hasil;
              state._galatKode = null;
            } else {
              state._galatKode = "kendali(sensor) harus mengembalikan array/list dua angka.";
            }
          })
          .catch((err) => {
            state._galatKode = err?.message ?? String(err);
          })
          .finally(() => {
            state._sedangMemanggil = false;
          });
      }
    } else {
      const hasil = kendaliPID(sensor, state.kecepatanDasar, state, 1 / 10);
      state._kecepatanKodeTerakhir = hasil.kecepatan;
    }
  }

  const kecepatan = state._kecepatanKodeTerakhir ?? [0, 0];
  state.terapkanKecepatan(kecepatan[0], kecepatan[1]);
  state.langkah(dt);
  state.catatError();
}

mulaiLoop({
  langkah: (dt) => langkah(state, dt),
  gambar: () => {
    gambarEksperimen(ctx, state, ukuran());

    document.getElementById("infoBrick").textContent = state.bricks.length
      ? `${state.bricks.length} brick tersusun`
      : "Belum ada brick — klik salah satu brick untuk mulai menyusun lintasan.";

    const sumber = state._kodeAktif ? `kode kamu (Level ${state._bahasaAktif === "Python" ? "3" : "2"})` : "kendali PID bawaan (Level 1)";
    const galat = state._galatKode ? ` · ⚠ ${state._galatKode}` : "";
    const kosong = !state.bricks.length ? " · susun lintasan dulu sebelum menekan Jalankan" : "";
    const keluar = state.keluarDariLintasan ? " · robot terlalu jauh/mencapai ujung lintasan, berhenti otomatis" : "";
    panel.setTeks("status", `sumber: ${sumber} · keluar jalur ${state.jumlahKeluarJalur}× · waktu ${state.waktuTempuh.toFixed(1)}s${galat}${kosong}${keluar}`);
  },
});
