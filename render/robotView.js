/*
 * Menggambar arena Lab 9 — Gerak Robot Dua Roda: robot tampak atas, jejak
 * lintasan yang memudar, dan kotak target parkir. Sistem koordinat model
 * memakai konvensi matematika (y ke atas, sudut berlawanan jarum jam) —
 * fungsi skalaLayar di bawah yang membalik ke konvensi layar (y ke bawah),
 * dipakai bersama oleh gambar & hit-test supaya keduanya sinkron.
 */

import { warnaToken } from "./kanvas.js";
import { ARENA_SETENGAH_LEBAR, ARENA_SETENGAH_TINGGI, TARGET_POSISI, TARGET_UKURAN, ROBOT_JEJARI, ROBOT_LEBAR_RODA } from "../engine/robot.js";

/** Skala piksel-per-satuan-posisi supaya arena penuh pas di kanvas dengan margin. */
export function skalaArena(lebar, tinggi) {
  const margin = 30;
  return Math.min((lebar - margin * 2) / (ARENA_SETENGAH_LEBAR * 2), (tinggi - margin * 2) / (ARENA_SETENGAH_TINGGI * 2));
}

/** Titik model (x,y) → koordinat layar (piksel kanvas), origin di tengah. */
export function keLayar(lebar, tinggi, x, y) {
  const skala = skalaArena(lebar, tinggi);
  return { x: lebar / 2 + x * skala, y: tinggi / 2 - y * skala, skala };
}

export function gambarGerakRobot(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaKisi = warnaToken("--abu-garis");
  const warnaJejak = warnaToken("--oranye");
  const warnaTarget = warnaToken("--hijau");
  const warnaBadan = warnaToken("--robot-badan");
  const warnaRoda = warnaToken("--robot-roda");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const skala = skalaArena(lebar, tinggi);
  const pusat = keLayar(lebar, tinggi, 0, 0);

  // ---- batas arena ----
  ctx.strokeStyle = warnaKisi;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    pusat.x - ARENA_SETENGAH_LEBAR * skala,
    pusat.y - ARENA_SETENGAH_TINGGI * skala,
    ARENA_SETENGAH_LEBAR * 2 * skala,
    ARENA_SETENGAH_TINGGI * 2 * skala,
  );

  // ---- kotak target parkir ----
  const tPusat = keLayar(lebar, tinggi, TARGET_POSISI.x, TARGET_POSISI.y);
  const tSisi = TARGET_UKURAN * skala;
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = state.parkirTercapai ? warnaTarget : warnaToken("--oranye");
  ctx.lineWidth = 2.5;
  ctx.strokeRect(tPusat.x - tSisi / 2, tPusat.y - tSisi / 2, tSisi, tSisi);
  ctx.setLineDash([]);
  ctx.fillStyle = warnaLabel;
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillText(state.parkirTercapai ? "target ✓ tercapai" : "target parkir", tPusat.x, tPusat.y - tSisi / 2 - 12);

  // ---- jejak lintasan, memudar dari lama (transparan) ke baru (pekat) ----
  const jejak = state.jejak;
  if (jejak.length > 1) {
    for (let i = 1; i < jejak.length; i++) {
      const a = keLayar(lebar, tinggi, jejak[i - 1].x, jejak[i - 1].y);
      const b = keLayar(lebar, tinggi, jejak[i].x, jejak[i].y);
      ctx.globalAlpha = 0.08 + 0.5 * (i / jejak.length);
      ctx.strokeStyle = warnaJejak;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- robot: badan persegi bulat + dua roda + panah arah hadap ----
  const p = keLayar(lebar, tinggi, state.x, state.y);
  const jari = ROBOT_JEJARI * skala;
  const setengahLebarRoda = (ROBOT_LEBAR_RODA / 2) * skala;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-state.sudut); // minus: model berlawanan jarum jam, layar y ke bawah searah jarum jam

  // roda kiri & kanan (kiri robot = +y model = atas layar SEBELUM rotasi, digambar simetris)
  ctx.fillStyle = warnaRoda;
  for (const dy of [-setengahLebarRoda - 4, setengahLebarRoda + 4]) {
    ctx.beginPath();
    ctx.roundRect(-jari * 0.5, dy - 4, jari, 8, 3);
    ctx.fill();
  }

  // badan
  ctx.fillStyle = warnaBadan;
  ctx.beginPath();
  ctx.roundRect(-jari, -jari * 0.7, jari * 2, jari * 1.4, 8);
  ctx.fill();

  // panah kecil menandai arah depan
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(jari * 0.9, 0);
  ctx.lineTo(jari * 0.3, -jari * 0.35);
  ctx.lineTo(jari * 0.3, jari * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- label pola gerak sekarang ----
  const namaPola = {
    lurus: "lurus",
    rotasiTempat: "rotasi di tempat",
    pivot: "pivot",
    melengkung: "manuver melengkung",
    diam: "diam",
  };
  ctx.fillStyle = warnaTeks;
  ctx.font = `700 13px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.fillText(`pola sekarang: ${namaPola[state.pola]}`, 12, 20);
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  const p2 = state.polaTercapai;
  ctx.fillText(
    `ditemukan: lurus ${p2.lurus ? "✓" : "…"} · rotasi ${p2.rotasiTempat ? "✓" : "…"} · pivot ${p2.pivot ? "✓" : "…"} · melengkung ${p2.melengkung ? "✓" : "…"}`,
    12,
    38,
  );
  ctx.textAlign = "center";
}
