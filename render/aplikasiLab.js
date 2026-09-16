/*
 * Orkestrator halaman lab (lab.html?lab=N):
 * membaca parameter URL, memuat definisi lab, merakit panel dan kanvas,
 * menjalankan loop simulasi, dan mencatat kriteria selesai ke localStorage.
 */

import { daftarLab } from "../labs/daftar.js";
import { labSelesai, tandaiSelesai } from "../util/penyimpanan.js";
import { siapkanKanvas, mulaiLoop } from "./kanvas.js";
import { bangunKontrol, isiPanduan, isiChecklist } from "./panel.js";
import {
  gambarRangkaianLED,
  gambarRangkaianPull,
  gambarRangkaianResistor,
  gambarPotensiometer,
  gambarPhotodiode,
  gambarSensorPermukaan,
  gambarArraySensor,
} from "./rangkaianView.js";
import { gambarDriverMotor } from "./motorView.js";
import { gambarGerakRobot } from "./robotView.js";
import { gambarRobotLintasan } from "./lintasanView.js";
import { gambarRobotPID } from "./pidView.js";
import { gambarKonsepPiksel, gambarThresholding, gambarFrameRegion } from "./kameraView.js";
import { gambarRobotKamera, gambarEksperimen } from "./kameraRobotView.js";

const parameter = new URLSearchParams(location.search);
const idLab = Number(parameter.get("lab"));
const info = daftarLab.find((l) => l.id === idLab);

if (!info) {
  // tanpa parameter atau id tidak dikenal → kembali ke beranda
  location.replace("index.html");
} else if (!info.tersedia) {
  tampilkanBelumTersedia(info);
} else {
  muatLab(info);
}

function tampilkanBelumTersedia(info) {
  document.title = `Lab ${info.id} · Robotics Vision Journey`;
  document.getElementById("judulLab").textContent = `Lab ${info.id}: ${info.singkat}`;
  document.getElementById("tujuanLab").textContent = "Belum tersedia";
  const utama = document.querySelector("main");
  utama.innerHTML = "";
  utama.classList.remove("tata-lab");

  const pesan = document.createElement("div");
  pesan.className = "pesan-tengah";
  const judul = document.createElement("h1");
  judul.textContent = `Lab ${info.id}: ${info.singkat}`;
  const isi = document.createElement("p");
  isi.textContent = "Lab ini masih disiapkan. Silakan kembali ke beranda dan coba lab yang sudah tersedia.";
  const tautan = document.createElement("a");
  tautan.className = "tombol";
  tautan.href = "index.html";
  tautan.textContent = "Kembali ke Beranda";
  pesan.append(judul, isi, tautan);
  utama.append(pesan);
}

async function muatLab(info) {
  const { default: lab } = await import(`../labs/${info.berkas}`);

  document.title = `Lab ${lab.id}: ${lab.judul} · Robotics Vision Journey`;
  document.getElementById("judulLab").textContent = `Lab ${lab.id}: ${lab.judul}`;
  document.getElementById("tujuanLab").textContent = lab.tujuan;

  const lencana = document.getElementById("lencanaSelesai");
  const kotakSelesai = document.getElementById("kotakSelesai");
  let sudahSelesai = labSelesai(lab.id);
  if (sudahSelesai) lencana.hidden = false;

  const state = lab.buatState();

  const panel = bangunKontrol(
    document.getElementById("isiKontrol"),
    lab.kontrol,
    (kontrol, nilai) => kontrol.terapkan?.(state, nilai),
  );
  isiPanduan(document.getElementById("isiPanduan"), lab.panduan);
  const checklist = isiChecklist(document.getElementById("isiChecklist"), lab.kriteriaSelesai);
  // kriteriaSelesai (kalau ada) adalah satu-satunya sumber kebenaran kriteria
  // selesai — checklist dan penandaan "lab selesai" selalu sinkron, tidak
  // mungkin salah satu bilang selesai sementara yang lain belum.
  const selesaiJika = lab.kriteriaSelesai ? (state) => lab.kriteriaSelesai.every((k) => k.cek(state)) : lab.selesaiJika;

  const kanvas = document.getElementById("kanvasLab");
  const { ctx, ukuran } = siapkanKanvas(kanvas, lab.rasioKanvas ?? 0.6);
  lab.pasangInteraksi?.(kanvas, state);

  if (lab.levelCoding?.includes(2) && lab.pasangKoding) {
    const kartuKoding = document.getElementById("kartuKoding");
    kartuKoding.hidden = false;
    const levelLanjut = lab.levelCoding.filter((n) => n > 1);
    document.getElementById("judulKoding").textContent =
      levelLanjut.length > 1 ? `Level ${levelLanjut.join(" dan ")}: Tulis Kode` : "Level 2: Tulis Kode";
    if (lab.deskripsiKoding) {
      const deskripsi = document.getElementById("deskripsiKoding");
      deskripsi.textContent = lab.deskripsiKoding;
      deskripsi.hidden = false;
    }
    lab.pasangKoding(document.getElementById("isiKoding"), state);
  }

  function cekSelesai() {
    if (sudahSelesai || !selesaiJika(state)) return;
    sudahSelesai = true;
    tandaiSelesai(lab.id);
    lencana.hidden = false;
    kotakSelesai.textContent = "Lab selesai! Progres tersimpan, silakan lanjut bereksplorasi atau kembali ke beranda.";
    kotakSelesai.hidden = false;
  }

  mulaiLoop({
    langkah: lab.langkah ? (dt) => lab.langkah(state, dt) : null,
    gambar: (waktu) => {
      if (lab.komponen?.rangkaianLED) {
        gambarRangkaianLED(ctx, state, ukuran(), waktu);
      } else if (lab.komponen?.rangkaianPull) {
        gambarRangkaianPull(ctx, state, ukuran(), waktu);
      } else if (lab.komponen?.rangkaianResistor) {
        gambarRangkaianResistor(ctx, state, ukuran(), waktu);
      } else if (lab.komponen?.potensiometer) {
        gambarPotensiometer(ctx, state, ukuran());
      } else if (lab.komponen?.photodiode) {
        gambarPhotodiode(ctx, state, ukuran());
      } else if (lab.komponen?.sensorPermukaan) {
        gambarSensorPermukaan(ctx, state, ukuran());
      } else if (lab.komponen?.arraySensor) {
        gambarArraySensor(ctx, state, ukuran());
      } else if (lab.komponen?.driverMotor) {
        gambarDriverMotor(ctx, state, ukuran(), waktu);
      } else if (lab.komponen?.gerakRobot) {
        gambarGerakRobot(ctx, state, ukuran());
      } else if (lab.komponen?.simulasiLintasan) {
        gambarRobotLintasan(ctx, state, ukuran());
      } else if (lab.komponen?.simulasiPID) {
        gambarRobotPID(ctx, state, ukuran());
      } else if (lab.komponen?.konsepPiksel) {
        gambarKonsepPiksel(ctx, state, ukuran());
      } else if (lab.komponen?.thresholding) {
        gambarThresholding(ctx, state, ukuran());
      } else if (lab.komponen?.frameRegion) {
        gambarFrameRegion(ctx, state, ukuran());
      } else if (lab.komponen?.simulasiKamera) {
        gambarRobotKamera(ctx, state, ukuran());
      } else if (lab.komponen?.eksperimen) {
        gambarEksperimen(ctx, state, ukuran());
      }
      lab.perbaruiPanel?.(panel, state);
      checklist?.perbarui(state, sudahSelesai);
      cekSelesai();
    },
  });
}
