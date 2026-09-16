/*
 * Lab 16 — Eksperimen Komparatif. Lab pembuka Modul 5 (penutup program):
 * lintasan sama, dua mode sensor (photodiode Lab 10/11 vs kamera Lab 15)
 * bisa disaklar bolak-balik, dengan sesi terukur berdurasi tetap yang
 * datanya dicatat dan bisa diekspor CSV untuk bahan laporan mini project
 * peserta.
 *
 * Menggabungkan semua yang sudah dibangun: kinematika (engine/robot.js),
 * lintasan (engine/lintasan.js), sensor photodiode (engine/simulasiLintasan.js)
 * dan kamera (engine/kameraRobot.js), kendali PID (engine/kendali.js), dan
 * kontrak kendali(sensor) yang identik untuk Level 2/3 di kedua mode.
 */

import { buatSimulasiLintasan, bacaSensorDiPose } from "../engine/simulasiLintasan.js";
import { bacaRegionKameraDiPose } from "../engine/kameraRobot.js";
import { kendaliPID } from "../engine/kendali.js";
import { gambarEksperimen } from "../render/kameraRobotView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const DURASI_SESI = 30; // detik — sesi terukur berdurasi tetap

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
  // /* ... */, persis sama dengan solusi Lab 11 dan Lab 15. Bacalah dulu,
  // lalu hapus baris "/*" dan baris "*/" di bawah ini supaya kode itu aktif.
  // Memakai kode ini bersifat opsional di lab ini: kendali PID bawaan (Level 1)
  // juga sah dipakai untuk sesi terukur.

  /*
  const Kp = 0.6;
  const Kd = 0.15;
  const Ki = 0;
  const KECEPATAN_DASAR = 35;

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
    # kutip tiga (""" ... """), persis sama dengan solusi Lab 11 dan Lab 15.
    # Bacalah dulu, lalu hapus baris yang berisi """ di atas dan di bawah
    # blok itu supaya kode itu aktif. Memakai kode ini bersifat opsional di
    # lab ini: kendali PID bawaan (Level 1) juga sah dipakai.

    """
    Kp = 0.6
    Kd = 0.15
    Ki = 0
    kecepatan_dasar = 35

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

function buatCSV(log) {
  const header = "waktu,mode,lintasan,error,posisiX,posisiY,keluarJalur";
  const baris = log.map(
    (e) => `${e.waktu.toFixed(2)},${e.mode},${e.lintasan},${e.error.toFixed(2)},${e.posisiX.toFixed(1)},${e.posisiY.toFixed(1)},${e.keluarJalur}`,
  );
  const rataErrorAbsolut = log.length ? log.reduce((jumlah, e) => jumlah + Math.abs(e.error), 0) / log.length : 0;
  const ringkasan = `RINGKASAN,,,rata-rata error absolut ${rataErrorAbsolut.toFixed(2)},,,jumlah sampel ${log.length}`;
  return [header, ...baris, ringkasan].join("\n");
}

function unduhCSV(teks) {
  const blob = new Blob([teks], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = `simulator-robotika-lab16-${Date.now()}.csv`;
  document.body.append(tautan);
  tautan.click();
  tautan.remove();
  URL.revokeObjectURL(url);
}

function buatStateEksperimen() {
  const dasar = buatSimulasiLintasan({ namaLintasanAwal: "belokanHalus" });
  const resetDasar = dasar.resetPosisi.bind(dasar);

  Object.defineProperty(dasar, "sensorADC", {
    configurable: true,
    get() {
      return this.mode === "kamera"
        ? bacaRegionKameraDiPose(this.lintasanAktif, this.x, this.y, this.sudut, this.ambang)
        : bacaSensorDiPose(this.lintasanAktif, this.x, this.y, this.sudut);
    },
  });

  return Object.assign(dasar, {
    mode: "photodiode", // "photodiode" | "kamera"
    ambang: 128,
    kecepatanDasar: 35,
    kp: 0.6,
    kd: 0.15,
    ki: 0,
    integral: 0,
    errorSebelumnya: 0,
    riwayatError: [],

    durasiSesi: DURASI_SESI,
    sesiAktif: false,
    waktuSesi: 0,
    logGabungan: [],
    sesiSelesai: { photodiode: false, kamera: false },
    sudahEksporCSV: false,

    _sisaWaktuLog: 0,
    _sisaWaktuKendali: 0,
    _kodeAktif: false,
    _bahasaAktif: "js",
    _runner: null,
    _sedangMemanggil: false,
    _kecepatanKodeTerakhir: null,
    _galatKode: null,

    setMode(m) {
      if (m !== "photodiode" && m !== "kamera") return;
      this.mode = m;
      this.sesiAktif = false;
      this.resetPosisi();
    },
    setAmbang(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.ambang = Math.max(0, Math.min(255, v));
    },
    setKp(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.kp = v;
    },
    setKd(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.kd = v;
    },
    setKi(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.ki = v;
    },

    resetPosisi() {
      resetDasar();
      this.integral = 0;
      this.errorSebelumnya = 0;
      this.riwayatError = [];
      // Reset posisi selalu mengakhiri sesi terukur yang mungkin masih berjalan,
      // supaya ganti lintasan di tengah sesi tidak mencampur dua lintasan
      // berbeda dalam satu baris data CSV yang sama.
      this.sesiAktif = false;
      this.waktuSesi = 0;
      this._sisaWaktuLog = 0;
    },

    mulaiSesi() {
      this.resetPosisi();
      this.waktuSesi = 0;
      this.sesiAktif = true;
      this._sisaWaktuLog = 0;
      this.mulai();
    },

    /** Dipanggil tiap langkah fisika setelah state.langkah(dt) — mencatat log & memberhentikan sesi saat durasinya habis. */
    langkahSesi(dt) {
      const err = this.error;
      this.riwayatError.push(err);
      if (this.riwayatError.length > 200) this.riwayatError.shift();

      if (!this.sesiAktif) return;
      this.waktuSesi += dt;

      this._sisaWaktuLog -= dt;
      if (this._sisaWaktuLog <= 0) {
        this._sisaWaktuLog += 1 / 10; // 10 sampel/detik — cukup rapat untuk grafik/CSV, tidak membebani
        this.logGabungan.push({
          waktu: this.waktuSesi,
          mode: this.mode,
          lintasan: this.namaLintasan,
          error: err,
          posisiX: this.x,
          posisiY: this.y,
          keluarJalur: this.jumlahKeluarJalur,
        });
      }

      if (this.waktuSesi >= this.durasiSesi) {
        this.sesiAktif = false;
        this.berhenti();
        this.sesiSelesai[this.mode] = true;
      }
    },

    eksporCSV() {
      if (!this.logGabungan.length) return;
      unduhCSV(buatCSV(this.logGabungan));
      this.sudahEksporCSV = true;
    },
  });
}

export default {
  id: 16,
  judul: "Eksperimen Komparatif",
  singkat: "Eksperimen Komparatif",
  modul: 5,
  tujuan: "Lintasan sama, dua mode sensor, data untuk mini project.",
  rasioKanvas: 0.75, // sama dengan Lab 15 — mode kamera di sini menumpuk lintasan, inset kamera, dan grafik error, perlu ruang vertikal ekstra.

  panduan: [
    "Atur dulu parameter kendali: Kp, Kd, Ki, kecepatan dasar, dan ambang (khusus mode kamera). Untuk sesi terukur, kamu boleh memakai kendali PID bawaan (Level 1) atau kode kendali(sensor) di kartu kode (Level 2/3, sudah tertulis lengkap di dalam komentar, tinggal dihapus tanda komentarnya). Keduanya sah dipakai, yang penting parameternya sama saat kamu membandingkan dua mode sensor.",
    "Tekan 'Mulai sesi terukur' untuk menjalankan sesi berdurasi tetap 30 detik. Selama sesi berjalan, error, posisi robot, dan status keluar jalur dicatat otomatis 10 kali per detik.",
    "Jalankan satu sesi terukur di mode Photodiode. Lalu ganti ke mode Kamera dan jalankan satu sesi terukur lagi, dengan kendali dan parameter yang sama seperti sebelumnya. Bandingkan hasil keduanya: mode mana yang rata-rata errornya lebih kecil, dan mode mana yang lebih sering keluar jalur.",
    "Tekan 'Ekspor CSV' untuk mengunduh seluruh data yang sudah terkumpul dari semua sesi yang pernah dijalankan. Data ini jadi bahan laporan mini project.",
    "Lab ini selesai setelah kamu menjalankan minimal satu sesi terukur di masing-masing mode sensor (photodiode dan kamera), lalu mengekspor CSV minimal sekali.",
  ],

  deskripsiKoding:
    "Kode kendali(sensor) yang benar sudah disediakan di bawah, di dalam komentar (JavaScript memakai /* ... */, Python memakai \"\"\" ... \"\"\"), persis sama dengan solusi Lab 11 dan Lab 15. Kode ini bersifat opsional di lab ini: dipakai lewat 'Pakai kode ini' kalau kamu ingin membandingkan kedua mode sensor dengan kendali PID itu, sebagai alternatif dari kendali PID bawaan (Level 1). Setelah diaktifkan, fungsi ini dipanggil berulang sekitar 10 kali per detik selama sesi terukur berjalan, di kedua mode sensor.",

  komponen: { eksperimen: true },

  kontrol: [
    {
      jenis: "pilihan",
      id: "mode",
      label: "Mode sensor",
      pilihan: [
        { label: "Photodiode", nilai: "photodiode" },
        { label: "Kamera", nilai: "kamera" },
      ],
      terapkan: (state, nilai) => state.setMode(nilai),
    },
    {
      jenis: "pilihan",
      id: "lintasan",
      label: "Lintasan",
      pilihan: [
        { label: "Halus", nilai: "belokanHalus" },
        { label: "Tajam", nilai: "tajam" },
        { label: "Zigzag", nilai: "zigzag" },
      ],
      terapkan: (state, nilai) => state.setLintasan(nilai),
    },
    {
      jenis: "slider",
      id: "kecepatanDasar",
      label: "Kecepatan dasar",
      min: 0,
      max: 100,
      langkah: 1,
      nilaiAwal: 35,
      satuan: "%",
      terapkan: (state, nilai) => state.setKecepatanDasar(nilai),
    },
    { jenis: "slider", id: "ambang", label: "Ambang kamera", min: 0, max: 255, langkah: 1, nilaiAwal: 128, terapkan: (s, v) => s.setAmbang(v) },
    { jenis: "slider", id: "kp", label: "Kp (proporsional)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.6, terapkan: (s, v) => s.setKp(v) },
    { jenis: "slider", id: "kd", label: "Kd (turunan)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.15, terapkan: (s, v) => s.setKd(v) },
    { jenis: "slider", id: "ki", label: "Ki (integral)", min: 0, max: 1, langkah: 0.02, nilaiAwal: 0, terapkan: (s, v) => s.setKi(v) },
    { jenis: "tombol", id: "mulaiSesi", label: "Mulai sesi terukur (30 detik)", terapkan: (state) => state.mulaiSesi() },
    {
      jenis: "tombol",
      id: "reset",
      label: "Reset",
      sekunder: true,
      terapkan: (state) => {
        state.sesiAktif = false;
        state.berhenti();
        state.resetPosisi();
      },
    },
    { jenis: "tombol", id: "eksporCSV", label: "Ekspor CSV", sekunder: true, terapkan: (state) => state.eksporCSV() },
    { jenis: "nilai", id: "waktuSesiAngka", label: "Sesi", satuan: "s" },
    { jenis: "nilai", id: "jumlahLogAngka", label: "Baris data", satuan: "" },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2, 3],

  buatState: buatStateEksperimen,

  langkah(state, dt) {
    if (!state.berjalan) return;

    state._sisaWaktuKendali = (state._sisaWaktuKendali ?? 0) - dt;
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
    state.langkahSesi(dt);
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

    function pasangSatuBahasa(panel, { kodeAwal, berkasWorker, timeoutMs, namaBahasa }) {
      const editor = buatEditor(panel, { kodeAwal });
      const barisTombol = document.createElement("div");
      barisTombol.className = "baris-tombol-koding";
      const tombolPakai = document.createElement("button");
      tombolPakai.type = "button";
      tombolPakai.className = "tombol";
      tombolPakai.textContent = namaBahasa === "Python" ? "Pakai kode ini (memuat Python pertama kali bisa beberapa detik)" : "Pakai kode ini";
      barisTombol.append(tombolPakai);
      panel.append(barisTombol);

      const hasilEl = document.createElement("div");
      hasilEl.className = "hasil-koding";
      panel.append(hasilEl);

      function tampilkanPesan(teks, galat) {
        hasilEl.innerHTML = "";
        const kotak = document.createElement("div");
        kotak.className = galat ? "pesan-galat-koding" : "baris-uji-koding lulus";
        kotak.textContent = teks;
        hasilEl.append(kotak);
      }

      tombolPakai.addEventListener("click", async () => {
        // Kartu kode ada jauh di bawah kanvas, jadi geser tampilan ke kanvas dulu
        // supaya siap dilihat begitu sesi terukur ditekan.
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
          tampilkanPesan(`Kode ${namaBahasa} dimuat. Tekan 'Mulai sesi terukur' untuk menjalankan robot dengan kode ini.`, false);
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
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("waktuSesiAngka", `${state.waktuSesi.toFixed(0)}/${state.durasiSesi}`);
    panel.setAngka("jumlahLogAngka", String(state.logGabungan.length));

    const s = state.sesiSelesai;
    const sumber = state._kodeAktif ? `kode kamu (Level ${state._bahasaAktif === "Python" ? "3" : "2"})` : "kendali PID bawaan (Level 1)";
    const galat = state._galatKode ? ` · ⚠ ${state._galatKode}` : "";
    const keluar = state.keluarDariLintasan ? " · robot terlalu jauh dari lintasan, sesi berhenti otomatis: tekan Reset untuk mengulang" : "";
    panel.setTeks(
      "status",
      `sumber: ${sumber} · sesi selesai: photodiode ${s.photodiode ? "✓" : "…"} · kamera ${s.kamera ? "✓" : "…"} · CSV ${state.sudahEksporCSV ? "✓ terunduh" : "belum diekspor"}${galat}${keluar}`,
    );
  },

  kriteriaSelesai: [
    { id: "photodiode", label: "Jalankan minimal satu sesi terukur di mode photodiode", cek: (state) => state.sesiSelesai.photodiode },
    { id: "kamera", label: "Jalankan minimal satu sesi terukur di mode kamera", cek: (state) => state.sesiSelesai.kamera },
    { id: "csv", label: "Ekspor data ke CSV minimal sekali", cek: (state) => state.sudahEksporCSV },
  ],
};
