/*
 * Menggambar robot di lintasan 2D — dipakai Lab 10, 11, 15, 16 (semuanya
 * memakai state dari engine/simulasiLintasan.js). Lintasan, batang sensor,
 * jejak berwarna hijau/merah, dan badan robot memakai geometri yang sama
 * dengan render/robotView.js supaya konsisten secara visual di seluruh modul.
 */

import { warnaToken } from "./kanvas.js";
import { LEBAR_GARIS_LINTASAN } from "../engine/lintasan.js";
import { posisiSensorDiPose } from "../engine/simulasiLintasan.js";
import { SENSOR_JUMLAH, ADC_MAKS } from "../engine/rangkaian.js";
import { ROBOT_JEJARI, ROBOT_LEBAR_RODA } from "../engine/robot.js";

// Nilai dasar cukup untuk lintasan lurus, belokan halus, dan tajam — tapi
// lintasan zigzag jari-jarinya bisa sampai R0+AMPLITUDO=172 (lihat
// engine/lintasan.js), lebih besar dari SETENGAH_TINGGI_VIEW_DASAR=120, jadi
// kalau dipaksa pakai nilai dasar ini bagian atas-bawah bentuk bintangnya
// terpotong di luar kanvas. batasView() menghitung bentangan sungguhan tiap
// lintasan dan hanya membesarkan nilai dasar kalau memang perlu, supaya
// tampilan tiga lintasan lain tidak berubah sama sekali.
const SETENGAH_LEBAR_VIEW_DASAR = 250;
const SETENGAH_TINGGI_VIEW_DASAR = 120;
const MARGIN_TEPI_LINTASAN = 30; // ruang ekstra di luar tepi lintasan untuk badan robot dan batang sensor

function batasView(lintasan) {
  let maksX = 0;
  let maksY = 0;
  for (const t of lintasan.titik) {
    maksX = Math.max(maksX, Math.abs(t.x));
    maksY = Math.max(maksY, Math.abs(t.y));
  }
  return {
    setengahLebar: Math.max(SETENGAH_LEBAR_VIEW_DASAR, maksX + MARGIN_TEPI_LINTASAN),
    setengahTinggi: Math.max(SETENGAH_TINGGI_VIEW_DASAR, maksY + MARGIN_TEPI_LINTASAN),
  };
}

export function skalaLintasan(lebar, tinggi, lintasan) {
  const margin = 26;
  const { setengahLebar, setengahTinggi } = batasView(lintasan);
  return Math.min((lebar - margin * 2) / (setengahLebar * 2), (tinggi - margin * 2) / (setengahTinggi * 2));
}

export function keLayarLintasan(lebar, tinggi, lintasan, x, y) {
  const skala = skalaLintasan(lebar, tinggi, lintasan);
  return { x: lebar / 2 + x * skala, y: tinggi / 2 - y * skala, skala };
}

/**
 * Gambar robot + lintasan + jejak. opsi.overlaySensor: tampilkan batang
 * sensor dengan titik gelap/terang tiap sensor (dipakai Lab 10/11, dimatikan
 * di Lab 15/16 mode kamera supaya tidak membingungkan dengan overlay region kamera).
 * opsi.viewport: gambar di sub-area kanvas {x,y,lebar,tinggi} alih-alih penuh
 * (dipakai Lab 11 untuk menyisakan ruang grafik error di bawahnya) — kalau
 * diisi, pemanggil bertanggung jawab membersihkan kanvas sendiri sekali di awal.
 */
export function gambarRobotLintasan(ctx, state, ukuranPenuh, opsi = {}) {
  const { overlaySensor = true, viewport = null } = opsi;
  if (!viewport) ctx.clearRect(0, 0, ukuranPenuh.lebar, ukuranPenuh.tinggi);

  ctx.save();
  if (viewport) ctx.translate(viewport.x, viewport.y);
  const { lebar, tinggi } = viewport ?? ukuranPenuh;

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaLintasan = warnaToken("--lintasan");
  const warnaHijau = warnaToken("--hijau");
  const warnaMerah = warnaToken("--merah");
  const warnaBadan = warnaToken("--robot-badan");
  const warnaRoda = warnaToken("--robot-roda");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const lintasan = state.lintasanAktif;
  const skala = skalaLintasan(lebar, tinggi, lintasan);

  // ---- lintasan: garis tebal mengikuti lebar garis sungguhan ----
  ctx.strokeStyle = warnaLintasan;
  ctx.lineWidth = Math.max(2, LEBAR_GARIS_LINTASAN * skala);
  ctx.beginPath();
  lintasan.titik.forEach((t, i) => {
    const p = keLayarLintasan(lebar, tinggi, lintasan, t.x, t.y);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  if (lintasan.tertutup) ctx.closePath();
  ctx.stroke();

  // ---- jejak robot: hijau saat di jalur, merah saat melenceng ----
  const jejak = state.jejak;
  ctx.lineWidth = 2.5;
  for (let i = 1; i < jejak.length; i++) {
    const a = keLayarLintasan(lebar, tinggi, lintasan, jejak[i - 1].x, jejak[i - 1].y);
    const b = keLayarLintasan(lebar, tinggi, lintasan, jejak[i].x, jejak[i].y);
    ctx.strokeStyle = jejak[i].diJalur ? warnaHijau : warnaMerah;
    ctx.globalAlpha = 0.25 + 0.6 * (i / jejak.length);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ---- batang sensor + delapan titik gelap/terang ----
  if (overlaySensor) {
    const adc = state.sensorADC;
    for (let i = 0; i < SENSOR_JUMLAH; i++) {
      const dunia = posisiSensorDiPose(state.x, state.y, state.sudut, i);
      const p = keLayarLintasan(lebar, tinggi, lintasan, dunia.x, dunia.y);
      const gelap = 1 - adc[i] / ADC_MAKS;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = warnaToken("--putih-kartu");
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.15 + gelap * 0.85; // gelap penuh saat di atas garis hitam, nyaris tak terlihat saat di atas putih
      ctx.fillStyle = warnaToken("--teks");
      ctx.fill();
      ctx.restore();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = warnaLabel;
      ctx.stroke();
    }
  }

  // ---- badan robot ----
  const p = keLayarLintasan(lebar, tinggi, lintasan, state.x, state.y);
  const jari = ROBOT_JEJARI * skala;
  const setengahLebarRoda = (ROBOT_LEBAR_RODA / 2) * skala;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-state.sudut);
  ctx.fillStyle = warnaRoda;
  for (const dy of [-setengahLebarRoda - 4, setengahLebarRoda + 4]) {
    ctx.beginPath();
    ctx.roundRect(-jari * 0.5, dy - 4, jari, 8, 3);
    ctx.fill();
  }
  ctx.fillStyle = state.diJalur ? warnaBadan : warnaMerah;
  ctx.beginPath();
  ctx.roundRect(-jari, -jari * 0.7, jari * 2, jari * 1.4, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(jari * 0.9, 0);
  ctx.lineTo(jari * 0.3, -jari * 0.35);
  ctx.lineTo(jari * 0.3, jari * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- status ringkas ----
  ctx.fillStyle = warnaTeks;
  ctx.font = `700 12px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.fillText(`error ${state.error.toFixed(1)} · keluar jalur ${state.jumlahKeluarJalur}× · waktu ${state.waktuTempuh.toFixed(1)}s`, 10, 18);
  if (lintasan.tertutup) {
    ctx.fillStyle = state.satuPutaranTercapai ? warnaHijau : warnaLabel;
    ctx.font = `600 11px ${fontUtama}`;
    ctx.fillText(state.satuPutaranTercapai ? "satu putaran ✓ selesai" : "menyelesaikan satu putaran…", 10, 34);
  }
  ctx.textAlign = "center";
  ctx.restore();
}
