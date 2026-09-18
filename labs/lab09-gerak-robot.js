/*
 * Lab 9 — Gerak Robot Dua Roda.
 * Lab fondasi Modul 3 (fisikanya dipakai lagi di Lab 10, 11, 15, 16): arena
 * kosong, robot dikendalikan dua slider kecepatan roda, empat pola gerak
 * ditemukan sendiri, tantangan opsional memarkirkan robot ke kotak target.
 *
 * Level 1: eksplorasi (dua slider).
 * Level 2: peserta menulis gerak(x, y, sudut, targetX, targetY) yang
 * mengembalikan [kecepatanKiri, kecepatanKanan], dinilai lewat simulasi
 * singkat di Web Worker. Ini bukan satu pemanggilan seperti Lab 7, di sini
 * fungsinya dipanggil berulang, sekali per langkah simulasi, karena tugasnya
 * bertahap mencapai target, bukan menghitung satu angka langsung.
 */

import { buatGerakRobot, langkahKinematika, TARGET_POSISI, TARGET_UKURAN, ARENA_SETENGAH_LEBAR, ARENA_SETENGAH_TINGGI } from "../engine/robot.js";
import { gambarGerakRobot } from "../render/robotView.js";
import { buatEditor } from "../coding/editor.js";
import { buatRunner } from "../coding/runner.js";

const TEMPLATE_JS = `function gerak(x, y, sudut, targetX, targetY) {
  // x, y: posisi robot sekarang.
  // sudut: arah hadap robot sekarang, dalam radian (0 = menghadap kanan, π/2 = menghadap atas).
  // targetX, targetY: posisi kotak target yang harus didatangi robot.
  // Fungsi ini dipanggil berulang, sekali tiap langkah simulasi, sampai robot sampai ke
  // target atau waktu simulasi habis.
  // Kembalikan [kecepatanKiri, kecepatanKanan], masing-masing angka -100..100.
  //
  // Math.atan2(dy, dx) memberi arah DARI ROBOT MENUJU TARGET. errorSudut adalah
  // selisih antara arah itu dengan arah hadap robot sekarang: kalau besar, robot
  // harus berbelok dulu (kedua roda dibuat beda jauh); kalau kecil, robot sudah
  // menghadap target dan tinggal maju lurus (kedua roda dibuat mirip).
  //
  // Kode yang menghitung ini sudah ditulis lengkap dan benar di bawah, di dalam
  // komentar /* ... */. Bacalah dulu, lalu hapus baris "/*" dan baris "*/" di
  // bawah ini (dua baris saja) supaya kode itu aktif dan bisa diuji.

  /*
  const dx = targetX - x;
  const dy = targetY - y;
  const jarak = Math.sqrt(dx * dx + dy * dy);
  const arahKeTarget = Math.atan2(dy, dx);
  let errorSudut = arahKeTarget - sudut;

  const kecepatanDasar = Math.min(60, jarak); // melambat saat sudah dekat target
  const koreksi = errorSudut * 40;
  const kecepatanKiri = Math.max(-100, Math.min(100, kecepatanDasar - koreksi));
  const kecepatanKanan = Math.max(-100, Math.min(100, kecepatanDasar + koreksi));

  return [kecepatanKiri, kecepatanKanan];
  */
}
`;

const DT_UJI = 1 / 20; // Hz simulasi uji — lebih kasar dari fisika asli (120 Hz), cukup untuk menilai arah gerak
const LANGKAH_UJI_MAKS = 400; // 400 × 1/20 s = 20 detik simulasi maksimum
const TOLERANSI_UJI = TARGET_UKURAN / 2;

const JEDA_ANIMASI_MS = 25; // jeda antar langkah supaya robot terlihat bergerak, bukan langsung lompat ke hasil akhir

/** Menjalankan gerak(...) peserta sambil memindahkan robot yang tampil di kanvas, supaya prosesnya terlihat, bukan cuma hasil akhirnya. */
async function jalankanSimulasiUji(runner, state) {
  state.x = 0;
  state.y = 0;
  state.sudut = 0;
  state.jejak = [{ x: 0, y: 0 }];
  try {
    for (let i = 0; i < LANGKAH_UJI_MAKS; i++) {
      const hasil = await runner.panggil("gerak", [state.x, state.y, state.sudut, TARGET_POSISI.x, TARGET_POSISI.y]);
      if (!Array.isArray(hasil) || hasil.length !== 2 || !hasil.every((n) => typeof n === "number" && Number.isFinite(n))) {
        throw new Error('gerak(...) harus mengembalikan array dua angka, contoh: return [50, 50];');
      }
      const [kiri, kanan] = hasil;
      state.kecepatanKiri = kiri;
      state.kecepatanKanan = kanan;
      const langkah = langkahKinematika(state, kiri, kanan, DT_UJI);
      state.x = Math.max(-ARENA_SETENGAH_LEBAR, Math.min(ARENA_SETENGAH_LEBAR, langkah.x));
      state.y = Math.max(-ARENA_SETENGAH_TINGGI, Math.min(ARENA_SETENGAH_TINGGI, langkah.y));
      state.sudut = langkah.sudut;
      state.jejak.push({ x: state.x, y: state.y });
      await new Promise((r) => setTimeout(r, JEDA_ANIMASI_MS));
      const jarakSisa = Math.hypot(state.x - TARGET_POSISI.x, state.y - TARGET_POSISI.y);
      if (jarakSisa <= TOLERANSI_UJI) return { berhasil: true, langkah: i + 1, x: state.x, y: state.y };
    }
    return { berhasil: false, x: state.x, y: state.y, jarakSisa: Math.hypot(state.x - TARGET_POSISI.x, state.y - TARGET_POSISI.y) };
  } finally {
    // Robot berhenti total begitu simulasi selesai (berhasil, gagal, atau error),
    // supaya tidak terus melaju dengan kecepatan roda terakhir yang tersisa.
    state.kecepatanKiri = 0;
    state.kecepatanKanan = 0;
  }
}

export default {
  id: 9,
  judul: "Gerak Robot Dua Roda",
  singkat: "Gerak Robot Dua Roda",
  modul: 3,
  tujuan: "Memahami hubungan antara kecepatan roda kiri dan kanan dengan gerak robot differential drive.",

  panduan: [
    "Atur slider kecepatan roda kiri dan kanan pada rentang −100 sampai 100. Tampilan dari atas menunjukkan posisi, arah hadap, dan jejak lintasan robot.",
    "Pada Level 1, temukan empat pola gerak. Kecepatan roda yang sama menghasilkan gerak lurus. Kecepatan yang sama besar tetapi berlawanan tanda menghasilkan rotasi di tempat. Satu roda diam menghasilkan pivot. Dua roda yang bergerak searah dengan kecepatan berbeda menghasilkan gerak melengkung.",
    "Sebagai latihan tambahan, arahkan robot ke kotak target putus-putus dengan mengatur kedua slider secara manual.",
    "Pada Level 2, buka kartu kode di bawah kanvas. Fungsi gerak(x, y, sudut, targetX, targetY) sudah tersedia di dalam komentar. Baca kodenya, hapus baris '/*' dan '*/', lalu pilih 'Jalankan simulasi menuju target'.",
    "Lab selesai setelah keempat pola gerak ditemukan dan simulasi Level 2 berhasil membawa robot ke target. Parkir manual tidak menggantikan pengujian fungsi pada Level 2.",
  ],

  deskripsiKoding:
    "Fungsi gerak(x, y, sudut, targetX, targetY) sudah disediakan di dalam komentar /* ... */. Hapus baris '/*' dan '*/' agar fungsi aktif. Fungsi menerima posisi serta arah hadap robot dan posisi target, kemudian mengembalikan [kecepatanKiri, kecepatanKanan]. Fungsi dipanggil pada setiap langkah simulasi sampai robot mencapai target atau batas waktu 20 detik tercapai. Tombol 'Jalankan simulasi menuju target' memulai pengujian dari posisi awal.",

  komponen: { gerakRobot: true },

  kontrol: [
    {
      jenis: "slider",
      id: "kecepatanKiri",
      label: "Kecepatan roda kiri",
      min: -100,
      max: 100,
      langkah: 1,
      nilaiAwal: 0,
      satuan: "%",
      terapkan: (state, nilai) => state.setKecepatan(nilai, state.kecepatanKanan),
    },
    {
      jenis: "slider",
      id: "kecepatanKanan",
      label: "Kecepatan roda kanan",
      min: -100,
      max: 100,
      langkah: 1,
      nilaiAwal: 0,
      satuan: "%",
      terapkan: (state, nilai) => state.setKecepatan(state.kecepatanKiri, nilai),
    },
    {
      jenis: "tombol",
      id: "resetJejak",
      label: "Reset jejak dan posisi",
      sekunder: true,
      terapkan: (state) => state.resetPosisi(),
    },
    { jenis: "nilai", id: "vAngka", label: "Kecepatan linier (v)", satuan: "u/s" },
    { jenis: "nilai", id: "omegaAngka", label: "Kecepatan sudut (ω)", satuan: "rad/s" },
    {
      jenis: "rumus",
      id: "rumusKinematika",
      judul: "Kinematika differential drive",
      baris: [
        { id: "v", simbol: "v = (vKanan + vKiri) ÷ 2" },
        { id: "omega", simbol: "ω = (vKanan − vKiri) ÷ L" },
        { id: "pose", simbol: "x, y, sudut diperbarui tiap langkah dari v dan ω" },
      ],
    },
    { jenis: "teks", id: "status" },
  ],

  levelCoding: [1, 2],

  buatState: () => buatGerakRobot(),

  langkah(state, dt) {
    state.langkah(dt);
  },

  pasangKoding(wadah, state) {
    const editor = buatEditor(wadah, { kodeAwal: TEMPLATE_JS });

    const barisTombol = document.createElement("div");
    barisTombol.className = "baris-tombol-koding";
    const tombolUji = document.createElement("button");
    tombolUji.type = "button";
    tombolUji.className = "tombol";
    tombolUji.textContent = "Jalankan simulasi menuju target";
    barisTombol.append(tombolUji);
    wadah.append(barisTombol);

    const hasilEl = document.createElement("div");
    hasilEl.className = "hasil-koding";
    wadah.append(hasilEl);

    const runner = buatRunner();

    tombolUji.addEventListener("click", async () => {
      // Kartu kode ada jauh di bawah kanvas, jadi geser tampilan ke kanvas dulu
      // supaya robot yang bergerak langsung terlihat tanpa perlu scroll manual.
      document.getElementById("kanvasLab")?.scrollIntoView({ behavior: "smooth", block: "center" });
      tombolUji.disabled = true;
      hasilEl.innerHTML = "";
      const status = document.createElement("div");
      status.className = "baris-uji-koding";
      status.textContent = "Menjalankan simulasi…";
      hasilEl.append(status);
      try {
        await runner.muatKode(editor.ambilKode());
        const hasil = await jalankanSimulasiUji(runner, state);
        hasilEl.innerHTML = "";
        const baris = document.createElement("div");
        baris.className = `baris-uji-koding ${hasil.berhasil ? "lulus" : "gagal"}`;
        const tanda = document.createElement("span");
        tanda.className = "tanda-uji-koding";
        tanda.textContent = hasil.berhasil ? "✓" : "✗";
        const teks = document.createElement("span");
        teks.textContent = hasil.berhasil
          ? `Robot sampai ke target dalam ${hasil.langkah} langkah simulasi.`
          : `Robot belum sampai target dalam 20 detik simulasi. Sisa jarak ${hasil.jarakSisa.toFixed(1)}.`;
        baris.append(tanda, teks);
        hasilEl.append(baris);
        state.level2Lulus = hasil.berhasil;
      } catch (err) {
        hasilEl.innerHTML = "";
        const kotak = document.createElement("div");
        kotak.className = "pesan-galat-koding";
        kotak.textContent = err?.message ?? String(err);
        hasilEl.append(kotak);
      } finally {
        tombolUji.disabled = false;
      }
    });
  },

  perbaruiPanel(panel, state) {
    panel.setAngka("vAngka", state.v.toFixed(1));
    panel.setAngka("omegaAngka", state.omega.toFixed(2));
    panel.setRumus("rumusKinematika", "v", `= (${state.kecepatanKanan} + ${state.kecepatanKiri}) ÷ 2 %  → v = ${state.v.toFixed(1)} u/s`);
    panel.setRumus("rumusKinematika", "omega", `= (${state.kecepatanKanan} − ${state.kecepatanKiri}) ÷ 40  → ω = ${state.omega.toFixed(2)} rad/s`);
    panel.setRumus("rumusKinematika", "pose", `x = ${state.x.toFixed(0)}, y = ${state.y.toFixed(0)}, sudut = ${((state.sudut * 180) / Math.PI).toFixed(0)}°`);

    const p = state.polaTercapai;
    const semuaPola = p.lurus && p.rotasiTempat && p.pivot && p.melengkung;
    const tahapKode = state.level2Lulus
      ? "Level 2 ✓ (lab selesai)"
      : semuaPola
        ? "Level 2 belum lulus. Lengkapi gerak(...), lalu jalankan simulasi menuju target"
        : "temukan dulu keempat pola gerak";
    panel.setTeks(
      "status",
      `Pola ditemukan · lurus ${p.lurus ? "✓" : "…"} · rotasi ${p.rotasiTempat ? "✓" : "…"} · pivot ${p.pivot ? "✓" : "…"} · melengkung ${p.melengkung ? "✓" : "…"}${semuaPola ? " · keempatnya tercapai" : ""} · parkir manual ${state.parkirTercapai ? "✓" : "belum"} · ${tahapKode}`,
    );
  },

  // Menemukan pola & parkir manual saja tidak lagi cukup — peserta wajib
  // mencoba dan berhasil membuat gerak(...) sendiri membawa robot ke target.
  kriteriaSelesai: [
    { id: "lurus", label: "Temukan pola gerak lurus", cek: (state) => state.polaTercapai.lurus },
    { id: "rotasiTempat", label: "Temukan pola rotasi di tempat", cek: (state) => state.polaTercapai.rotasiTempat },
    { id: "pivot", label: "Temukan pola pivot (satu roda diam)", cek: (state) => state.polaTercapai.pivot },
    { id: "melengkung", label: "Temukan pola manuver melengkung", cek: (state) => state.polaTercapai.melengkung },
    { id: "level2", label: "Fungsi gerak(...) berhasil membawa robot ke target", cek: (state) => state.level2Lulus },
  ],
};
