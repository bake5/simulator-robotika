/*
 * Lab 10 — Robot Mengikuti Garis dengan Kendali On Off.
 * Robot berjalan otomatis di lintasan memakai kendali on-off (bang-bang):
 * cuma tiga keadaan (belok kanan tajam, belok kiri tajam, lurus), makanya
 * gerakannya zigzag kasar. Inilah yang memunculkan kebutuhan kendali
 * proporsional di Lab 11.
 *
 * Level 1: kendali bawaan (kendaliOnOffReferensi), peserta atur lintasan &
 * kecepatan dasar, tekan Jalankan, amati zigzagnya.
 * Level 2: peserta menulis kendali(sensor) sendiri (kontrak yang sama dipakai
 * di Lab 10, 11, 15, dan 16 lintas Modul 3-5, lihat CLAUDE.md). Begitu kode
 * dimuat dan diaktifkan, robot yang berjalan memanggil kode itu berulang
 * secara asinkron, dipanggil lagi sesegera panggilan sebelumnya selesai,
 * BUKAN satu panggilan per langkah fisika (120 Hz akan membanjiri worker
 * dengan pesan).
 */

import { buatSimulasiLintasan } from "../engine/simulasiLintasan.js";
import { kendaliOnOffReferensi, AMBANG_ONOFF } from "../engine/kendali.js";
import { gambarRobotLintasan } from "../render/lintasanView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const TEMPLATE_JS = `function kendali(sensor) {
  // sensor: array 8 angka ADC (0-1023), indeks 0 = sensor paling kiri, 7 = paling kanan
  // kembalikan [kecepatanKiri, kecepatanKanan], masing-masing -100..100

  // Rata-rata tertimbang posisi garis. Rumus ini sama persis dengan Lab 7,
  // sudah lengkap di sini, tidak perlu diubah.
  let totalBobot = 0;
  let totalTertimbang = 0;
  for (let i = 0; i < sensor.length; i++) {
    const bobot = 1023 - sensor[i];
    totalBobot += bobot;
    totalTertimbang += i * bobot;
  }
  const posisiIndeks = totalTertimbang / totalBobot;
  const error = ((posisiIndeks - 3.5) / 3.5) * 100; // -100 (paling kiri) .. 100 (paling kanan)

  const KECEPATAN = 40;
  const KECEPATAN_BELOK = 6;

  // Bagian di bawah ini: untuk belok kanan tajam, roda kiri harus cepat/maju dan
  // roda kanan harus lambat. Untuk belok kiri, kebalikannya. Kode yang benar
  // sudah ditulis lengkap di dalam komentar /* ... */. Bacalah dulu, lalu hapus
  // baris "/*" dan baris "*/" di bawah ini (dua baris saja) supaya kode itu aktif.

  /*
  if (error > 15) return [KECEPATAN, KECEPATAN_BELOK]; // garis condong ke kanan, belok kanan tajam
  if (error < -15) return [KECEPATAN_BELOK, KECEPATAN]; // garis condong ke kiri, belok kiri tajam
  return [KECEPATAN, KECEPATAN]; // di tengah, lurus, kedua roda sama cepat
  */
}
`;

export default {
  id: 10,
  judul: "Robot Mengikuti Garis dengan Kendali On Off",
  singkat: "Kendali On Off",
  modul: 3,
  tujuan: "Kendali paling sederhana, robot zigzag kasar, memunculkan kebutuhan kendali yang lebih halus.",

  panduan: [
    "Langkah 1 (Level 1): pilih lintasan, atur kecepatan dasar, lalu tekan Jalankan. Robot dikendalikan oleh kendali on-off bawaan, yang hanya punya tiga keadaan: belok kanan tajam, belok kiri tajam, atau lurus. Tidak ada tingkat 'belok sedikit', sehingga gerakan robot terlihat zigzag.",
    "Jejak hijau berarti robot masih membaca garis. Jejak merah berarti robot sempat kehilangan garis sepenuhnya.",
    "Coba lintasan 'Belokan halus' (berbentuk oval tertutup) dengan kendali bawaan dulu, supaya pola zigzagnya terlihat jelas sebelum kamu menulis kode sendiri.",
    "Langkah 2 (Level 2): buka kartu kode di bawah kanvas. Kode kendali(sensor) yang benar sudah tertulis lengkap di sana, ditandai di dalam komentar. Baca dulu kodenya, lalu hapus baris '/*' dan baris '*/' supaya kode itu aktif, dan tekan 'Pakai kode ini'. Setelah itu robot dikendalikan oleh kode kamu, bukan lagi kendali bawaan.",
    "Lab ini ditandai selesai hanya jika kode kendali(sensor) milik kamu sendiri berhasil membawa robot menempuh satu putaran penuh di lintasan 'Belokan halus'. Menyelesaikan satu putaran dengan kendali bawaan (Level 1) saja tidak dihitung.",
  ],

  deskripsiKoding:
    "Kode kendali(sensor) yang benar sudah disediakan di bawah, di dalam komentar /* ... */. Hapus baris '/*' dan baris '*/' supaya kode itu aktif, tidak perlu menulis logikanya dari nol. Fungsi ini menerima array 8 angka ADC dari sensor robot dan mengembalikan [kecepatanKiri, kecepatanKanan]. Setelah Anda menekan 'Pakai kode ini', fungsi ini dipanggil berulang sekitar 10 kali per detik selama robot berjalan, menggantikan kendali on-off bawaan sepenuhnya. Tidak ada tombol uji terpisah: kode Anda dinilai langsung dari performanya, yaitu apakah robot berhasil menempuh satu putaran penuh di lintasan 'Belokan halus'.",

  komponen: { simulasiLintasan: true },

  kontrol: [
    {
      jenis: "pilihan",
      id: "lintasan",
      label: "Lintasan",
      pilihan: [
        { label: "Lurus", nilai: "lurus" },
        { label: "Belokan halus", nilai: "belokanHalus" },
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
      nilaiAwal: 40,
      satuan: "%",
      terapkan: (state, nilai) => state.setKecepatanDasar(nilai),
    },
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
      jenis: "rumus",
      id: "rumusOnOff",
      judul: "Kendali on-off (bang-bang)",
      baris: [
        { id: "error", simbol: "error = posisi garis relatif ke tengah, -100..100" },
        { id: "kanan", simbol: `error > ${AMBANG_ONOFF} → belok kanan tajam` },
        { id: "kiri", simbol: `error < -${AMBANG_ONOFF} → belok kiri tajam` },
        { id: "lurus", simbol: "selain itu → lurus" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2],

  buatState: () => Object.assign(buatSimulasiLintasan({ namaLintasanAwal: "lurus" }), { level2Lulus: false }),

  /**
   * Keputusan kendali dibatasi ke sekitar 10 Hz (bukan mengikuti fisika 120 Hz)
   * — meniru mikrokontroler sungguhan yang membaca sensor dan memutuskan pada
   * laju tertentu, bukan seketika di setiap langkah fisika. Tanpa pembatasan
   * ini, kendali on-off "gemetar" sangat cepat di batas ambangnya sendiri dan
   * hasilnya justru terlihat halus, bukan zigzag kasar seperti maksud lab ini.
   */
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
                state._galatKode = "kendali(sensor) harus mengembalikan array dua angka, contoh: return [40, 40];";
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
        state._kecepatanKodeTerakhir = kendaliOnOffReferensi(sensor, state.kecepatanDasar);
      }
    }

    const kecepatan = state._kecepatanKodeTerakhir ?? [0, 0];
    state.terapkanKecepatan(kecepatan[0], kecepatan[1]);
    state.langkah(dt);

    if (state._kodeAktif && state.satuPutaranTercapai) state.level2Lulus = true;
  },

  pasangKoding(wadah, state) {
    const editor = buatEditor(wadah, { kodeAwal: TEMPLATE_JS });

    const barisTombol = document.createElement("div");
    barisTombol.className = "baris-tombol-koding";
    const tombolPakai = document.createElement("button");
    tombolPakai.type = "button";
    tombolPakai.className = "tombol";
    tombolPakai.textContent = "Pakai kode ini";
    const tombolBawaan = document.createElement("button");
    tombolBawaan.type = "button";
    tombolBawaan.className = "tombol-sekunder";
    tombolBawaan.textContent = "Kembali ke kendali bawaan";
    barisTombol.append(tombolPakai, tombolBawaan);
    wadah.append(barisTombol);

    const hasilEl = document.createElement("div");
    hasilEl.className = "hasil-koding";
    wadah.append(hasilEl);

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
      try {
        if (!state._runner) state._runner = buatRunner();
        await state._runner.muatKode(editor.ambilKode());
        state._kodeAktif = true;
        state._kecepatanKodeTerakhir = null;
        state._galatKode = null;
        state.resetPosisi();
        state.mulai();
        tampilkanPesan("Kode dimuat. Robot sekarang berjalan dan dikendalikan kode kamu.", false);
      } catch (err) {
        tampilkanPesan(err?.message ?? String(err), true);
      } finally {
        tombolPakai.disabled = false;
      }
    });

    tombolBawaan.addEventListener("click", () => {
      state._kodeAktif = false;
      tampilkanPesan("Kembali memakai kendali on-off bawaan.", false);
    });
  },

  perbaruiPanel(panel, state) {
    panel.setRumus("rumusOnOff", "error", `= ${state.error.toFixed(1)}`);
    const sumber = state._kodeAktif ? "kode kamu (Level 2)" : "kendali bawaan (Level 1)";
    const galat = state._galatKode ? ` · ⚠ ${state._galatKode}` : "";
    const tahapKode = state.level2Lulus
      ? " · Level 2 ✓ (lab selesai)"
      : state.satuPutaranTercapai
        ? " · putaran selesai, tapi belum pakai kode sendiri: tekan 'Pakai kode ini' lalu ulangi"
        : state.keluarDariLintasan
          ? " · robot kehilangan garis, berhenti otomatis: tekan Reset untuk mengulang"
          : "";
    panel.setTeks(
      "status",
      `sumber kendali: ${sumber} · keluar jalur ${state.jumlahKeluarJalur}× · waktu ${state.waktuTempuh.toFixed(1)}s${galat}${tahapKode}`,
    );
  },

  // Selesai satu putaran dengan kendali bawaan (Level 1) saja tidak lagi cukup
  // — peserta wajib mencoba dan berhasil memakai kendali(sensor) sendiri.
  kriteriaSelesai: [
    {
      id: "level2",
      label: "Kode kendali(sensor) sendiri menyelesaikan satu putaran penuh di lintasan Belokan halus",
      cek: (state) => state.level2Lulus === true,
    },
  ],
};
