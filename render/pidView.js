/*
 * Lab 11 — gabungan tampilan robot+lintasan (bagian atas, dipakai ulang dari
 * render/lintasanView.js) dan grafik error vs waktu real time (bagian bawah).
 * Mode banding menumpuk dua jejak (konfigurasi A dan B) dengan warna berbeda
 * di atas tampilan robot yang sama.
 */

import { warnaToken } from "./kanvas.js";
import { gambarRobotLintasan, keLayarLintasan } from "./lintasanView.js";

const WARNA_A = "--oranye";
const WARNA_B = "--hijau";

function gambarJejakTambahan(ctx, lebar, tinggi, lintasan, jejak, warnaCss) {
  if (!jejak || jejak.length < 2) return;
  ctx.strokeStyle = warnaToken(warnaCss);
  ctx.lineWidth = 2.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  jejak.forEach((titik, i) => {
    const p = keLayarLintasan(lebar, tinggi, lintasan, titik.x, titik.y);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

export function gambarGrafikError(ctx, riwayat, { x, y, lebar, tinggi, fontUtama }) {
  if (tinggi < 40) return;
  ctx.clearRect(x, y, lebar, tinggi);

  const warnaKisi = warnaToken("--abu-garis");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaGaris = warnaToken("--oranye");
  const warnaNol = warnaToken("--teks-lembut");
  const xPlot = x + 34;
  const lebarPlot = lebar - 40;

  ctx.lineWidth = 1;
  ctx.font = `600 10px ${fontUtama}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const nilai of [-100, -50, 0, 50, 100]) {
    const yNilai = y + tinggi / 2 - (nilai / 100) * (tinggi / 2 - 6);
    ctx.strokeStyle = nilai === 0 ? warnaNol : warnaKisi;
    ctx.lineWidth = nilai === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(xPlot, yNilai);
    ctx.lineTo(xPlot + lebarPlot, yNilai);
    ctx.stroke();
    ctx.fillStyle = warnaLabel;
    ctx.fillText(String(nilai), xPlot - 6, yNilai);
  }

  if (riwayat.length >= 2) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = warnaGaris;
    ctx.beginPath();
    riwayat.forEach((err, i) => {
      const xS = xPlot + (i / (riwayat.length - 1)) * lebarPlot;
      const yS = y + tinggi / 2 - (Math.max(-100, Math.min(100, err)) / 100) * (tinggi / 2 - 6);
      if (i === 0) ctx.moveTo(xS, yS);
      else ctx.lineTo(xS, yS);
    });
    ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.fillStyle = warnaLabel;
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillText("error vs waktu", xPlot, y - 6);
  ctx.textAlign = "center";
}

export function gambarRobotPID(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");

  const tinggiAtas = tinggi * 0.62;
  gambarRobotLintasan(ctx, state, ukuran, { viewport: { x: 0, y: 0, lebar, tinggi: tinggiAtas } });

  if (state.jejakBeku) {
    const warnaBeku = state.labelBeku === "A" ? WARNA_A : WARNA_B;
    const warnaAktif = state.targetBanding === "A" ? WARNA_A : WARNA_B;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, lebar, tinggiAtas);
    ctx.clip();
    gambarJejakTambahan(ctx, lebar, tinggiAtas, state.lintasanAktif, state.jejakBeku, warnaBeku);
    ctx.restore();

    ctx.font = `700 11px ${fontUtama}`;
    ctx.textAlign = "right";
    ctx.fillStyle = warnaToken(warnaBeku);
    ctx.fillText(`garis putus: konfigurasi ${state.labelBeku} (sebelumnya)`, lebar - 10, 18);
    ctx.fillStyle = warnaToken(warnaAktif);
    ctx.fillText(`garis penuh: konfigurasi ${state.targetBanding} (sekarang)`, lebar - 10, 34);
    ctx.textAlign = "center";
  }

  gambarGrafikError(ctx, state.riwayatError, {
    x: lebar * 0.04,
    y: tinggiAtas + 10,
    lebar: lebar * 0.92,
    tinggi: tinggi - tinggiAtas - 16,
    fontUtama,
  });
}
