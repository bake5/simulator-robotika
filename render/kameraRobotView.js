/*
 * Lab 15/16 (mode kamera) — layout sama dengan render/pidView.js: robot di
 * lintasan di area utama, grafik error di bawah. Pandangan kamera robot
 * (frame + garis pembagi 8 region) digambar di KOLOM TERPISAH di sisi kanan,
 * bukan ditumpuk di atas gambar lintasan — lintasan (apalagi yang bentuknya
 * memenuhi seluruh area seperti tajam/zigzag) sering punya bagian yang
 * lewat tepat di pojok kanan atas, jadi kalau panel kamera ditumpuk di
 * situ, bagian lintasannya ketutupan. Makanya lebar gambar lintasan sendiri
 * dipersempit supaya kolom kamera punya tempat sendiri yang kosong.
 */

import { warnaToken } from "./kanvas.js";
import { gambarRobotLintasan } from "./lintasanView.js";
import { gambarGrafikError } from "./pidView.js";
import { gambarGridPiksel } from "./kameraView.js";
import { bacaFrameKameraTampilan } from "../engine/kameraRobot.js";
import { JUMLAH_REGION, FRAME_LEBAR, FRAME_TINGGI } from "../engine/kamera.js";

const KOLOM_KAMERA_LEBAR_RASIO = 0.27; // porsi lebar kanvas untuk kolom kamera
const KOLOM_KAMERA_MARGIN = 14;
const LABEL_TINGGI = 16;

/** Lebar gambar lintasan yang tersisa setelah kolom kamera disisihkan di sisi kanan (0 kalau kolom kamera tidak ditampilkan). */
function lebarLintasan(lebar, tampilkanKamera) {
  return tampilkanKamera ? lebar - lebar * KOLOM_KAMERA_LEBAR_RASIO : lebar;
}

/** Panel pandangan kamera (frame + garis pembagi 8 region) di kolom kanan, terpisah dari gambar lintasan — satu implementasi dipakai Lab 15 dan Lab 16 mode kamera. */
function gambarPanelKamera(ctx, state, lebar, tinggiAtas, fontUtama) {
  const kolomLebar = lebar * KOLOM_KAMERA_LEBAR_RASIO;
  const kolomX = lebar - kolomLebar;
  const panelLebar = kolomLebar - KOLOM_KAMERA_MARGIN * 2;
  const panelX = kolomX + KOLOM_KAMERA_MARGIN;
  const panelY = KOLOM_KAMERA_MARGIN + LABEL_TINGGI;
  const panelTinggiMaks = tinggiAtas - panelY - KOLOM_KAMERA_MARGIN;
  const panelTinggi = Math.min(panelLebar * (FRAME_TINGGI / FRAME_LEBAR), panelTinggiMaks);

  ctx.fillStyle = warnaToken("--teks-lembut");
  ctx.font = `600 10px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.fillText("citra kamera", panelX, KOLOM_KAMERA_MARGIN + 8);

  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.strokeStyle = warnaToken("--abu-garis");
  ctx.lineWidth = 1.5;
  ctx.fillRect(panelX, panelY, panelLebar, panelTinggi);
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelLebar - 1, panelTinggi - 1);

  const frame = bacaFrameKameraTampilan(state.lintasanAktif, state.x, state.y, state.sudut);
  gambarGridPiksel(ctx, frame, { x: panelX, y: panelY, lebar: panelLebar, tinggi: panelTinggi }, 1, null);

  ctx.strokeStyle = warnaToken("--oranye");
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  const pxSize = Math.min(panelLebar / FRAME_LEBAR, panelTinggi / FRAME_TINGGI);
  const gridLebar = FRAME_LEBAR * pxSize;
  const gridTinggi = FRAME_TINGGI * pxSize;
  const gridX = panelX + (panelLebar - gridLebar) / 2;
  const gridY = panelY + (panelTinggi - gridTinggi) / 2;
  for (let r = 1; r < JUMLAH_REGION; r++) {
    const x = gridX + (r * gridLebar) / JUMLAH_REGION;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, gridY + gridTinggi);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** Lab 16: sama seperti gambarRobotKamera, tapi kolom kamera cuma muncul saat state.mode === "kamera"; mode "photodiode" menampilkan titik sensor seperti Lab 10/11 dan memakai lebar penuh. */
export function gambarEksperimen(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");

  const tinggiAtas = tinggi * 0.62;
  const modeKamera = state.mode === "kamera";
  const lebarLintasanAktif = lebarLintasan(lebar, modeKamera);
  gambarRobotLintasan(ctx, state, ukuran, {
    viewport: { x: 0, y: 0, lebar: lebarLintasanAktif, tinggi: tinggiAtas },
    overlaySensor: !modeKamera,
  });

  if (modeKamera) gambarPanelKamera(ctx, state, lebar, tinggiAtas, fontUtama);

  ctx.fillStyle = warnaToken("--teks");
  ctx.font = `700 12px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.fillText(`mode: ${modeKamera ? "kamera" : "photodiode"}`, 10, tinggiAtas - 16);

  gambarGrafikError(ctx, state.riwayatError ?? [], {
    x: lebar * 0.04,
    y: tinggiAtas + 10,
    lebar: lebar * 0.92,
    tinggi: tinggi - tinggiAtas - 16,
    fontUtama,
  });
}

export function gambarRobotKamera(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");

  const tinggiAtas = tinggi * 0.62;
  const lebarLintasanAktif = lebarLintasan(lebar, true);
  gambarRobotLintasan(ctx, state, ukuran, {
    viewport: { x: 0, y: 0, lebar: lebarLintasanAktif, tinggi: tinggiAtas },
    overlaySensor: false,
  });
  gambarPanelKamera(ctx, state, lebar, tinggiAtas, fontUtama);

  gambarGrafikError(ctx, state.riwayatError, {
    x: lebar * 0.04,
    y: tinggiAtas + 10,
    lebar: lebar * 0.92,
    tinggi: tinggi - tinggiAtas - 16,
    fontUtama,
  });
}
