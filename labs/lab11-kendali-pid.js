/*
 * Lab 11 — Kendali Proporsional, PD, PID. Lab terbesar Modul 3.
 * Robot yang sama seperti Lab 10 (engine/simulasiLintasan.js), tapi kendalinya
 * naik satu tingkat: bukan cuma tiga keadaan (Lab 10), sekarang koreksinya
 * SEBANDING dengan seberapa jauh melenceng (P), diredam supaya tidak
 * berosilasi (D), dan bisa mengoreksi bias menetap (I). Lihat rumus lengkap
 * di engine/kendali.js.
 *
 * Level 1: kendali bawaan (kendaliPID di engine/kendali.js), peserta atur
 * Kp/Kd/Ki lewat slider dan amati efeknya langsung, termasuk overshoot dan
 * osilasi kalau parameternya kebesaran.
 * Level 2: peserta menulis kendali(sensor) di JavaScript (template PID
 * isi-bagian-kosong).
 * Level 3: peserta menulis kendali(sensor) bebas di Python lewat Pyodide
 * (coding/worker-py.js), kontrak fungsinya identik dengan JavaScript.
 */

import { buatSimulasiLintasan } from "../engine/simulasiLintasan.js";
import { kendaliPID } from "../engine/kendali.js";
import { gambarRobotPID } from "../render/pidView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const AMBANG_KELUAR_JALUR_SELESAI = 3;

const TEMPLATE_JS = `let integral = 0;
let errorSebelumnya = 0;

function kendali(sensor) {
  const dt = 0.1; // kendali dipanggil sekitar 10 kali per detik

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
  // /* ... */. Bacalah dulu, lalu hapus baris "/*" dan baris "*/" di bawah ini
  // (dua baris saja) supaya kode itu aktif dan bisa dipakai.

  /*
  const Kp = 0.6;
  const Kd = 0.15;
  const Ki = 0;
  const KECEPATAN_DASAR = 35;

  // P (proporsional): makin jauh error dari nol, makin besar koreksinya.
  const p = Kp * error;
  integral += error * dt;
  // I (integral): mengoreksi bias yang menetap dari waktu ke waktu, dengan
  // menjumlahkan error tiap langkah. Jarang perlu besar di simulator ini.
  const iTerm = Ki * integral;
  // D (turunan): meredam reaksi P yang terlalu cepat/besar, dihitung dari
  // seberapa cepat error berubah dibanding langkah sebelumnya.
  const turunan = (error - errorSebelumnya) / dt;
  const d = Kd * turunan;
  errorSebelumnya = error;

  // Gabungkan ketiga suku di atas jadi satu nilai koreksi arah.
  const koreksi = p + iTerm + d;

  // error positif = garis condong ke kanan, jadi roda kiri harus lebih cepat untuk mengejar
  return [KECEPATAN_DASAR + koreksi, KECEPATAN_DASAR - koreksi];
  */
}
`;

const TEMPLATE_PY = `integral = 0
error_sebelumnya = 0

def kendali(sensor):
    global integral, error_sebelumnya
    dt = 0.1  # kendali dipanggil sekitar 10 kali per detik

    total_bobot = 0
    total_tertimbang = 0
    for i in range(len(sensor)):
        bobot = 1023 - sensor[i]
        total_bobot += bobot
        total_tertimbang += i * bobot
    posisi_indeks = total_tertimbang / total_bobot
    error = ((posisi_indeks - 3.5) / 3.5) * 100

    # Kode PID yang benar sudah ditulis lengkap di bawah, di antara tanda
    # kutip tiga (""" ... """). Bacalah dulu, lalu hapus baris yang berisi
    # """ di atas dan di bawah blok itu (dua baris saja) supaya kode itu
    # aktif dan berjalan, bukan cuma teks.

    """
    Kp = 0.6
    Kd = 0.15
    Ki = 0
    kecepatan_dasar = 35

    p = Kp * error  # P: sebanding dengan error saat ini
    integral += error * dt
    i_term = Ki * integral  # I: akumulasi error dari waktu ke waktu, jarang perlu besar di simulator ini
    turunan = (error - error_sebelumnya) / dt
    d = Kd * turunan  # D: meredam reaksi P yang terlalu cepat/besar
    error_sebelumnya = error

    koreksi = p + i_term + d

    # error positif = garis condong ke kanan, jadi roda kiri harus lebih cepat untuk mengejar
    return [kecepatan_dasar + koreksi, kecepatan_dasar - koreksi]
    """
`;

function buatStatePID() {
  const dasar = buatSimulasiLintasan({ namaLintasanAwal: "belokanHalus" });
  const resetDasar = dasar.resetPosisi.bind(dasar);

  return Object.assign(dasar, {
    kecepatanDasar: 35,
    kp: 0.6,
    kd: 0.15,
    ki: 0,
    integral: 0,
    errorSebelumnya: 0,
    riwayatError: [],
    overshootMaks: 0,
    jumlahOsilasi: 0,
    _errorTandaSebelumnya: 0,
    _sisaWaktuSampelGrafik: 0,

    targetBanding: "A",
    jejakBeku: null,
    labelBeku: null,

    _kodeAktif: false,
    _bahasaAktif: "js",
    _runner: null,
    _sedangMemanggil: false,
    _kecepatanKodeTerakhir: null,
    _galatKode: null,
    _sisaWaktuKendali: 0,
    level2Lulus: false,

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

    /** Bekukan jejak konfigurasi yang barusan berjalan sebelum pindah ke A/B lainnya. */
    gantiTargetBanding(target) {
      if (target === this.targetBanding && this.jejak.length) {
        this.jejakBeku = this.jejak.slice();
        this.labelBeku = this.targetBanding;
      } else if (target !== this.targetBanding) {
        this.jejakBeku = this.jejak.slice();
        this.labelBeku = this.targetBanding;
        this.targetBanding = target;
      }
    },

    resetPosisi() {
      resetDasar();
      this.integral = 0;
      this.errorSebelumnya = 0;
      this.riwayatError = [];
      this.overshootMaks = 0;
      this.jumlahOsilasi = 0;
      this._errorTandaSebelumnya = 0;
      this._sisaWaktuSampelGrafik = 0;
    },

    /** Dipanggil tiap langkah fisika setelah state.langkah(dt) — grafik error, overshoot, osilasi. */
    catatSampel(dt) {
      const err = this.error;
      const tandaBulat = Math.sign(Math.round(err));
      if (tandaBulat !== 0 && this._errorTandaSebelumnya !== 0 && tandaBulat !== this._errorTandaSebelumnya) {
        this.jumlahOsilasi += 1;
      }
      if (tandaBulat !== 0) this._errorTandaSebelumnya = tandaBulat;
      if (Math.abs(err) > this.overshootMaks) this.overshootMaks = Math.abs(err);

      this._sisaWaktuSampelGrafik -= dt;
      if (this._sisaWaktuSampelGrafik <= 0) {
        this._sisaWaktuSampelGrafik += 1 / 20;
        this.riwayatError.push(err);
        if (this.riwayatError.length > 200) this.riwayatError.shift();
      }
    },
  });
}

export default {
  id: 11,
  judul: "Kendali Proporsional, PD, PID",
  singkat: "Kendali P, PD, PID",
  modul: 3,
  tujuan: "Tuning parameter kendali, membandingkan kehalusan gerak dengan Lab 10.",

  panduan: [
    "Dibandingkan dengan Lab 10, koreksi sekarang sebanding dengan seberapa jauh robot melenceng dari garis (P), bukan hanya tiga keadaan kanan/kiri/lurus.",
    "Mulai dari Kp saja (Kd = Ki = 0). Naikkan nilainya pelan-pelan sampai robot mulai berosilasi, yaitu bergoyang kanan-kiri terus-menerus. Kondisi ini menandakan Kp sudah terlalu besar.",
    "Tambahkan Kd untuk meredam osilasi itu. Kd menghitung koreksi dari seberapa cepat error berubah, sehingga menurunkan responsnya sebelum robot overshoot.",
    "Ki jarang perlu bernilai besar di simulator ini. Kalau dinaikkan terlalu tinggi, muncul integral windup: koreksi terus membesar dan sulit berhenti.",
    "Grafik error di bawah kanvas serta angka overshoot dan osilasi di panel membantu menilai kehalusan tuning secara objektif, tidak hanya dengan mengamati gerakan robot.",
    "Mode banding untuk melihat efek perubahan parameter secara visual: atur Kp/Kd/Ki, lalu tekan 'Jalankan sebagai A' untuk menjalankan robot dengan nilai itu. Ubah Kp/Kd/Ki ke nilai lain, lalu tekan 'Jalankan sebagai B'. Jejak konfigurasi A tergambar sebagai garis putus, jejak konfigurasi B yang baru saja dijalankan tergambar sebagai garis penuh, keduanya ditumpuk di kanvas yang sama sehingga kehalusan dua konfigurasi bisa langsung dibandingkan.",
    "Level 2/3: buka kartu kode di bawah kanvas. Kode kendali(sensor) yang benar sudah tertulis lengkap di sana (JavaScript maupun Python), ditandai di dalam komentar. Baca dulu kodenya, lalu hapus tanda komentarnya supaya kode itu aktif, dan tekan 'Pakai kode ini'. Lab ini ditandai selesai hanya setelah kode itu (bukan slider Level 1) berhasil menyelesaikan satu putaran penuh lintasan Tajam dengan keluar jalur kurang dari 3 kali.",
  ],

  deskripsiKoding:
    "Kode kendali(sensor) yang benar sudah disediakan di bawah, di dalam komentar (JavaScript memakai /* ... */, Python memakai \"\"\" ... \"\"\"). Hapus tanda komentarnya supaya kode itu aktif, tidak perlu menulis rumus PID dari nol. Fungsi ini menerima array 8 angka ADC dan mengembalikan [kecepatanKiri, kecepatanKanan], kontrak yang sama dengan Lab 10. Setelah Anda menekan 'Pakai kode ini', fungsi ini dipanggil berulang sekitar 10 kali per detik selama robot berjalan, menggantikan kendali PID bawaan. Tidak ada tombol uji terpisah: kode Anda dinilai dari performa nyatanya, yaitu apakah robot berhasil menempuh satu putaran penuh di lintasan Tajam dengan keluar jalur kurang dari 3 kali.",

  komponen: { simulasiPID: true },

  kontrol: [
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
    { jenis: "slider", id: "kp", label: "Kp (proporsional)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.6, terapkan: (s, v) => s.setKp(v) },
    { jenis: "slider", id: "kd", label: "Kd (turunan)", min: 0, max: 3, langkah: 0.05, nilaiAwal: 0.15, terapkan: (s, v) => s.setKd(v) },
    { jenis: "slider", id: "ki", label: "Ki (integral)", min: 0, max: 1, langkah: 0.02, nilaiAwal: 0, terapkan: (s, v) => s.setKi(v) },
    { jenis: "tombol", id: "jalankan", label: "Jalankan", terapkan: (state) => state.mulai() },
    {
      jenis: "tombol",
      id: "reset",
      label: "Reset",
      sekunder: true,
      terapkan: (state) => {
        state.berhenti();
        state.resetPosisi();
      },
    },
    {
      jenis: "tombol",
      id: "jalankanA",
      label: "Jalankan sebagai A",
      sekunder: true,
      terapkan: (state) => {
        state.gantiTargetBanding("A");
        state.berhenti();
        state.resetPosisi();
        state.mulai();
      },
    },
    {
      jenis: "tombol",
      id: "jalankanB",
      label: "Jalankan sebagai B",
      sekunder: true,
      terapkan: (state) => {
        state.gantiTargetBanding("B");
        state.berhenti();
        state.resetPosisi();
        state.mulai();
      },
    },
    { jenis: "nilai", id: "overshootAngka", label: "Overshoot maks", satuan: "" },
    { jenis: "nilai", id: "osilasiAngka", label: "Osilasi", satuan: "×" },
    {
      jenis: "rumus",
      id: "rumusPID",
      judul: "Kendali PID",
      baris: [
        { id: "p", simbol: "P = Kp × error" },
        { id: "i", simbol: "I = Ki × Σ error·dt" },
        { id: "d", simbol: "D = Kd × (error − error sebelumnya) ÷ dt" },
        { id: "koreksi", simbol: "koreksi = P + I + D" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2, 3],

  buatState: buatStatePID,

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
    state.catatSampel(dt);

    if (
      state._kodeAktif &&
      state.namaLintasan === "tajam" &&
      state.satuPutaranTercapai &&
      state.jumlahKeluarJalur < AMBANG_KELUAR_JALUR_SELESAI
    ) {
      state.level2Lulus = true;
    }
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
        // supaya robot yang bergerak langsung terlihat tanpa perlu scroll manual.
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
          state.resetPosisi();
          state.mulai();
          tampilkanPesan(`Kode ${namaBahasa} dimuat. Robot sekarang berjalan dan dikendalikan oleh kode kamu.`, false);
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
    panel.setAngka("overshootAngka", state.overshootMaks.toFixed(1));
    panel.setAngka("osilasiAngka", String(state.jumlahOsilasi));
    panel.setRumus("rumusPID", "p", `= ${state.kp} × ${state.error.toFixed(1)} = ${(state.kp * state.error).toFixed(1)}`);
    panel.setRumus("rumusPID", "i", `= ${state.ki} × ${state.integral.toFixed(1)} = ${(state.ki * state.integral).toFixed(1)}`);
    panel.setRumus("rumusPID", "d", `Kd = ${state.kd}`);
    panel.setRumus("rumusPID", "koreksi", "kecepatanKiri = dasar − koreksi, kecepatanKanan = dasar + koreksi");

    const sumber = state._kodeAktif ? `kode kamu (Level ${state._bahasaAktif === "Python" ? "3" : "2"})` : "kendali PID bawaan (Level 1)";
    const galat = state._galatKode ? ` · ⚠ ${state._galatKode}` : "";
    const tahapKode = state.keluarDariLintasan
      ? " · robot terlalu jauh dari lintasan (kemungkinan Kp/Kd terlalu besar), berhenti otomatis: tekan Reset untuk mengulang"
      : state.level2Lulus
        ? " · Level 2/3 ✓ (lab selesai)"
        : " · lab selesai setelah lintasan Tajam ditempuh pakai kode sendiri";
    panel.setTeks(
      "status",
      `sumber: ${sumber} · keluar jalur ${state.jumlahKeluarJalur}× · waktu ${state.waktuTempuh.toFixed(1)}s${galat}${tahapKode}`,
    );
  },

  // Menyelesaikan lintasan Tajam dengan kendali PID bawaan (Level 1) saja
  // tidak lagi cukup — peserta wajib mencoba dan berhasil dengan kendali(sensor) sendiri.
  kriteriaSelesai: [
    {
      id: "level2",
      label: "Kode kendali(sensor) sendiri menyelesaikan lintasan Tajam dengan keluar jalur kurang dari 3 kali",
      cek: (state) => state.level2Lulus === true,
    },
  ],
};
