/*
 * Menggambar frame kamera sebagai grid piksel (Lab 12), hasil thresholding
 * berdampingan dengan histogram (Lab 13), dan overlay 8 region (Lab 14/15).
 */

import { warnaToken } from "./kanvas.js";
import { FRAME_LEBAR, FRAME_TINGGI, JUMLAH_REGION } from "../engine/kamera.js";

/** Geometri grid piksel — dipakai bersama gambar & hit-test hover/klik, satu sumber kebenaran. */
export function geometriFrame(lebar, tinggi, zoom) {
  const baseSize = Math.min(lebar / FRAME_LEBAR, tinggi / FRAME_TINGGI);
  const pixelSize = baseSize * zoom;
  const frameLebarPx = FRAME_LEBAR * pixelSize;
  const frameTinggiPx = FRAME_TINGGI * pixelSize;
  return {
    pixelSize,
    offsetX: (lebar - frameLebarPx) / 2,
    offsetY: (tinggi - frameTinggiPx) / 2,
  };
}

/** Kolom/baris piksel di bawah titik (x,y) kanvas, atau null kalau di luar frame. */
export function pikselDiTitik(lebar, tinggi, zoom, x, y) {
  const { pixelSize, offsetX, offsetY } = geometriFrame(lebar, tinggi, zoom);
  const kolom = Math.floor((x - offsetX) / pixelSize);
  const baris = Math.floor((y - offsetY) / pixelSize);
  if (kolom < 0 || kolom >= FRAME_LEBAR || baris < 0 || baris >= FRAME_TINGGI) return null;
  return { kolom, baris };
}

export function gambarGridPiksel(ctx, frame, viewport, zoom, pilihan) {
  const { x: vx, y: vy, lebar, tinggi } = viewport;
  const { pixelSize, offsetX, offsetY } = geometriFrame(lebar, tinggi, zoom);

  ctx.save();
  ctx.beginPath();
  ctx.rect(vx, vy, lebar, tinggi);
  ctx.clip();
  ctx.translate(vx, vy);

  for (let b = 0; b < FRAME_TINGGI; b++) {
    const y = offsetY + b * pixelSize;
    if (y + pixelSize < 0 || y > tinggi) continue;
    for (let k = 0; k < FRAME_LEBAR; k++) {
      const x = offsetX + k * pixelSize;
      if (x + pixelSize < 0 || x > lebar) continue;
      const v = frame[b][k];
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
      if (pixelSize > 4) {
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, pixelSize - 1, pixelSize - 1);
      }
    }
  }

  if (pilihan) {
    const x = offsetX + pilihan.kolom * pixelSize;
    const y = offsetY + pilihan.baris * pixelSize;
    ctx.strokeStyle = warnaToken("--oranye");
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, pixelSize, pixelSize);
    if (pixelSize > 26) {
      const nilai = frame[pilihan.baris][pilihan.kolom];
      ctx.fillStyle = nilai < 128 ? "#ffffff" : "#000000";
      ctx.font = `700 ${Math.min(15, pixelSize * 0.32)}px ${getComputedStyle(document.documentElement).getPropertyValue("--font-utama")}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(nilai), x + pixelSize / 2, y + pixelSize / 2);
    }
  }
  ctx.restore();
}

/** Lab 12: satu frame besar, di-zoom, piksel yang dipilih tersorot dengan angka nilainya. */
export function gambarKonsepPiksel(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  gambarGridPiksel(ctx, state.frame, { x: 0, y: 0, lebar, tinggi }, state.zoom, state.pilihan);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  ctx.fillStyle = warnaToken("--teks-lembut");
  ctx.font = `600 12px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`zoom ${state.zoom.toFixed(1)}×`, 10, tinggi - 10);
}

/** Histogram nilai grayscale (32 bin) + garis ambang — dipakai Lab 13. */
function gambarHistogram(ctx, frame, ambang, { x, y, lebar, tinggi, fontUtama }) {
  if (tinggi < 40) return;
  const JUMLAH_BIN = 32;
  const lebarBin = 256 / JUMLAH_BIN;
  const hitung = new Array(JUMLAH_BIN).fill(0);
  for (const baris of frame) for (const v of baris) hitung[Math.min(JUMLAH_BIN - 1, Math.floor(v / lebarBin))] += 1;
  const maksHitung = Math.max(...hitung, 1);

  const warnaBar = warnaToken("--teks-lembut");
  const warnaAmbang = warnaToken("--oranye");
  const lebarBar = lebar / JUMLAH_BIN;
  hitung.forEach((h, i) => {
    const tinggiBar = (h / maksHitung) * (tinggi - 18);
    ctx.fillStyle = warnaBar;
    ctx.fillRect(x + i * lebarBar, y + (tinggi - 18) - tinggiBar, lebarBar - 1, tinggiBar);
  });

  const xAmbang = x + (ambang / 256) * lebar;
  ctx.strokeStyle = warnaAmbang;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(xAmbang, y);
  ctx.lineTo(xAmbang, y + tinggi - 18);
  ctx.stroke();

  ctx.fillStyle = warnaToken("--teks-lembut");
  ctx.font = `600 10px ${fontUtama}`;
  ctx.textAlign = "left";
  ctx.fillText("0 (hitam)", x, y + tinggi - 4);
  ctx.textAlign = "right";
  ctx.fillText("255 (putih)", x + lebar, y + tinggi - 4);
  ctx.textAlign = "center";
  ctx.fillStyle = warnaAmbang;
  ctx.font = `700 11px ${fontUtama}`;
  ctx.fillText(`threshold ${Math.round(ambang)}`, xAmbang, y - 4);
}

/** Lab 13: frame asli dan hasil biner berdampingan di atas, histogram + garis ambang di bawah. */
export function gambarThresholding(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");

  const tinggiAtas = tinggi * 0.62;
  const celah = 10;
  const lebarPanel = (lebar - celah) / 2;
  // Label judul panel dapat jatah tinggi TETAP di atas grid, bukan mengandalkan
  // letterbox offset geometriFrame (yang menyusut kalau kanvas sempit, misalnya
  // di layar HP) — supaya labelnya tidak pernah bersentuhan dengan grid.
  const LABEL_TINGGI = 18;
  const tinggiGrid = tinggiAtas - LABEL_TINGGI;

  gambarGridPiksel(ctx, state.frame, { x: 0, y: LABEL_TINGGI, lebar: lebarPanel, tinggi: tinggiGrid }, 1, null);
  const frameBiner01 = state.frameBiner.map((baris) => baris.map((b) => (b ? 0 : 255)));
  gambarGridPiksel(ctx, frameBiner01, { x: lebarPanel + celah, y: LABEL_TINGGI, lebar: lebarPanel, tinggi: tinggiGrid }, 1, null);

  ctx.fillStyle = warnaToken("--teks-lembut");
  ctx.font = `600 11px ${fontUtama}`;
  ctx.textAlign = "center";
  ctx.fillText("asli (grayscale)", lebarPanel / 2, LABEL_TINGGI - 4);
  ctx.fillText("hasil threshold (biner)", lebarPanel + celah + lebarPanel / 2, LABEL_TINGGI - 4);

  gambarHistogram(ctx, state.frame, state.ambang, { x: lebar * 0.04, y: tinggiAtas + 12, lebar: lebar * 0.92, tinggi: tinggi - tinggiAtas - 16, fontUtama });
}

/** Lab 14: frame dengan overlay 8 kolom region + bar chart nilai ADC tiap region. */
export function gambarFrameRegion(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaAktif = warnaToken("--oranye");
  const warnaKisi = warnaToken("--abu-garis");

  // tinggiAtas mengikuti rasio asli frame (FRAME_LEBAR:FRAME_TINGGI) supaya
  // frame mengisi penuh lebar kanvas alih-alih menyusut jadi kotak sempit
  // di tengah dengan banyak ruang kosong di kiri-kanan (geometriFrame
  // membatasi ukuran gambar ke rasio ASLI-nya, tinggiAtas yang jauh lebih
  // lebar dari rasio itu cuma membuang-buang ruang) — dibatasi maksimal 70%
  // tinggi kanvas supaya bar chart di bawahnya tetap kebagian ruang cukup.
  const tinggiAtas = Math.min(lebar * (FRAME_TINGGI / FRAME_LEBAR), tinggi * 0.7);
  gambarGridPiksel(ctx, state.frame, { x: 0, y: 0, lebar, tinggi: tinggiAtas }, 1, null);

  // ---- garis pembatas 8 region ----
  const { pixelSize, offsetX, offsetY } = geometriFrame(lebar, tinggiAtas, 1);
  ctx.strokeStyle = warnaAktif;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  for (let r = 1; r < JUMLAH_REGION; r++) {
    const x = offsetX + (r * FRAME_LEBAR * pixelSize) / JUMLAH_REGION;
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + FRAME_TINGGI * pixelSize);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ---- bar chart 8 nilai region, gaya sama dengan Lab 7 ----
  const adc = state.regionADC;
  const yZona2 = tinggiAtas + 26; // jarak dari tepi bawah frame — cukup untuk judul 12px tanpa bersentuhan dengan grid di atasnya
  const tinggiZona2 = tinggi - yZona2 - 22;
  if (tinggiZona2 > 40) {
    const margin = lebar * 0.06;
    const xPlot = margin + 20;
    const lebarPlot = lebar - margin - xPlot;
    const yDasar = yZona2 + tinggiZona2;
    const ADC_MAKS = 1023;

    ctx.textAlign = "right";
    ctx.font = `600 10px ${fontUtama}`;
    for (let k = 0; k <= 4; k++) {
      const nilai = (ADC_MAKS / 4) * k;
      const yGrid = yDasar - (nilai / ADC_MAKS) * tinggiZona2;
      ctx.strokeStyle = warnaKisi;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xPlot, yGrid);
      ctx.lineTo(xPlot + lebarPlot, yGrid);
      ctx.stroke();
      ctx.fillStyle = warnaLabel;
      ctx.fillText(Math.round(nilai).toString(), xPlot - 6, yGrid + 3);
    }

    const lebarBar = (lebarPlot / JUMLAH_REGION) * 0.6;
    ctx.textAlign = "center";
    for (let r = 0; r < JUMLAH_REGION; r++) {
      const xB = xPlot + (lebarPlot * (r + 0.5)) / JUMLAH_REGION;
      const tinggiB = (adc[r] / ADC_MAKS) * tinggiZona2;
      ctx.fillStyle = warnaAktif;
      ctx.fillRect(xB - lebarBar / 2, yDasar - tinggiB, lebarBar, tinggiB);
      ctx.font = `600 10px ${fontUtama}`;
      ctx.fillStyle = warnaLabel;
      ctx.fillText(`R${r}`, xB, yDasar + 14);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = warnaTeks;
    ctx.font = `700 12px ${fontUtama}`;
    ctx.fillText("nilai ADC tiap region, ditampilkan seperti diagram batang sensor pada Lab 7", xPlot, yZona2 - 6);
  }
}

export { FRAME_LEBAR, FRAME_TINGGI, JUMLAH_REGION };
