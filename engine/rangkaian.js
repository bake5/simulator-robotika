/*
 * Model rangkaian elektronika dasar (Lab 1-5).
 * Murni logika: tidak menyentuh DOM/Canvas, bisa diuji headless.
 */

export const TEGANGAN_SUMBER = 5;

/**
 * Rangkaian Lab 2: meja rakit resistor pull-up dan pull-down.
 * Dua mode rakit, masing-masing punya rakitan sendiri:
 * - pullup: tombol menghubungkan pin ke GND; resistor benar = ke VCC (tekan = LOW → aktif low)
 * - pulldown: tombol menghubungkan pin ke VCC; resistor benar = ke GND (tekan = HIGH → aktif high)
 * Tanpa resistor, pin mengambang: nilainya berkedip tak menentu.
 */
export function buatRangkaianPull() {
  return {
    mode: "pullup",
    rakitan: {
      pullup: { resistor: null, ujiTekan: false, ujiLepas: false },
      pulldown: { resistor: null, ujiTekan: false, ujiLepas: false },
    },
    tombolDitekan: false,
    nilaiAmbang: false, // nilai kedip saat pin mengambang
    _sisaWaktuDerau: 0,

    get rakitAktif() {
      return this.rakitan[this.mode];
    },

    get resistorBenar() {
      return this.rakitAktif.resistor === (this.mode === "pullup" ? "vcc" : "gnd");
    },

    /** "HIGH" | "LOW" | "AMBANG" */
    get output() {
      const resistor = this.rakitAktif.resistor;
      if (this.mode === "pullup") {
        if (this.tombolDitekan) return "LOW"; // pin tersambung langsung ke GND
        if (resistor === "vcc") return "HIGH";
        if (resistor === "gnd") return "LOW"; // salah rakit: tertahan LOW terus
        return "AMBANG";
      }
      if (this.tombolDitekan) return "HIGH"; // pin tersambung langsung ke VCC
      if (resistor === "gnd") return "LOW";
      if (resistor === "vcc") return "HIGH"; // salah rakit: tertahan HIGH terus
      return "AMBANG";
    },

    /** Nilai logika yang terlihat (mengambang → nilai kedip acak). */
    get logikaTampak() {
      const keluar = this.output;
      if (keluar === "AMBANG") return this.nilaiAmbang;
      return keluar === "HIGH";
    },

    setMode(mode) {
      if (mode !== "pullup" && mode !== "pulldown") return;
      this.mode = mode;
      this.tombolDitekan = false;
    },

    setResistor(posisi) {
      this.rakitAktif.resistor = posisi === "vcc" || posisi === "gnd" ? posisi : null;
    },

    setTombol(ditekan) {
      ditekan = Boolean(ditekan);
      if (ditekan === this.tombolDitekan) return;
      this.tombolDitekan = ditekan;
      // uji tekan-lepas hanya dihitung saat rakitan benar
      if (this.resistorBenar) {
        if (ditekan) this.rakitAktif.ujiTekan = true;
        else if (this.rakitAktif.ujiTekan) this.rakitAktif.ujiLepas = true;
      }
    },

    modeTuntas(nama) {
      const rakit = this.rakitan[nama];
      const benar = rakit.resistor === (nama === "pullup" ? "vcc" : "gnd");
      return benar && rakit.ujiTekan && rakit.ujiLepas;
    },

    langkah(dt) {
      if (this.output !== "AMBANG") return;
      this._sisaWaktuDerau -= dt;
      if (this._sisaWaktuDerau <= 0) {
        this.nilaiAmbang = Math.random() < 0.5;
        this._sisaWaktuDerau = 0.05 + Math.random() * 0.12;
      }
    },
  };
}

/**
 * Rangkaian Lab 3: pembagi tegangan dua resistor.
 * R1 terhubung dari VCC ke Vout, sedangkan R2 terhubung dari Vout ke GND.
 * Keluaran mengikuti Vout = Vsumber × R2 / (R1 + R2).
 */
export function buatPembagiTegangan() {
  const WAKTU_KONDISI = 0.4;

  return {
    resistansiAtas: 10000,
    resistansiBawah: 5000,
    kondisiTercapai: { rendah: false, seimbang: false, tinggi: false },
    _sudahInteraksi: false,
    _kondisiSebelumnya: null,
    _lamaDiKondisi: 0,

    get resistansiTotal() {
      return this.resistansiAtas + this.resistansiBawah;
    },

    get arus() {
      return TEGANGAN_SUMBER / this.resistansiTotal;
    },

    get arusMiliAmp() {
      return this.arus * 1000;
    },

    get teganganKeluar() {
      return this.arus * this.resistansiBawah;
    },

    get teganganAtas() {
      return TEGANGAN_SUMBER - this.teganganKeluar;
    },

    get rasioBawah() {
      return this.resistansiBawah / this.resistansiTotal;
    },

    get kondisi() {
      if (Math.abs(this.resistansiAtas - this.resistansiBawah) <= 100) return "seimbang";
      if (this.teganganKeluar <= 1.5) return "rendah";
      if (this.teganganKeluar >= 3.5) return "tinggi";
      return null;
    },

    setResistansiAtas(ohm) {
      ohm = Number(ohm);
      if (!Number.isFinite(ohm)) return;
      this.resistansiAtas = Math.max(1, ohm);
      this._sudahInteraksi = true;
    },

    setResistansiBawah(ohm) {
      ohm = Number(ohm);
      if (!Number.isFinite(ohm)) return;
      this.resistansiBawah = Math.max(1, ohm);
      this._sudahInteraksi = true;
    },

    langkah(dt) {
      const kondisi = this._sudahInteraksi ? this.kondisi : null;
      if (!kondisi) {
        this._kondisiSebelumnya = null;
        this._lamaDiKondisi = 0;
        return;
      }
      if (kondisi === this._kondisiSebelumnya) {
        this._lamaDiKondisi += dt;
        if (this._lamaDiKondisi >= WAKTU_KONDISI) this.kondisiTercapai[kondisi] = true;
      } else {
        this._kondisiSebelumnya = kondisi;
        this._lamaDiKondisi = 0;
      }
    },
  };
}

/**
 * Rangkaian Lab 4: potensiometer virtual (pembagi tegangan resistif).
 * Wiper diputar 0-100%; tegangan keluar = (posisi/100) × TEGANGAN_SUMBER.
 * Target persentase acak dipilih tiap sesi — peserta menyapu penuh dari
 * minimum ke maksimum, lalu menahan di sekitar target sebentar.
 */
const POT_TARGET_PILIHAN = [20, 30, 40, 50, 60, 70, 80];
const POT_TOLERANSI = 4; // persen
const POT_WAKTU_TAHAN = 1.2; // detik bertahan di target sebelum dianggap tercapai
export const POT_RESISTANSI_TOTAL = 10000; // ohm — nilai umum potensiometer 10 kΩ

export function buatPotensiometer() {
  const target = POT_TARGET_PILIHAN[Math.floor(Math.random() * POT_TARGET_PILIHAN.length)];

  return {
    posisi: 0, // persen 0-100
    target,
    sudahMin: false,
    sudahMax: false,
    tahanTercapai: false,
    _sisaWaktuTahan: 0,

    /** Resistansi dari wiper ke GND — bagian yang menentukan tegangan keluar. */
    get resistansiBawah() {
      return (this.posisi / 100) * POT_RESISTANSI_TOTAL;
    },

    /** Resistansi dari VCC ke wiper — sisa dari resistansi total tetap. */
    get resistansiAtas() {
      return POT_RESISTANSI_TOTAL - this.resistansiBawah;
    },

    get tegangan() {
      return (this.posisi / 100) * TEGANGAN_SUMBER;
    },

    get diTarget() {
      return Math.abs(this.posisi - this.target) <= POT_TOLERANSI;
    },

    setPosisi(persen) {
      persen = Math.max(0, Math.min(100, Number(persen)));
      this.posisi = persen;
      if (persen <= 2) this.sudahMin = true;
      if (persen >= 98) this.sudahMax = true;
    },

    langkah(dt) {
      if (this.diTarget) {
        this._sisaWaktuTahan += dt;
        if (this._sisaWaktuTahan >= POT_WAKTU_TAHAN) this.tahanTercapai = true;
      } else {
        this._sisaWaktuTahan = 0;
      }
    },
  };
}

/**
 * Rangkaian Lab 5: photodiode di dalam rangkaian pembagi tegangan menuju
 * ADC 10-bit — rantai lengkap cahaya → resistansi → arus & tegangan (pembagi
 * tegangan, sama seperti Lab 3/4) → ADC 0-1023, persis alur yang dipakai
 * mikrokontroler sungguhan.
 *
 * PENYEDERHANAAN PENTING: photodiode sungguhan (reverse-bias) sebenarnya
 * menghasilkan ARUS yang sebanding cahaya, bukan mengubah resistansinya
 * sendiri — itu ciri komponen lain, LDR/photoresistor. Supaya Lab 5 bisa
 * memakai rumus pembagi tegangan yang sama persis dengan Lab 3/4 (benang
 * merah "resistor yang diatur" di seluruh modul), photodiode di sini
 * dimodelkan berperilaku seperti LDR: resistansinya (R_PD) yang berubah
 * karena cahaya, linier — bukan logaritmik seperti LDR sungguhan, sama
 * seperti model LED sepotong-linier di Lab 3. Ini pilihan pedagogis, dicatat
 * eksplisit di panduan lab supaya peserta tidak salah kira dua komponen ini
 * sama.
 */
export const PD_JARAK_MIN = 20; // satuan jarak relatif (bukan cm sungguhan)
export const PD_JARAK_MAKS = 150;
export const PD_R_MIN = 1000; // ohm — resistansi photodiode saat terang penuh
// ohm — resistansi saat gelap total. LDR sungguhan bisa jauh lebih tinggi lagi
// (puluhan-ratusan kΩ), nilai di sini dijaga tetap sama orde besarnya dengan
// resistor tetap di bawah supaya ketiga zona (gelap/sedang/terang) mudah dicapai.
export const PD_R_MAKS = 50000;
export const PD_R_TETAP = 10000; // ohm — resistor tetap pasangan pembagi tegangan
export const ADC_MAKS = 1023; // ADC 10-bit gaya Arduino

/**
 * Resistansi photodiode dari cahaya efektif 0-100% — interpolasi linier sederhana.
 * Dipakai bersama oleh Lab 5 dan Lab 6 supaya kedua lab menghitung dengan rumus
 * yang benar-benar sama persis, bukan dua salinan yang bisa mencong seiring waktu.
 */
export function resistansiPhotodiodeDariCahaya(cahayaEfektif) {
  return PD_R_MAKS - (PD_R_MAKS - PD_R_MIN) * (cahayaEfektif / 100);
}

export function buatPhotodiode() {
  const WAKTU_ZONA = 0.4; // detik bertahan di satu zona sebelum dihitung tercapai

  return {
    jarak: PD_JARAK_MIN, // posisi sumber cahaya, diseret di kanvas
    intensitas: 100, // persen, diatur slider
    zonaTercapai: { gelap: false, sedang: false, terang: false },
    _zonaSebelumnya: null,
    _lamaDiZona: 0,

    /** Cahaya efektif 0-100%: intensitas dilemahkan kuadrat jarak (hukum kuadrat terbalik). */
    get cahayaEfektif() {
      const faktorJarak = (PD_JARAK_MIN / this.jarak) ** 2;
      return Math.max(0, Math.min(100, this.intensitas * faktorJarak));
    },

    /** Resistansi photodiode: makin terang, makin kecil (interpolasi linier sederhana). */
    get resistansi() {
      return resistansiPhotodiodeDariCahaya(this.cahayaEfektif);
    },

    /** Arus rangkaian dalam ampere — satu arus yang sama mengalir lewat kedua resistor. */
    get arus() {
      return TEGANGAN_SUMBER / (this.resistansi + PD_R_TETAP);
    },

    get arusMiliAmp() {
      return this.arus * 1000;
    },

    /** Tegangan keluar, diambil di titik sambung (atas resistor tetap). */
    get tegangan() {
      return this.arus * PD_R_TETAP;
    },

    get adc() {
      return Math.round((this.tegangan / TEGANGAN_SUMBER) * ADC_MAKS);
    },

    /** "gelap" | "sedang" | "terang" berdasarkan ADC. */
    get zona() {
      if (this.adc >= 800) return "terang";
      if (this.adc >= 300) return "sedang";
      return "gelap";
    },

    setJarak(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.jarak = Math.max(PD_JARAK_MIN, Math.min(PD_JARAK_MAKS, nilai));
    },

    setIntensitas(persen) {
      persen = Number(persen);
      if (!Number.isFinite(persen)) return;
      this.intensitas = Math.max(0, Math.min(100, persen));
    },

    langkah(dt) {
      const zona = this.zona;
      if (zona === this._zonaSebelumnya) {
        this._lamaDiZona += dt;
        if (this._lamaDiZona >= WAKTU_ZONA) this.zonaTercapai[zona] = true;
      } else {
        this._zonaSebelumnya = zona;
        this._lamaDiZona = 0;
      }
    },
  };
}

/**
 * Rangkaian Lab 6: satu photodiode tetap menghadap ke bawah, membaca pantulan
 * cahaya dari permukaan bergaris yang diseret di bawahnya. Photodiode dan
 * rangkaian pembagi tegangannya PERSIS sama dengan Lab 5 (dipakai lewat
 * resistansiPhotodiodeDariCahaya) — bedanya cuma sumber "cahaya efektif":
 * di Lab 5 datang dari jarak ke lampu, di sini dari seberapa terang
 * permukaan memantulkan cahaya pemancar yang selalu menyala penuh.
 *
 * Transisi hitam↔putih dibuat halus (bukan lompat mendadak) sepanjang
 * LEBAR_TRANSISI, karena photodiode sungguhan "melihat" area kecil
 * (footprint), bukan satu titik matematis — begitu tepi garis masuk
 * sebagian ke footprint itu, bacaannya jadi nilai antara. Inilah cikal
 * bakal weighted average posisi garis yang dipakai Lab 7.
 */
// % — reflektansi permukaan. Sengaja dibuat kontras tinggi (putih dekat 100%,
// bukan cuma "cukup terang") supaya ADC putih mendekati ADC_MAKS — dengan
// begitu rumus weighted average klasik "bobot = ADC_MAKS − sensor[i]" bekerja
// benar (sensor di atas putih hampir tidak berbobot). Sensor & kamera garis
// sungguhan memang sengaja dirancang/dikalibrasi begitu, bukan kebetulan.
export const REFLEKTANSI_PUTIH = 99;
export const REFLEKTANSI_HITAM = 8; // % — permukaan hitam menyerap hampir semua cahaya
// satuan posisi — lebar garis hitam & zona transisi. Dijaga lebih sempit dari
// SENSOR_SPASI Lab 7 (lihat di bawah) supaya sensor yang tidak sedang di atas
// garis benar-benar bisa membaca putih murni — kalau garis terlalu lebar
// dibanding jarak antar sensor, weighted average tidak akan pernah mencapai
// ujung rentangnya karena sensor tetangga selalu ikut "terkena" sedikit.
export const LEBAR_GARIS = 24;
export const LEBAR_TRANSISI = 6; // satuan posisi — lebar zona peralihan halus di tiap tepi garis
export const PERMUKAAN_JANGKAUAN = 220; // satuan posisi — batas geser permukaan dari tengah

const TEPI_KIRI_GARIS = -LEBAR_GARIS / 2;
const TEPI_KANAN_GARIS = LEBAR_GARIS / 2;

/**
 * Seberapa dalam sebuah titik sensor "masuk" ke garis hitam, 0 (di luar/putih)
 * sampai 1 (sepenuhnya di dalam garis), dihaluskan sepanjang LEBAR_TRANSISI di
 * tiap tepi — footprint sensor, bukan titik matematis. Dipakai bersama Lab 6
 * (satu sensor) dan Lab 7 (delapan sensor sekaligus).
 */
export function fraksiHitamDariPosisi(posisiLokal) {
  const masukDariKiri = Math.max(0, Math.min(1, (posisiLokal - (TEPI_KIRI_GARIS - LEBAR_TRANSISI)) / LEBAR_TRANSISI));
  const belumKeluarKanan = Math.max(0, Math.min(1, (TEPI_KANAN_GARIS + LEBAR_TRANSISI - posisiLokal) / LEBAR_TRANSISI));
  return Math.min(masukDariKiri, belumKeluarKanan);
}

/** Reflektansi permukaan (0-100%) di satu titik — pola sama seperti R_PD di Lab 5. */
export function reflektansiDariPosisi(posisiLokal) {
  return REFLEKTANSI_PUTIH - (REFLEKTANSI_PUTIH - REFLEKTANSI_HITAM) * fraksiHitamDariPosisi(posisiLokal);
}

/** Rantai lengkap cahaya efektif → ADC (resistansi → arus → tegangan → ADC), dibungkus satu fungsi untuk array 8 sensor Lab 7. */
export function adcDariCahaya(cahayaEfektif) {
  const resistansi = resistansiPhotodiodeDariCahaya(cahayaEfektif);
  const arus = TEGANGAN_SUMBER / (resistansi + PD_R_TETAP);
  const tegangan = arus * PD_R_TETAP;
  return Math.round((tegangan / TEGANGAN_SUMBER) * ADC_MAKS);
}

export function buatSensorPermukaan() {
  const WAKTU_ZONA = 0.4; // detik bertahan di satu kondisi sebelum dihitung tercapai
  const tepiKiri = TEPI_KIRI_GARIS;
  const tepiKanan = TEPI_KANAN_GARIS;

  return {
    posisi: -100, // posisi permukaan tepat di bawah sensor sekarang; mulai di atas putih
    riwayat: [], // sampel { adc } untuk grafik real time
    tercapai: { putih: false, hitam: false },
    _zonaSebelumnya: null,
    _lamaDiZona: 0,
    _sisaWaktuSampel: 0,

    get fraksiHitam() {
      return fraksiHitamDariPosisi(this.posisi);
    },

    /** Reflektansi permukaan tepat di bawah sensor sekarang (0-100%). */
    get reflektansi() {
      return reflektansiDariPosisi(this.posisi);
    },

    // pemancar cahaya menyala penuh terus-menerus, jadi cahaya efektif = reflektansi apa adanya
    get cahayaEfektif() {
      return this.reflektansi;
    },

    get resistansi() {
      return resistansiPhotodiodeDariCahaya(this.cahayaEfektif);
    },

    get arus() {
      return TEGANGAN_SUMBER / (this.resistansi + PD_R_TETAP);
    },

    get tegangan() {
      return this.arus * PD_R_TETAP;
    },

    get adc() {
      return Math.round((this.tegangan / TEGANGAN_SUMBER) * ADC_MAKS);
    },

    get diAtasHitam() {
      return this.posisi >= tepiKiri && this.posisi <= tepiKanan;
    },

    get diAtasPutih() {
      return this.posisi <= tepiKiri - LEBAR_TRANSISI || this.posisi >= tepiKanan + LEBAR_TRANSISI;
    },

    /** "hitam" | "putih" | "transisi" — dipakai status teks, bukan kriteria selesai (itu pakai diAtasHitam/diAtasPutih). */
    get kondisi() {
      if (this.diAtasHitam) return "hitam";
      if (this.diAtasPutih) return "putih";
      return "transisi";
    },

    setPosisi(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.posisi = Math.max(-PERMUKAAN_JANGKAUAN, Math.min(PERMUKAAN_JANGKAUAN, nilai));
    },

    langkah(dt) {
      const kondisi = this.diAtasHitam ? "hitam" : this.diAtasPutih ? "putih" : null;
      if (kondisi && kondisi === this._zonaSebelumnya) {
        this._lamaDiZona += dt;
        if (this._lamaDiZona >= WAKTU_ZONA) this.tercapai[kondisi] = true;
      } else {
        this._zonaSebelumnya = kondisi;
        this._lamaDiZona = 0;
      }

      this._sisaWaktuSampel -= dt;
      if (this._sisaWaktuSampel <= 0) {
        this._sisaWaktuSampel += 1 / 30;
        this.riwayat.push(this.adc);
        if (this.riwayat.length > 240) this.riwayat.shift();
      }
    },
  };
}

/**
 * Rangkaian Lab 7: delapan photodiode berjajar (array sensor garis), membaca
 * permukaan bergaris yang sama seperti Lab 6 — tapi sekarang delapan sekaligus,
 * dari pola kedelapan bacaan itu dihitung DI MANA garis berada lewat weighted
 * average, dan seberapa jauh dari tengah (error) — persis rumus yang dipakai
 * robot line follower sungguhan, dan persis fungsi yang ditulis peserta sendiri
 * di Level 2 (hitungError(sensor), lihat coding/api.md).
 */
export const SENSOR_JUMLAH = 8;
export const SENSOR_SPASI = 20; // satuan posisi antar sensor bersebelahan
export const GARIS_JANGKAUAN = 110; // satuan posisi — batas geser garis dari tengah array (sensor terluar di ±70)
export const INDEKS_TENGAH = (SENSOR_JUMLAH - 1) / 2; // 3.5 — rata-rata indeks 0..7
const AMBANG_PUTIH_HILANG = 600; // ADC di atas ini dianggap "putih murni" untuk deteksi garis hilang

/** Posisi fisik sensor ke-i (0..7) relatif ke tengah array, dalam satuan posisi. */
export function offsetSensor(indeks) {
  return (indeks - INDEKS_TENGAH) * SENSOR_SPASI;
}

/**
 * Rumus referensi weighted average — INI JUGA rumus yang benar untuk
 * hitungError(sensor) di Level 2. Diekspor terpisah supaya lab (tampilan
 * Level 1) dan grading Level 2 memakai definisi "benar" yang satu-satunya,
 * tidak dua rumus yang bisa berbeda pendapat.
 *
 * bobot[i] = ADC_MAKS - sensor[i]   (makin gelap, makin besar bobotnya)
 * posisiIndeks = Σ(i × bobot[i]) ÷ Σ(bobot[i])          — 0..7
 * error = (posisiIndeks − indeksTengah) ÷ indeksTengah × 100   — idealnya -100..100
 *
 * CATATAN JUJUR: skala -100..100 itu batas TEORITIS, cuma tercapai kalau
 * sensor yang tidak kena garis membaca PERSIS ADC_MAKS. Dengan kontras
 * rangkaian di lab ini (putih paling terang cuma ADC≈890, bukan 1023 penuh),
 * jangkauan sungguhan yang tercapai lebih sempit (kira-kira ±40 di ujung
 * array). Ini bukan bug — ini alasan sensor line-follower sungguhan
 * sering DIKALIBRASI dulu sebelum dipakai, supaya bacaan "putih" benar-benar
 * mendekati batas atas ADC dan rumus ini bekerja maksimal. Rumusnya sendiri
 * tetap rumus standar yang sama dipakai di kode Arduino sungguhan.
 */
export function hitungErrorReferensi(sensor) {
  let totalBobot = 0;
  let totalTertimbang = 0;
  for (let i = 0; i < sensor.length; i++) {
    const bobot = ADC_MAKS - sensor[i];
    totalBobot += bobot;
    totalTertimbang += i * bobot;
  }
  const indeksTengah = (sensor.length - 1) / 2;
  const posisiIndeks = totalTertimbang / totalBobot;
  return ((posisiIndeks - indeksTengah) / indeksTengah) * 100;
}

export function buatArraySensor() {
  const WAKTU_ZONA = 0.4;

  return {
    posisiGaris: 0, // posisi garis relatif ke tengah array (yang diseret peserta)
    tampilkanRumus: true, // toggle kartu rumus weighted average
    sudahKiri: false,
    sudahKanan: false,
    level2Lulus: false, // diset dari luar (lab07) setelah peserta lulus 3 uji hitungError di Level 2
    _zonaSebelumnya: null,
    _lamaDiZona: 0,

    /**
     * Reflektansi (%) tiap sensor, 8 nilai. Permukaan digambar terpusat pada
     * posisi fisik −posisiGaris (lihat gambarArraySensor), jadi jarak sensor
     * ke-i ke garis adalah offset_i − (−posisiGaris) = offset_i + posisiGaris.
     * Sama seperti Lab 6 yang memakai +posisi secara langsung (sensor
     * tunggalnya di offset 0), bukan dikurangi.
     */
    get reflektansiSensor() {
      const hasil = [];
      for (let i = 0; i < SENSOR_JUMLAH; i++) {
        hasil.push(reflektansiDariPosisi(offsetSensor(i) + this.posisiGaris));
      }
      return hasil;
    },

    /** Bacaan ADC tiap sensor, 8 nilai — rumus sama persis dengan Lab 5/6. */
    get sensorADC() {
      return this.reflektansiSensor.map(adcDariCahaya);
    },

    /** Bobot tiap sensor untuk weighted average: makin gelap (ADC kecil), makin besar. */
    get bobotSensor() {
      return this.sensorADC.map((adc) => ADC_MAKS - adc);
    },

    get totalBobot() {
      return this.bobotSensor.reduce((a, b) => a + b, 0);
    },

    /** Estimasi posisi garis dalam indeks sensor (0-7) dari weighted average. */
    get posisiIndeksEstimasi() {
      const bobot = this.bobotSensor;
      let totalTertimbang = 0;
      for (let i = 0; i < SENSOR_JUMLAH; i++) totalTertimbang += i * bobot[i];
      return totalTertimbang / this.totalBobot;
    },

    /**
     * Error posisi garis terhadap tengah array, -100 (paling kiri) sampai
     * +100 (paling kanan), 0 = tengah. Sengaja dihitung lewat
     * hitungErrorReferensi(sensorADC) — fungsi yang SAMA yang dipakai untuk
     * menilai jawaban Level 2 — bukan duplikat rumusnya di sini.
     */
    get error() {
      return hitungErrorReferensi(this.sensorADC);
    },

    /** Semua sensor membaca "putih murni" — kemungkinan besar garis di luar jangkauan array. */
    get kemungkinanGarisHilang() {
      return this.sensorADC.every((adc) => adc > AMBANG_PUTIH_HILANG);
    },

    setPosisiGaris(nilai) {
      nilai = Number(nilai);
      if (!Number.isFinite(nilai)) return;
      this.posisiGaris = Math.max(-GARIS_JANGKAUAN, Math.min(GARIS_JANGKAUAN, nilai));
      if (this.posisiGaris <= -GARIS_JANGKAUAN + 10) this.sudahKiri = true;
      if (this.posisiGaris >= GARIS_JANGKAUAN - 10) this.sudahKanan = true;
    },

    setTampilkanRumus(nilai) {
      this.tampilkanRumus = Boolean(nilai);
    },
  };
}

/**
 * Rangkaian Lab 1: baterai — saklar — LED.
 * Menghitung berapa kali LED dinyalakan dan dimatikan (kriteria selesai).
 */
export function buatRangkaianLED() {
  return {
    saklar: false,
    hitungNyala: 0,
    hitungMati: 0,

    get ledNyala() {
      return this.saklar;
    },

    get tegangan() {
      return this.saklar ? TEGANGAN_SUMBER : 0;
    },

    setSaklar(tertutup) {
      tertutup = Boolean(tertutup);
      if (tertutup === this.saklar) return;
      if (tertutup) this.hitungNyala += 1;
      else this.hitungMati += 1;
      this.saklar = tertutup;
    },
  };
}
