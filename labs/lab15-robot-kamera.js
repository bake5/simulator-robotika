/*
 * Lab 15: Kamera sebagai Sensor Robot.
 * Kendali PID yang SAMA PERSIS dari Lab 11 dipakai lagi tanpa perubahan —
 * bedanya cuma sumber array 8 angka sensor: dulu dari photodiode
 * (engine/simulasiLintasan.js), sekarang dari frame kamera yang di-threshold
 * lalu dibagi 8 region (engine/kameraRobot.js). Inilah bukti nyata kenapa
 * kontrak kendali(sensor) dirancang seragam sejak awal — kode kendalinya
 * tidak perlu tahu (dan tidak perlu peduli) dari mana angka sensornya berasal.
 */

import { buatSimulasiLintasan } from "../engine/simulasiLintasan.js";
import { bacaRegionKameraDiPose } from "../engine/kameraRobot.js";
import { kendaliPID } from "../engine/kendali.js";
import { gambarRobotKamera } from "../render/kameraRobotView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const AMBANG_KELUAR_JALUR_SELESAI = 3;

const TEMPLATE_JS = `let integral = 0;
let errorSebelumnya = 0;

function kendali(sensor) {
  // sensor: array 8 angka ADC (0-1023). Sekarang datang dari kamera, tapi
  // bentuknya identik dengan array photodiode Lab 11. Kode di bawah ini
  // sama dengan solusi PID Lab 11, tidak ada yang perlu diubah.
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
  // /* ... */, persis sama dengan solusi Lab 11. Bacalah dulu, lalu hapus
  // baris "/*" dan baris "*/" di bawah ini (dua baris saja) supaya kode itu aktif.

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
    # kutip tiga (""" ... """), persis sama dengan solusi Lab 11. Bacalah dulu,
    # lalu hapus baris yang berisi """ di atas dan di bawah blok itu supaya
    # kode itu aktif.

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

function buatStateKamera() {
  const dasar = buatSimulasiLintasan({ namaLintasanAwal: "belokanHalus" });
  const resetDasar = dasar.resetPosisi.bind(dasar);

  Object.defineProperty(dasar, "sensorADC", {
    configurable: true,
    get() {
      return bacaRegionKameraDiPose(this.lintasanAktif, this.x, this.y, this.sudut, this.ambang);
    },
  });

  return Object.assign(dasar, {
    kecepatanDasar: 35,
    ambang: 128,
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
    setAmbang(v) {
      v = Number(v);
      if (Number.isFinite(v)) this.ambang = Math.max(0, Math.min(255, v));
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
  id: 15,
  judul: "Kamera sebagai Sensor Robot",
  singkat: "Kamera sebagai Sensor Robot",
  modul: 4,
  tujuan: "Menghubungkan delapan nilai region kamera dengan kendali PID untuk mengikuti garis.",
  rasioKanvas: 0.75, // lebih tinggi dari standar (0.6) — kanvas ini menumpuk tampilan lintasan, inset kamera, dan grafik error, perlu ruang vertikal ekstra supaya tidak berdesakan.

  panduan: [
    "Pilih lintasan Halus, lalu jalankan robot dengan pengaturan awal. Amati pandangan kamera, pembagian delapan region, grafik error, dan gerak robot pada lintasan.",
    "Ubah nilai Threshold kamera. Amati bahwa hasil pembacaan region dan gerak robot ikut berubah ketika garis tidak terpisah dengan baik dari lantai.",
    "Atur Kp, Kd, dan Ki seperti pada Lab 11. Amati pengaruh setiap parameter terhadap respons robot, overshoot, dan osilasi.",
    "Pilih lintasan Tajam. Buka bagian coding Level 2 atau Level 3, aktifkan kode kendali(sensor) yang tersedia, lalu pilih Pakai kode ini. Fungsi menerima delapan nilai ADC dari region kamera dan menghasilkan kecepatan roda kiri dan kanan.",
    "Biarkan robot menempuh satu putaran lintasan Tajam. Lab selesai jika robot dikendalikan oleh kode Level 2 atau Level 3 dan keluar jalur kurang dari tiga kali.",
  ],

  deskripsiKoding:
    "Kode fungsi kendali(sensor) tersedia di dalam komentar. JavaScript menggunakan /* ... */ dan Python menggunakan tanda kutip tiga. Hapus penanda komentar agar kode aktif. Fungsi menerima array delapan nilai ADC dari kamera dan mengembalikan [kecepatanKiri, kecepatanKanan]. Setelah tombol Pakai kode ini dipilih, fungsi dijalankan sekitar sepuluh kali per detik. Penyelesaian dinilai dari satu putaran pada lintasan Tajam dengan keluar jalur kurang dari tiga kali.",

  komponen: { simulasiKamera: true },

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
    { jenis: "slider", id: "ambang", label: "Threshold kamera", min: 0, max: 255, langkah: 1, nilaiAwal: 128, terapkan: (s, v) => s.setAmbang(v) },
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
    { jenis: "nilai", id: "overshootAngka", label: "Overshoot maks", satuan: "" },
    { jenis: "nilai", id: "osilasiAngka", label: "Osilasi", satuan: "×" },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2, 3],

  buatState: buatStateKamera,

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
          tampilkanPesan(`Kode ${namaBahasa} dimuat. Robot sekarang berjalan dengan kode tersebut.`, false);
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
      label: "Kode kendali(sensor) sendiri menyelesaikan lintasan Tajam dalam mode kamera, keluar jalur kurang dari 3 kali",
      cek: (state) => state.level2Lulus === true,
    },
  ],
};
