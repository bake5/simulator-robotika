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
  "Klik segmen pada kartu 'Segmen Lintasan' untuk menyusun lintasan secara berurutan. Pilih segmen lurus, tikungan tajam ke kiri atau kanan, serta tikungan halus ke kiri atau kanan. Gunakan 'Hapus terakhir' untuk membatalkan segmen terakhir atau 'Reset lintasan' untuk mengulang dari awal.",
  "Pilih mode Photodiode atau Kamera. Kedua mode menghasilkan delapan nilai sensor sehingga fungsi kendali(sensor) dapat digunakan tanpa mengubah bentuk masukan dan keluaran.",
  "Atur kecepatan dasar serta parameter Kp, Kd, dan Ki. Untuk mode Kamera, atur juga nilai threshold. Tekan 'Jalankan', lalu amati gerak robot dan grafik error untuk menilai kemampuan kendali mengikuti lintasan yang disusun.",
  "Jika menggunakan Level 2 atau 3, buka kartu kode dan pelajari contoh kendali(sensor) yang tersedia di dalam komentar. Hapus tanda komentar untuk mengaktifkan contoh tersebut, lalu tekan 'Pakai kode ini'. Kecepatan dasar pada contoh akan berkurang ketika besar error meningkat dan bertambah kembali ketika error mengecil.",
  "Uji beberapa susunan lintasan dan catat parameter yang digunakan. Halaman capstone tidak memiliki kriteria selesai atau ekspor CSV. Dokumentasikan rancangan, pengaturan, hasil pengamatan, dan perbaikan yang dilakukan untuk pengumpulan Mini Project Capstone di LMS.",
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

  // Contoh PID tersedia di dalam komentar /* ... */ di bawah ini.
  // Berbeda dari contoh Lab 11, 15, dan 16, kecepatan dasar pada contoh
  // ini tidak konstan. Pelajari contoh, lalu hapus baris "/*" dan "*/"
  // untuk mengaktifkannya atau gunakan sebagai dasar pendekatan lain.

  /*
  const Kp = 0.6;
  const Kd = 0.15;
  const Ki = 0;

  // Kecepatan dasar mengikuti besar |error| SAAT INI, bukan angka tetap.
  // Lintasan rancangan dapat menggabungkan bagian lurus dan tikungan tajam.
  // Error kecil menunjukkan robot berada dekat bagian tengah garis.
  // Error besar menunjukkan robot perlu koreksi arah yang lebih kuat.
  // Karena itu, kecepatan dikurangi ketika besar error meningkat dan
  // ditambah kembali ketika error mengecil.
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

    # Contoh PID tersedia di antara tanda kutip tiga di bawah ini.
    # Berbeda dari contoh Lab 11, 15, dan 16, kecepatan dasar pada contoh
    # ini tidak konstan. Pelajari contoh, lalu hapus tanda kutip tiga
    # untuk mengaktifkannya atau gunakan sebagai dasar pendekatan lain.

    """
    Kp = 0.6
    Kd = 0.15
    Ki = 0

    # Kecepatan dasar mengikuti besar |error| SAAT INI, bukan angka tetap.
    # Lintasan rancangan dapat menggabungkan bagian lurus dan tikungan
    # tajam. Error kecil menunjukkan robot berada dekat bagian tengah
    # garis. Error besar menunjukkan robot perlu koreksi arah yang lebih
    # kuat. Karena itu, kecepatan dikurangi ketika besar error meningkat
    # dan ditambah kembali ketika error mengecil.
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
    { jenis: "slider", id: "ambang", label: "Threshold kamera", min: 0, max: 255, langkah: 1, nilaiAwal: 128, terapkan: (s, v) => s.setAmbang(v) },
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
  "Contoh kendali(sensor) berbasis PID tersedia di dalam komentar pada editor JavaScript dan Python. Contoh tersebut menyesuaikan kecepatan dasar berdasarkan besar error. Hapus tanda komentar untuk mengaktifkannya atau gunakan sebagai dasar untuk menyusun pendekatan lain. Fungsi menerima array berisi delapan nilai ADC dan mengembalikan [kecepatanKiri, kecepatanKanan]. Setelah tombol 'Pakai kode ini' ditekan, fungsi dipanggil sekitar 10 kali per detik dan menggantikan kendali PID bawaan.";

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
      ? `${state.bricks.length} segmen tersusun`
      : "Belum ada segmen. Klik salah satu segmen untuk mulai menyusun lintasan.";

    const sumber = state._kodeAktif ? `kode peserta (Level ${state._bahasaAktif === "Python" ? "3" : "2"})` : "kendali PID bawaan (Level 1)";
    const galat = state._galatKode ? ` · ⚠ ${state._galatKode}` : "";
    const kosong = !state.bricks.length ? " · susun lintasan sebelum menekan Jalankan" : "";
    const keluar = state.keluarDariLintasan ? " · robot terlalu jauh dari lintasan atau mencapai ujung lintasan sehingga berhenti otomatis" : "";
    panel.setTeks("status", `sumber ${sumber} · keluar jalur ${state.jumlahKeluarJalur}× · waktu ${state.waktuTempuh.toFixed(1)}s${galat}${kosong}${keluar}`);
  },
});
