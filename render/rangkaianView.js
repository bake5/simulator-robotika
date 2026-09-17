/*
 * Menggambar skema rangkaian flat untuk Lab 1-8.
 * Saat ini: Lab 1 (baterai — saklar — LED), Lab 2 (meja rakit pull-up/down),
 * Lab 3 (pembagi tegangan dua resistor dengan keluaran Vout),
 * Lab 4 (dial potensiometer yang bisa diputar/diseret + bar tegangan),
 * Lab 5 (photodiode + sumber cahaya yang diseret + ADC besar),
 * Lab 6 (photodiode tetap membaca permukaan bergaris yang diseret + grafik ADC).
 */

import { warnaToken } from "./kanvas.js";
import {
  TEGANGAN_SUMBER,
  PD_JARAK_MIN,
  PD_JARAK_MAKS,
  PD_R_TETAP,
  ADC_MAKS,
  LEBAR_GARIS,
  LEBAR_TRANSISI,
  PERMUKAAN_JANGKAUAN,
  offsetSensor,
} from "../engine/rangkaian.js";

const LEBAR_KAWAT = 3;

// Geometri dial potensiometer — dipakai bersama oleh gambar & hit-test drag
// supaya keduanya selalu sinkron (satu sumber kebenaran, lihat posisiPersenPotensiometer).
const POT_PUSAT_X = 0.5; // rasio terhadap lebar kanvas
const POT_TINGGI_DIAL = 0.68; // rasio tinggi kanvas untuk zona dial (sisanya untuk bar)
const POT_PUSAT_Y = 0.46; // rasio terhadap tinggi zona dial
const POT_SUDUT_MIN = -135; // derajat, diukur searah jarum jam dari arah 12 (atas)
const POT_SUDUT_MAKS = 135;

// Geometri trek sumber cahaya Lab 5 — photodiode tetap di kanan, sumber cahaya
// diseret sepanjang trek ini. Sama-sama dipakai gambar & hit-test drag.
const PD_MARGIN_RASIO = 0.1; // rasio terhadap lebar kanvas, jarak trek dari tepi
const PD_CELAH_MIN_RASIO = 0.14; // jarak minimum sumber cahaya ke photodiode, supaya ikon & label tak tumpang tindih saat jarak = minimum

// Skala piksel-per-satuan-posisi permukaan Lab 6 — dipakai bersama oleh
// gambar & hit-test drag supaya permukaan terasa "menempel" di kursor.
export const SP_SKALA_PIKSEL = 1.7;

function geometriTrekCahaya(lebar) {
  const margin = lebar * PD_MARGIN_RASIO;
  const celahMin = lebar * PD_CELAH_MIN_RASIO;
  const xPhotodiode = lebar - margin;
  const xLightTerdekat = xPhotodiode - celahMin;
  const rentang = xLightTerdekat - margin;
  return { xPhotodiode, xLightTerdekat, rentang };
}

/**
 * Rangkaian persegi: baterai di sisi kiri, saklar di sisi atas, LED di sisi kanan.
 * `waktu` (detik) dipakai untuk animasi titik arus saat rangkaian tertutup.
 */
export function gambarRangkaianLED(ctx, state, ukuran, waktu) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const margin = Math.max(48, lebar * 0.14);
  const x0 = margin;
  const x1 = lebar - margin;
  const y0 = Math.max(40, tinggi * 0.2);
  const y1 = tinggi - Math.max(40, tinggi * 0.22);
  const tengahKiri = (y0 + y1) / 2;
  const tengahAtas = (x0 + x1) / 2;

  const aktif = state.ledNyala;
  const warnaKawatMati = warnaToken("--teks-lembut");
  const warnaKawatHidup = warnaToken("--oranye");
  const warnaKawat = aktif ? warnaKawatHidup : warnaKawatMati;
  const warnaTeks = warnaToken("--teks-lembut");

  const celahBaterai = 26; // celah simbol baterai di sisi kiri
  const celahSaklar = 44; // celah saklar di sisi atas
  const jariLED = Math.max(14, lebar * 0.035);

  ctx.lineWidth = LEBAR_KAWAT;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = warnaKawat;

  // ---- Kawat (empat sisi, dengan celah untuk komponen) ----
  ctx.beginPath();
  // sisi kiri: dua ruas mengapit baterai
  ctx.moveTo(x0, y1);
  ctx.lineTo(x0, tengahKiri + celahBaterai / 2);
  ctx.moveTo(x0, tengahKiri - celahBaterai / 2);
  ctx.lineTo(x0, y0);
  // sisi atas: dua ruas mengapit saklar
  ctx.moveTo(x0, y0);
  ctx.lineTo(tengahAtas - celahSaklar / 2, y0);
  ctx.moveTo(tengahAtas + celahSaklar / 2, y0);
  ctx.lineTo(x1, y0);
  // sisi kanan: dua ruas mengapit LED
  ctx.moveTo(x1, y0);
  ctx.lineTo(x1, tengahKiri - jariLED - 6);
  ctx.moveTo(x1, tengahKiri + jariLED + 6);
  ctx.lineTo(x1, y1);
  // sisi bawah utuh
  ctx.moveTo(x1, y1);
  ctx.lineTo(x0, y1);
  ctx.stroke();

  // ---- Baterai (sisi kiri) ----
  const yPlus = tengahKiri - celahBaterai / 2;
  const yMinus = tengahKiri + celahBaterai / 2;
  ctx.strokeStyle = warnaToken("--teks");
  ctx.beginPath(); // pelat panjang tipis = kutub +
  ctx.lineWidth = 3;
  ctx.moveTo(x0 - 16, yPlus);
  ctx.lineTo(x0 + 16, yPlus);
  ctx.stroke();
  ctx.beginPath(); // pelat pendek tebal = kutub −
  ctx.lineWidth = 7;
  ctx.moveTo(x0 - 8, yMinus);
  ctx.lineTo(x0 + 8, yMinus);
  ctx.stroke();

  ctx.fillStyle = warnaTeks;
  ctx.font = `600 13px ${getComputedStyle(document.documentElement).getPropertyValue("--font-utama")}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("+", x0 - 22, yPlus);
  ctx.fillText("−", x0 - 22, yMinus);
  ctx.textAlign = "center";
  ctx.fillText("Baterai 5V", x0, yMinus + 28);

  // ---- Saklar (sisi atas) ----
  const xPivot = tengahAtas - celahSaklar / 2;
  const xKontak = tengahAtas + celahSaklar / 2;
  const sudutTuas = state.saklar ? 0 : -0.62; // radian; terbuka = terangkat
  ctx.strokeStyle = warnaToken("--teks");
  ctx.lineWidth = LEBAR_KAWAT;
  ctx.beginPath();
  ctx.moveTo(xPivot, y0);
  ctx.lineTo(xPivot + celahSaklar * Math.cos(sudutTuas), y0 + celahSaklar * Math.sin(sudutTuas));
  ctx.stroke();
  ctx.fillStyle = warnaToken("--teks");
  for (const x of [xPivot, xKontak]) {
    ctx.beginPath();
    ctx.arc(x, y0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = warnaTeks;
  ctx.fillText("Saklar", tengahAtas, y0 - 30);

  // ---- LED (sisi kanan) ----
  const yLED = tengahKiri;
  if (aktif) {
    // cahaya lembut: dua lingkaran transparan (tetap flat, tanpa gradasi)
    ctx.fillStyle = warnaToken("--oranye-muda");
    ctx.beginPath();
    ctx.arc(x1, yLED, jariLED * 2.1, 0, Math.PI * 2);
    ctx.fill();
    // sinar pendek di sekeliling
    ctx.strokeStyle = warnaToken("--led-nyala");
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const sudut = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r1 = jariLED * 1.55;
      const r2 = jariLED * 1.95;
      ctx.beginPath();
      ctx.moveTo(x1 + r1 * Math.cos(sudut), yLED + r1 * Math.sin(sudut));
      ctx.lineTo(x1 + r2 * Math.cos(sudut), yLED + r2 * Math.sin(sudut));
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.arc(x1, yLED, jariLED, 0, Math.PI * 2);
  ctx.fillStyle = aktif ? warnaToken("--led-nyala") : warnaToken("--abu-muda");
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = aktif ? warnaToken("--led-nyala") : warnaToken("--teks-lembut");
  ctx.stroke();
  ctx.fillStyle = warnaTeks;
  ctx.fillText("LED", x1, yLED + jariLED + 22);

  // ---- Titik arus mengalir (hanya saat rangkaian tertutup) ----
  if (aktif) {
    gambarTitikArus(ctx, waktu, [
      // searah arus konvensional: + baterai → atas → saklar → LED → bawah → − baterai
      [x0, yPlus],
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, yMinus],
    ]);
  }
}

/**
 * Meja rakit Lab 2: rail VCC di atas, rail GND di bawah, pin sinyal di tengah
 * dengan dua slot resistor, push button ke rail lawan, LED indikator di kanan.
 */
export function gambarRangkaianPull(ctx, state, ukuran, waktu) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaAktif = warnaToken("--oranye");
  const warnaMati = warnaToken("--teks-lembut");
  const warnaAmbang = warnaToken("--merah");

  const xRailKiri = Math.max(44, lebar * 0.1);
  const xRailKanan = lebar - Math.max(120, lebar * 0.3);
  const yVCC = Math.max(42, tinggi * 0.14);
  const yGND = tinggi - Math.max(42, tinggi * 0.14);
  const xPin = xRailKiri + (xRailKanan - xRailKiri) * 0.38;
  const yPin = (yVCC + yGND) / 2;
  const xTombol = xRailKiri + (xRailKanan - xRailKiri) * 0.82;

  const resistor = state.rakitAktif.resistor;
  const keluar = state.output;
  const logika = state.logikaTampak;
  const railTombol = state.mode === "pullup" ? "gnd" : "vcc";
  const yRailTombol = railTombol === "gnd" ? yGND : yVCC;

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.font = `600 13px ${fontUtama}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ---- Rail VCC dan GND ----
  ctx.strokeStyle = warnaTeks;
  ctx.beginPath();
  ctx.moveTo(xRailKiri, yVCC);
  ctx.lineTo(xRailKanan, yVCC);
  ctx.moveTo(xRailKiri, yGND);
  ctx.lineTo(xRailKanan, yGND);
  ctx.stroke();
  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "right";
  ctx.fillText("VCC · 5 V", xRailKiri - 10, yVCC);
  ctx.fillText("GND · 0 V", xRailKiri - 10, yGND);
  ctx.textAlign = "center";

  // ---- Slot resistor atas (pin → VCC) dan bawah (pin → GND) ----
  gambarSlotResistor(ctx, xPin, yVCC + 12, yPin - 14, resistor === "vcc", warnaTeks, warnaLabel, fontUtama);
  gambarSlotResistor(ctx, xPin, yPin + 14, yGND - 12, resistor === "gnd", warnaTeks, warnaLabel, fontUtama);

  // ---- Pin sinyal ----
  ctx.fillStyle = keluar === "AMBANG" ? warnaAmbang : logika ? warnaAktif : warnaMati;
  ctx.beginPath();
  ctx.arc(xPin, yPin, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "right";
  ctx.fillText("pin sinyal", xPin - 14, yPin);
  ctx.textAlign = "center";

  // ---- Push button: cabang dari pin ke rail lawan ----
  const yKontakTombol = yRailTombol === yGND ? yPin + 34 : yPin - 34;
  ctx.strokeStyle = warnaTeks;
  ctx.beginPath();
  ctx.moveTo(xTombol, yPin);
  ctx.lineTo(xTombol, yKontakTombol); // cabang turun/naik dari kawat keluaran ke kontak pertama
  ctx.moveTo(xTombol, yRailTombol === yGND ? yRailTombol - 22 : yRailTombol + 22);
  ctx.lineTo(xTombol, yRailTombol); // dari kontak kedua ke rail
  ctx.stroke();

  const yKontakA = yKontakTombol;
  const yKontakB = yRailTombol === yGND ? yRailTombol - 22 : yRailTombol + 22;
  ctx.fillStyle = warnaTeks;
  for (const y of [yKontakA, yKontakB]) {
    ctx.beginPath();
    ctx.arc(xTombol, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // batang penekan: bergeser mendekat saat ditekan
  const geserTekan = state.tombolDitekan ? 0 : 10;
  ctx.strokeStyle = state.tombolDitekan ? warnaAktif : warnaTeks;
  ctx.beginPath();
  ctx.moveTo(xTombol + 12 + geserTekan, yKontakA);
  ctx.lineTo(xTombol + 12 + geserTekan, yKontakB);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xTombol + 12 + geserTekan, (yKontakA + yKontakB) / 2);
  ctx.lineTo(xTombol + 26 + geserTekan, (yKontakA + yKontakB) / 2);
  ctx.stroke();
  ctx.fillStyle = warnaLabel;
  ctx.fillText(state.tombolDitekan ? "Tombol (ditekan)" : "Tombol", xTombol + 12, (yKontakA + yKontakB) / 2 + (yRailTombol === yGND ? 34 : -34));

  // ---- Keluaran: kawat dari pin ke LED indikator di kanan ----
  const xLED = lebar - Math.max(58, lebar * 0.13);
  ctx.strokeStyle = keluar === "AMBANG" ? warnaAmbang : logika ? warnaAktif : warnaMati;
  if (keluar === "AMBANG") ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(xPin + 6, yPin);
  ctx.lineTo(xLED - 22, yPin);
  ctx.stroke();
  ctx.setLineDash([]);

  const jariLED = 15;
  if (logika && keluar !== "AMBANG") {
    ctx.fillStyle = warnaToken("--oranye-muda");
    ctx.beginPath();
    ctx.arc(xLED, yPin, jariLED * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(xLED, yPin, jariLED, 0, Math.PI * 2);
  ctx.fillStyle = logika ? warnaToken("--led-nyala") : warnaToken("--abu-muda");
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = logika ? warnaToken("--led-nyala") : warnaMati;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("LED indikator", xLED, yPin + jariLED + 20);
  ctx.fillText("(nyala saat HIGH)", xLED, yPin + jariLED + 36);

  // ---- Peringatan pin mengambang ----
  if (keluar === "AMBANG") {
    ctx.fillStyle = warnaAmbang;
    ctx.font = `700 15px ${fontUtama}`;
    ctx.fillText("pin mengambang, pasang resistor!", (xRailKiri + xRailKanan) / 2, yGND + 26);
    ctx.font = `600 13px ${fontUtama}`;
  }
}

/**
 * Ubah posisi horizontal pointer jadi jarak sumber cahaya Lab 5. Photodiode
 * tetap di kanan; menyeret ke kanan = mendekat/terang, ke kiri = menjauh/gelap.
 */
export function posisiJarakDariPointer(kanvas, clientX) {
  const rect = kanvas.getBoundingClientRect();
  const { xLightTerdekat, rentang } = geometriTrekCahaya(rect.width);
  const xLokal = clientX - rect.left;
  const frac = Math.max(0, Math.min(1, (xLightTerdekat - xLokal) / rentang));
  return PD_JARAK_MIN + frac * (PD_JARAK_MAKS - PD_JARAK_MIN);
}

/** Resistor zigzag vertikal — dipakai oleh diagram pembagi tegangan Lab 5. */
function gambarZigzagVertikal(ctx, x, yAwal, yAkhir, warna) {
  const tinggiZig = yAkhir - yAwal;
  const lebarZig = 8;
  ctx.strokeStyle = warna;
  ctx.beginPath();
  ctx.moveTo(x, yAwal);
  for (let i = 0; i < 5; i++) {
    const ya = yAwal + (tinggiZig * (i + 0.25)) / 5;
    const yb = yAwal + (tinggiZig * (i + 0.75)) / 5;
    ctx.lineTo(i % 2 === 0 ? x + lebarZig : x - lebarZig, ya);
    ctx.lineTo(i % 2 === 0 ? x + lebarZig : x - lebarZig, yb);
  }
  ctx.lineTo(x, yAkhir);
  ctx.stroke();
}

/**
 * Photodiode Lab 5: (1) sumber cahaya diseret sepanjang trek menuju photodiode
 * tetap, (2) diagram pembagi tegangan vertikal (VCC-R_PD-tap-R_tetap-GND),
 * (3) angka ADC besar + bar 0-1023. Rantai lengkap cahaya → ADC dalam satu layar.
 */
export function gambarPhotodiode(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaTrek = warnaToken("--abu-garis");
  const warnaAktif = warnaToken("--oranye");
  const warnaCahaya = warnaToken("--led-nyala");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cahaya = state.cahayaEfektif;

  // ================= Zona 1: trek sumber cahaya =================
  const tinggiZona1 = tinggi * 0.36;
  const yTrack = tinggiZona1 * 0.58;
  const margin = lebar * PD_MARGIN_RASIO;
  const { xPhotodiode, xLightTerdekat, rentang } = geometriTrekCahaya(lebar);
  const frac = (state.jarak - PD_JARAK_MIN) / (PD_JARAK_MAKS - PD_JARAK_MIN);
  const xLight = xLightTerdekat - frac * rentang;

  // trek putus-putus
  ctx.strokeStyle = warnaTrek;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(margin, yTrack);
  ctx.lineTo(xPhotodiode, yTrack);
  ctx.stroke();
  ctx.setLineDash([]);

  // sinar cahaya: opasitas mengikuti cahaya efektif yang sampai ke sensor
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.75 * (cahaya / 100);
  ctx.strokeStyle = warnaCahaya;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xLight, yTrack);
  ctx.lineTo(xPhotodiode, yTrack);
  ctx.stroke();
  ctx.restore();

  // ikon sumber cahaya (bola + sinar pendek, gaya sama dengan LED Lab 1)
  const jariLampu = 12;
  ctx.strokeStyle = warnaCahaya;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i++) {
    const sudut = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const r1 = jariLampu * 1.35;
    const r2 = jariLampu * (1.55 + (state.intensitas / 100) * 0.5);
    ctx.beginPath();
    ctx.moveTo(xLight + r1 * Math.cos(sudut), yTrack + r1 * Math.sin(sudut));
    ctx.lineTo(xLight + r2 * Math.cos(sudut), yTrack + r2 * Math.sin(sudut));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(xLight, yTrack, jariLampu, 0, Math.PI * 2);
  ctx.fillStyle = warnaCahaya;
  ctx.fill();
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("sumber cahaya", xLight, yTrack + jariLampu + 22);
  ctx.fillText(`jarak ${Math.round(state.jarak)}`, xLight, yTrack + jariLampu + 38);

  // ikon photodiode tetap: lingkaran + dua anak panah cahaya masuk
  const jariPD = 13;
  ctx.strokeStyle = warnaTeks;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(xPhotodiode, yTrack, jariPD, 0, Math.PI * 2);
  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.fill();
  ctx.stroke();
  for (const dy of [-7, 7]) {
    ctx.beginPath();
    ctx.moveTo(xPhotodiode - jariPD - 16, yTrack + dy - 8);
    ctx.lineTo(xPhotodiode - jariPD - 2, yTrack + dy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xPhotodiode - jariPD - 2, yTrack + dy);
    ctx.lineTo(xPhotodiode - jariPD - 8, yTrack + dy - 5);
    ctx.moveTo(xPhotodiode - jariPD - 2, yTrack + dy);
    ctx.lineTo(xPhotodiode - jariPD - 8, yTrack + dy + 2);
    ctx.stroke();
  }
  ctx.fillStyle = warnaLabel;
  ctx.fillText("photodiode", xPhotodiode, yTrack + jariPD + 22);

  // ================= Zona 2: diagram pembagi tegangan =================
  const yZona2 = tinggiZona1 + 14;
  const tinggiZona2 = tinggi * 0.34;
  const xDivider = lebar * 0.28;
  const yVCC = yZona2 + 10;
  const yGND = yZona2 + tinggiZona2 - 10;
  const yTap = (yVCC + yGND) / 2;
  const celah = 14;

  ctx.font = `600 12px ${fontUtama}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = warnaTeks;
  ctx.beginPath();
  ctx.moveTo(xDivider, yVCC);
  ctx.lineTo(xDivider, yTap - celah);
  ctx.stroke();
  gambarZigzagVertikal(ctx, xDivider, yTap - celah, yTap, warnaAktif);
  ctx.strokeStyle = warnaAktif;
  ctx.beginPath();
  ctx.moveTo(xDivider, yTap);
  ctx.lineTo(xDivider, yTap + celah);
  ctx.stroke();
  gambarZigzagVertikal(ctx, xDivider, yTap + celah, yGND, warnaTeks);

  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "left";
  ctx.fillText(`VCC ${TEGANGAN_SUMBER.toFixed(0)} V`, xDivider + 16, yVCC);
  ctx.fillText(`R_PD = ${Math.round(state.resistansi)} Ω`, xDivider + 16, (yVCC + yTap) / 2);
  ctx.fillText(`R_tetap = ${PD_R_TETAP.toLocaleString("id-ID")} Ω`, xDivider + 16, (yTap + yGND) / 2);
  ctx.fillText("GND 0 V", xDivider + 16, yGND);

  // titik sambung (tap) bercabang ke kanan menuju label V_keluar
  const xTapCabang = xDivider + 76;
  ctx.strokeStyle = warnaAktif;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xDivider, yTap);
  ctx.lineTo(xTapCabang, yTap);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(xDivider, yTap, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = warnaAktif;
  ctx.fill();

  ctx.textAlign = "left";
  ctx.font = `700 13px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  ctx.fillText(`V_keluar = ${state.tegangan.toFixed(2)} V`, xTapCabang + 8, yTap);
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText(`I = ${state.arusMiliAmp.toFixed(3)} mA`, xTapCabang + 8, yTap + 16);
  ctx.textAlign = "center";

  // ================= Zona 3: ADC besar + bar =================
  const yZona3 = yZona2 + tinggiZona2 + 6;
  if (tinggi - yZona3 < 48) return; // kanvas terlalu pendek — lewati, angka tetap ada di panel

  ctx.font = `700 ${Math.min(40, (tinggi - yZona3) * 0.5)}px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  const yAngkaADC = yZona3 + (tinggi - yZona3) * 0.32;
  ctx.fillText(`${state.adc}`, lebar * 0.5, yAngkaADC);
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("ADC (0–1023)", lebar * 0.5, yAngkaADC + 24);

  const yBar = yAngkaADC + 46;
  if (yBar < tinggi - 10) {
    const tinggiBar = 12;
    const lebarBar = Math.min(lebar * 0.7, 280);
    const xBar = lebar * 0.5 - lebarBar / 2;
    ctx.lineWidth = tinggiBar;
    ctx.strokeStyle = warnaTrek;
    ctx.beginPath();
    ctx.moveTo(xBar + tinggiBar / 2, yBar);
    ctx.lineTo(xBar + lebarBar - tinggiBar / 2, yBar);
    ctx.stroke();

    const rasioIsi = Math.max(0, Math.min(1, state.adc / ADC_MAKS));
    ctx.strokeStyle = warnaAktif;
    ctx.beginPath();
    ctx.moveTo(xBar + tinggiBar / 2, yBar);
    ctx.lineTo(xBar + tinggiBar / 2 + rasioIsi * (lebarBar - tinggiBar), yBar);
    ctx.stroke();
  }
}

/**
 * Ubah delta pointer (piksel) jadi delta posisi permukaan Lab 6. Menyeret ke
 * kanan menggeser permukaan searah kursor (seperti menarik selembar kertas).
 */
export function deltaPosisiDariPiksel(deltaPiksel) {
  return -deltaPiksel / SP_SKALA_PIKSEL;
}

/**
 * Sensor permukaan Lab 6: (1) sensor tetap menghadap bawah membaca permukaan
 * bergaris yang diseret di bawahnya, dengan sinar & area pandang (footprint)
 * tergambar, (2) grafik ADC real time di bawahnya — bentuknya melandai halus
 * saat melintasi tepi garis, bukan lompat kotak, karena footprint sensor.
 */
export function gambarSensorPermukaan(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaAktif = warnaToken("--oranye");
  const warnaCahaya = warnaToken("--led-nyala");
  const warnaLintasan = warnaToken("--lintasan");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ================= Zona 1: sensor tetap + permukaan yang diseret =================
  const tinggiZona1 = tinggi * 0.44;
  const cx = lebar * 0.5;
  const ySensor = tinggiZona1 * 0.26;
  const yPermukaan = tinggiZona1 * 0.72;
  const tinggiPermukaan = Math.max(20, tinggiZona1 * 0.24);

  // permukaan (dipotong supaya tidak menggambar di luar kanvas saat diseret jauh)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, yPermukaan, lebar, tinggiPermukaan);
  ctx.clip();

  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.fillRect(0, yPermukaan, lebar, tinggiPermukaan);

  const xTepiKiri = cx + (-LEBAR_GARIS / 2 - state.posisi) * SP_SKALA_PIKSEL;
  const xTepiKanan = cx + (LEBAR_GARIS / 2 - state.posisi) * SP_SKALA_PIKSEL;
  ctx.fillStyle = warnaLintasan;
  ctx.fillRect(xTepiKiri, yPermukaan, xTepiKanan - xTepiKiri, tinggiPermukaan);

  // tanda batas jangkauan geser, supaya peserta tahu permukaan tidak tak terbatas
  ctx.strokeStyle = warnaLabel;
  ctx.lineWidth = 2;
  for (const batas of [-PERMUKAAN_JANGKAUAN, PERMUKAAN_JANGKAUAN]) {
    const xBatas = cx + (batas - state.posisi) * SP_SKALA_PIKSEL;
    ctx.beginPath();
    ctx.moveTo(xBatas, yPermukaan);
    ctx.lineTo(xBatas, yPermukaan + tinggiPermukaan);
    ctx.stroke();
  }
  ctx.strokeStyle = warnaToken("--abu-garis");
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, yPermukaan + 0.5, lebar - 1, tinggiPermukaan - 1);
  ctx.restore();

  // footprint sensor: area pandang kecil di tengah, tempat pembacaan sebenarnya terjadi
  const jariFootprint = LEBAR_TRANSISI * SP_SKALA_PIKSEL + 3;
  ctx.strokeStyle = warnaAktif;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(cx, yPermukaan + tinggiPermukaan / 2, jariFootprint, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // sinar dari sensor ke permukaan
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.7 * (state.cahayaEfektif / 100);
  ctx.strokeStyle = warnaCahaya;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, ySensor);
  ctx.lineTo(cx, yPermukaan);
  ctx.stroke();
  ctx.restore();

  // ikon sensor: rumah kecil menghadap bawah dengan dua "mata" (pemancar + penerima)
  const lebarRumah = 44;
  const tinggiRumah = 22;
  ctx.fillStyle = warnaToken("--teks");
  ctx.beginPath();
  ctx.moveTo(cx - lebarRumah / 2, ySensor - tinggiRumah / 2);
  ctx.lineTo(cx + lebarRumah / 2, ySensor - tinggiRumah / 2);
  ctx.lineTo(cx + lebarRumah / 2, ySensor + tinggiRumah / 2);
  ctx.lineTo(cx + 8, ySensor + tinggiRumah / 2 + 8);
  ctx.lineTo(cx - 8, ySensor + tinggiRumah / 2 + 8);
  ctx.lineTo(cx - lebarRumah / 2, ySensor + tinggiRumah / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = warnaCahaya;
  ctx.beginPath();
  ctx.arc(cx - 11, ySensor, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.beginPath();
  ctx.arc(cx + 11, ySensor, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("sensor tetap (pemancar + penerima)", cx, ySensor - tinggiRumah / 2 - 12);
  ctx.fillText(
    state.kondisi === "hitam" ? "di atas hitam" : state.kondisi === "putih" ? "di atas putih" : "di tepi garis (transisi)",
    cx,
    // dijepit supaya tidak pernah melewati batas bawah zona 1 — yPermukaan+tinggiPermukaan+18
    // saja bisa nembus ke zona 2 di kanvas berukuran wajar, karena tinggiZona1 cuma sedikit
    // lebih besar dari yPermukaan+tinggiPermukaan.
    Math.min(yPermukaan + tinggiPermukaan + 18, tinggiZona1 - 6),
  );

  // ================= Zona 2: grafik ADC real time =================
  const yGrafik = tinggiZona1 + 22; // jarak tetap dari batas zona 1, supaya judul grafik tidak berdempetan dengan label status di atasnya
  gambarGrafikADC(ctx, state.riwayat, {
    x: lebar * 0.06,
    y: yGrafik,
    lebar: lebar * 0.88,
    tinggi: tinggi - yGrafik - 10,
    fontUtama,
  });
}

/** Grafik garis ADC (0-1023) terhadap waktu — versi satu-garis dari gambarGrafikTegangan. */
function gambarGrafikADC(ctx, riwayat, { x, y, lebar, tinggi, fontUtama }) {
  if (tinggi < 40 || riwayat.length < 2) return;

  const warnaKisi = warnaToken("--abu-garis");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaGaris = warnaToken("--oranye");
  const xPlot = x + 40;
  const lebarPlot = lebar - 40;

  ctx.lineWidth = 1;
  ctx.font = `600 11px ${fontUtama}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const nilai = (ADC_MAKS / 4) * i;
    const yNilai = y + tinggi - (nilai / ADC_MAKS) * tinggi;
    ctx.strokeStyle = warnaKisi;
    ctx.beginPath();
    ctx.moveTo(xPlot, yNilai);
    ctx.lineTo(xPlot + lebarPlot, yNilai);
    ctx.stroke();
    ctx.fillStyle = warnaLabel;
    ctx.fillText(Math.round(nilai).toString(), xPlot - 6, yNilai);
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = warnaGaris;
  ctx.beginPath();
  for (const [i, adc] of riwayat.entries()) {
    const xS = xPlot + (i / (riwayat.length - 1)) * lebarPlot;
    const yS = y + tinggi - (adc / ADC_MAKS) * tinggi;
    if (i === 0) ctx.moveTo(xS, yS);
    else ctx.lineTo(xS, yS);
  }
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = warnaLabel;
  ctx.fillText("ADC vs waktu", xPlot, y - 6);
  ctx.textAlign = "center";
}

/**
 * Array 8 sensor Lab 7: (1) delapan sensor tetap berjajar membaca permukaan
 * bergaris yang diseret di bawahnya (drag sama seperti Lab 6 — reuse
 * deltaPosisiDariPiksel/SP_SKALA_PIKSEL), (2) bar chart 8 bacaan ADC dengan
 * penanda posisi hasil weighted average yang bisa jatuh DI ANTARA dua bar —
 * itulah intinya: perkiraan posisi lebih halus daripada resolusi sensornya.
 */
export function gambarArraySensor(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaAktif = warnaToken("--oranye");
  const warnaCahaya = warnaToken("--led-nyala");
  const warnaLintasan = warnaToken("--lintasan");
  const warnaKisi = warnaToken("--abu-garis");
  const warnaEstimasi = warnaToken("--hijau");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const jumlahSensor = state.sensorADC.length;
  const margin = lebar * 0.08;

  // ================= Zona 1: sensor tetap + permukaan yang diseret =================
  const tinggiZona1 = tinggi * 0.4;
  const ySensor = tinggiZona1 * 0.22;
  const yPermukaan = tinggiZona1 * 0.68;
  const tinggiPermukaan = Math.max(18, tinggiZona1 * 0.26);
  const cx = lebar / 2;
  // Posisi visual sensor ke-i HARUS memakai skala fisik yang sama dengan permukaan
  // yang diseret (offsetSensor × SP_SKALA_PIKSEL, dipusatkan di cx) — bukan disebar
  // rata di lebar kanvas — supaya sensor yang "menyala" di panel selalu tepat sensor
  // yang secara visual dilewati garis hitam.
  const xSensorAt = (i) => cx + offsetSensor(i) * SP_SKALA_PIKSEL;

  // permukaan (dipotong supaya tidak menggambar di luar kanvas saat diseret jauh)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, yPermukaan, lebar, tinggiPermukaan);
  ctx.clip();
  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.fillRect(0, yPermukaan, lebar, tinggiPermukaan);
  const xTepiKiri = cx + (-LEBAR_GARIS / 2 - state.posisiGaris) * SP_SKALA_PIKSEL;
  const xTepiKanan = cx + (LEBAR_GARIS / 2 - state.posisiGaris) * SP_SKALA_PIKSEL;
  ctx.fillStyle = warnaLintasan;
  ctx.fillRect(xTepiKiri, yPermukaan, xTepiKanan - xTepiKiri, tinggiPermukaan);
  ctx.strokeStyle = warnaKisi;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, yPermukaan + 0.5, lebar - 1, tinggiPermukaan - 1);
  ctx.restore();

  // delapan sensor: titik + sinar ke permukaan, opasitas mengikuti cahaya efektifnya sendiri
  const reflek = state.reflektansiSensor;
  for (let i = 0; i < jumlahSensor; i++) {
    const xS = xSensorAt(i);
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.75 * (reflek[i] / 100);
    ctx.strokeStyle = warnaCahaya;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xS, ySensor);
    ctx.lineTo(xS, yPermukaan);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(xS, ySensor, 5, 0, Math.PI * 2);
    ctx.fillStyle = warnaTeks;
    ctx.fill();
  }

  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("array 8 sensor (tetap), geser permukaan", cx, ySensor - 16);
  if (state.kemungkinanGarisHilang) {
    ctx.fillStyle = warnaToken("--merah");
    ctx.fillText("⚠ garis mungkin di luar jangkauan", cx, yPermukaan + tinggiPermukaan + 16);
  }

  // ================= Zona 2: bar chart ADC + penanda posisi weighted average =================
  const yZona2 = tinggiZona1 + 14;
  const tinggiZona2 = tinggi - yZona2 - 10;
  if (tinggiZona2 < 50) return; // kanvas terlalu pendek — lewati, angka tetap ada di panel

  const xPlot = margin + 24;
  const lebarPlot = lebar - margin - xPlot;
  const yDasarBar = yZona2 + tinggiZona2 - 22; // sisakan ruang label bawah
  const tinggiBarMaks = tinggiZona2 - 40;

  ctx.textAlign = "right";
  ctx.font = `600 11px ${fontUtama}`;
  for (let k = 0; k <= 4; k++) {
    const nilai = (ADC_MAKS / 4) * k;
    const yGrid = yDasarBar - (nilai / ADC_MAKS) * tinggiBarMaks;
    ctx.strokeStyle = warnaKisi;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xPlot, yGrid);
    ctx.lineTo(xPlot + lebarPlot, yGrid);
    ctx.stroke();
    ctx.fillStyle = warnaLabel;
    ctx.fillText(Math.round(nilai).toString(), xPlot - 6, yGrid);
  }

  const adc = state.sensorADC;
  const lebarBar = (lebarPlot / jumlahSensor) * 0.55;
  const xBarAt = (i) => xPlot + (lebarPlot * (i + 0.5)) / jumlahSensor;
  ctx.textAlign = "center";
  for (let i = 0; i < jumlahSensor; i++) {
    const xB = xBarAt(i);
    const tinggiB = (adc[i] / ADC_MAKS) * tinggiBarMaks;
    ctx.fillStyle = warnaAktif;
    ctx.fillRect(xB - lebarBar / 2, yDasarBar - tinggiB, lebarBar, tinggiB);
    ctx.font = `600 10px ${fontUtama}`;
    ctx.fillStyle = warnaLabel;
    ctx.fillText(`S${i}`, xB, yDasarBar + 12);
  }

  // penanda posisi weighted average — sengaja diinterpolasi, boleh jatuh di antara dua bar
  const posisiIndeks = state.posisiIndeksEstimasi;
  const xPenanda = xBarAt(0) + (posisiIndeks / (jumlahSensor - 1)) * (xBarAt(jumlahSensor - 1) - xBarAt(0));
  const yPenanda = yDasarBar - tinggiBarMaks - 10;
  ctx.beginPath();
  ctx.moveTo(xPenanda, yPenanda + 12);
  ctx.lineTo(xPenanda - 7, yPenanda);
  ctx.lineTo(xPenanda + 7, yPenanda);
  ctx.closePath();
  ctx.fillStyle = warnaEstimasi;
  ctx.fill();
  if (!state.kemungkinanGarisHilang) {
    ctx.font = `700 11px ${fontUtama}`;
    ctx.fillStyle = warnaEstimasi;
    ctx.fillText("posisi diperkirakan", xPenanda, yPenanda - 10);
  }
}

/**
 * Rangkaian Lab 3: dua resistor seri dengan titik keluaran di antaranya.
 * Titik Vout dan bar rasio menjadi fokus visual agar perubahan nilai mudah
 * dihubungkan dengan rumus pembagi tegangan.
 */
export function gambarPembagiTegangan(ctx, state, ukuran, waktu) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaKawat = warnaToken("--oranye");
  const warnaGaris = warnaToken("--abu-garis");
  const warnaSorot = warnaToken("--oranye-muda");

  const sempit = lebar < 480;
  const xBaterai = lebar * (sempit ? 0.18 : 0.22);
  const xPembagi = lebar * (sempit ? 0.48 : 0.56);
  const xKeluaran = lebar * (sempit ? 0.8 : 0.86);
  const yAtas = tinggi * 0.14;
  const yTengah = tinggi * 0.46;
  const yBawah = tinggi * 0.76;
  const panjangResistor = Math.max(58, tinggi * 0.17);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textBaseline = "middle";
  ctx.lineWidth = LEBAR_KAWAT;
  ctx.strokeStyle = warnaKawat;

  // Jalur tertutup melalui baterai, R1, dan R2.
  ctx.beginPath();
  ctx.moveTo(xBaterai, yAtas);
  ctx.lineTo(xPembagi, yAtas);
  ctx.lineTo(xPembagi, yAtas + 18);
  ctx.moveTo(xPembagi, yTengah - 18);
  ctx.lineTo(xPembagi, yTengah);
  ctx.moveTo(xPembagi, yTengah);
  ctx.lineTo(xPembagi, yTengah + 18);
  ctx.moveTo(xPembagi, yBawah - 18);
  ctx.lineTo(xPembagi, yBawah);
  ctx.lineTo(xBaterai, yBawah);
  ctx.stroke();

  // Baterai pada sisi kiri.
  const yPlus = (yAtas + yBawah) / 2 - 13;
  const yMinus = yPlus + 26;
  ctx.beginPath();
  ctx.moveTo(xBaterai, yAtas);
  ctx.lineTo(xBaterai, yPlus);
  ctx.moveTo(xBaterai, yMinus);
  ctx.lineTo(xBaterai, yBawah);
  ctx.stroke();
  ctx.strokeStyle = warnaTeks;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xBaterai - 17, yPlus);
  ctx.lineTo(xBaterai + 17, yPlus);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(xBaterai - 9, yMinus);
  ctx.lineTo(xBaterai + 9, yMinus);
  ctx.stroke();

  // Dua resistor vertikal.
  gambarResistorVertikal(ctx, xPembagi, yAtas + 18, yTengah - 18, panjangResistor, warnaTeks);
  gambarResistorVertikal(ctx, xPembagi, yTengah + 18, yBawah - 18, panjangResistor, warnaTeks);

  const arahLabel = sempit ? -1 : 1;
  const xLabelResistor = xPembagi + arahLabel * 28;
  ctx.font = `700 13px ${fontUtama}`;
  ctx.textAlign = sempit ? "right" : "left";
  ctx.fillStyle = warnaTeks;
  ctx.fillText("R1", xLabelResistor, (yAtas + yTengah) / 2 - 10);
  ctx.fillText("R2", xLabelResistor, (yTengah + yBawah) / 2 - 10);
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText(`${(state.resistansiAtas / 1000).toFixed(1)} kΩ`, xLabelResistor, (yAtas + yTengah) / 2 + 10);
  ctx.fillText(`${(state.resistansiBawah / 1000).toFixed(1)} kΩ`, xLabelResistor, (yTengah + yBawah) / 2 + 10);

  // Titik keluaran dan kartu nilai Vout.
  ctx.strokeStyle = warnaKawat;
  ctx.lineWidth = LEBAR_KAWAT;
  ctx.beginPath();
  ctx.moveTo(xPembagi, yTengah);
  ctx.lineTo(xKeluaran, yTengah);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(xPembagi, yTengah, 6, 0, Math.PI * 2);
  ctx.fillStyle = warnaKawat;
  ctx.fill();

  const lebarKartu = Math.min(132, lebar * (sempit ? 0.32 : 0.24));
  const tinggiKartu = 76;
  const xKartu = xKeluaran - lebarKartu / 2;
  const yKartu = yTengah - tinggiKartu / 2;
  ctx.fillStyle = warnaSorot;
  ctx.beginPath();
  ctx.roundRect(xKartu, yKartu, lebarKartu, tinggiKartu, 12);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = warnaLabel;
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillText("Vout", xKeluaran, yTengah - 23);
  ctx.font = `500 10px ${fontUtama}`;
  ctx.fillText("tegangan keluaran", xKeluaran, yTengah - 8);
  ctx.fillStyle = warnaTeks;
  ctx.font = `700 20px ${fontUtama}`;
  ctx.fillText(`${state.teganganKeluar.toFixed(2)} V`, xKeluaran, yTengah + 16);

  // Label sumber, ground, dan jatuh tegangan pada tiap resistor.
  ctx.textAlign = "center";
  ctx.font = `700 12px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  ctx.fillText(`VCC, sumber ${TEGANGAN_SUMBER.toFixed(0)} V`, xPembagi, yAtas - 18);
  ctx.fillText("GND, acuan 0 V", xPembagi, yBawah + 18);
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText(`V R1 ${state.teganganAtas.toFixed(2)} V`, xBaterai, yAtas - 18);
  ctx.fillText(`V R2 ${state.teganganKeluar.toFixed(2)} V`, xBaterai, yBawah + 18);

  // Titik arus bergerak pelan untuk menegaskan bahwa kedua resistor dialiri arus yang sama.
  gambarTitikArus(ctx, waktu * 0.55, [
    [xBaterai, yPlus],
    [xBaterai, yAtas],
    [xPembagi, yAtas],
    [xPembagi, yBawah],
    [xBaterai, yBawah],
    [xBaterai, yMinus],
  ]);

  // Bar rasio R2 terhadap total resistansi.
  const lebarBar = Math.min(lebar * 0.7, 360);
  const tinggiBar = 12;
  const xBar = (lebar - lebarBar) / 2;
  const yBar = tinggi * 0.91;
  ctx.lineWidth = tinggiBar;
  ctx.strokeStyle = warnaGaris;
  ctx.beginPath();
  ctx.moveTo(xBar + tinggiBar / 2, yBar);
  ctx.lineTo(xBar + lebarBar - tinggiBar / 2, yBar);
  ctx.stroke();
  const xIsi = xBar + tinggiBar / 2 + state.rasioBawah * (lebarBar - tinggiBar);
  ctx.strokeStyle = warnaKawat;
  ctx.beginPath();
  ctx.moveTo(xBar + tinggiBar / 2, yBar);
  ctx.lineTo(xIsi, yBar);
  ctx.stroke();
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "left";
  ctx.fillText("0%", xBar, yBar - 18);
  ctx.textAlign = "right";
  ctx.fillText("100%", xBar + lebarBar, yBar - 18);
  ctx.textAlign = "center";
  ctx.fillStyle = warnaTeks;
  ctx.fillText(`Bagian R2 dari total ${(state.rasioBawah * 100).toFixed(1)}%`, lebar / 2, yBar + 22);
}

function gambarResistorVertikal(ctx, x, yAwal, yAkhir, panjang, warna) {
  const tengah = (yAwal + yAkhir) / 2;
  const mulai = tengah - panjang / 2;
  const akhir = tengah + panjang / 2;
  const lebarZig = 10;

  ctx.strokeStyle = warna;
  ctx.lineWidth = LEBAR_KAWAT;
  ctx.beginPath();
  ctx.moveTo(x, yAwal);
  ctx.lineTo(x, mulai);
  for (let i = 0; i < 6; i++) {
    const y = mulai + ((i + 1) / 7) * panjang;
    ctx.lineTo(x + (i % 2 === 0 ? lebarZig : -lebarZig), y);
  }
  ctx.lineTo(x, akhir);
  ctx.lineTo(x, yAkhir);
  ctx.stroke();
}

/**
 * Ubah posisi pointer (koordinat layar) jadi persentase 0-100 dial potensiometer.
 * Geometri sama persis dengan gambarPotensiometer, supaya seretan terasa presisi.
 */
export function posisiPersenPotensiometer(kanvas, clientX, clientY) {
  const rect = kanvas.getBoundingClientRect();
  const tinggiDial = rect.height * POT_TINGGI_DIAL;
  const cx = rect.left + rect.width * POT_PUSAT_X;
  const cy = rect.top + tinggiDial * POT_PUSAT_Y;

  const dx = clientX - cx;
  const dy = clientY - cy;
  const sudutDariAtas = Math.atan2(dx, -dy) * (180 / Math.PI);
  const dijepit = Math.max(POT_SUDUT_MIN, Math.min(POT_SUDUT_MAKS, sudutDariAtas));
  return ((dijepit - POT_SUDUT_MIN) / (POT_SUDUT_MAKS - POT_SUDUT_MIN)) * 100;
}

function sudutStandar(derajatDariAtas) {
  return ((derajatDariAtas - 90) * Math.PI) / 180;
}

/**
 * Dial potensiometer Lab 4: trek busur 270° dengan celah 90° di bawah (seperti
 * potensiometer sungguhan), penunjuk arah di badan knob, penanda target, dan
 * bar tegangan 0-5V di bawahnya.
 */
export function gambarPotensiometer(ctx, state, ukuran) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);

  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaTrek = warnaToken("--abu-garis");
  const warnaAktif = warnaToken("--oranye");
  const warnaTarget = warnaToken("--hijau");
  const warnaAktifSekarang = state.diTarget ? warnaTarget : warnaAktif;

  const tinggiDial = tinggi * POT_TINGGI_DIAL;
  const cx = lebar * POT_PUSAT_X;
  const cy = tinggiDial * POT_PUSAT_Y;
  const jariTrek = Math.min(lebar * 0.42, tinggiDial * 0.42);
  const jariKnob = jariTrek - Math.max(14, jariTrek * 0.18);

  const sudutMulai = sudutStandar(POT_SUDUT_MIN);
  const sudutAkhir = sudutStandar(POT_SUDUT_MAKS);
  const sudutSaatIni = sudutStandar(POT_SUDUT_MIN + (state.posisi / 100) * (POT_SUDUT_MAKS - POT_SUDUT_MIN));
  const sudutTarget = sudutStandar(POT_SUDUT_MIN + (state.target / 100) * (POT_SUDUT_MAKS - POT_SUDUT_MIN));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";

  // ---- Trek latar (jalur penuh 270°, celah 90° di bawah) ----
  ctx.lineWidth = 10;
  ctx.strokeStyle = warnaTrek;
  ctx.beginPath();
  ctx.arc(cx, cy, jariTrek, sudutMulai, sudutAkhir);
  ctx.stroke();

  // ---- Trek terisi sampai posisi sekarang ----
  ctx.strokeStyle = warnaAktifSekarang;
  ctx.beginPath();
  ctx.arc(cx, cy, jariTrek, sudutMulai, sudutSaatIni);
  ctx.stroke();

  // ---- Penanda target (tanda centang kecil menyilang trek) ----
  ctx.lineWidth = 3;
  ctx.strokeStyle = warnaTarget;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(sudutTarget) * (jariTrek - 8), cy + Math.sin(sudutTarget) * (jariTrek - 8));
  ctx.lineTo(cx + Math.cos(sudutTarget) * (jariTrek + 8), cy + Math.sin(sudutTarget) * (jariTrek + 8));
  ctx.stroke();

  // ---- Badan knob ----
  ctx.beginPath();
  ctx.arc(cx, cy, jariKnob, 0, Math.PI * 2);
  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = warnaTrek;
  ctx.stroke();

  // ---- Penunjuk arah knob ----
  const xUjung = cx + Math.cos(sudutSaatIni) * (jariKnob - 8);
  const yUjung = cy + Math.sin(sudutSaatIni) * (jariKnob - 8);
  ctx.lineWidth = 4;
  ctx.strokeStyle = warnaAktifSekarang;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(xUjung, yUjung);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(xUjung, yUjung, 5, 0, Math.PI * 2);
  ctx.fillStyle = warnaAktifSekarang;
  ctx.fill();

  // ---- Label MIN / MAKS di ujung trek ----
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  const jariLabel = jariTrek + 22;
  ctx.fillText("MIN", cx + Math.cos(sudutMulai) * jariLabel, cy + Math.sin(sudutMulai) * jariLabel);
  ctx.fillText("MAKS", cx + Math.cos(sudutAkhir) * jariLabel, cy + Math.sin(sudutAkhir) * jariLabel);

  // ---- Persentase + target di tengah knob ----
  ctx.font = `700 ${Math.round(jariKnob * 0.42)}px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  ctx.fillText(`${Math.round(state.posisi)}%`, cx, cy - jariKnob * 0.14);
  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText(`target ${state.target}%`, cx, cy + jariKnob * 0.32);

  // ---- Bar tegangan di bawah dial ----
  const yAtasBar = tinggiDial + 8;
  const tinggiPitaBar = tinggi - yAtasBar;
  if (tinggiPitaBar < 44) return; // kanvas terlalu pendek — lewati, angka tetap ada di panel

  const tinggiBar = 14;
  const lebarBar = Math.min(lebar * 0.7, 280);
  const xBar = cx - lebarBar / 2;
  const yBar = yAtasBar + 22;

  ctx.font = `600 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "left";
  ctx.fillText("0 V", xBar, yBar - 16);
  ctx.textAlign = "right";
  ctx.fillText(`${TEGANGAN_SUMBER.toFixed(0)} V`, xBar + lebarBar, yBar - 16);

  ctx.lineWidth = tinggiBar;
  ctx.strokeStyle = warnaTrek;
  ctx.beginPath();
  ctx.moveTo(xBar + tinggiBar / 2, yBar);
  ctx.lineTo(xBar + lebarBar - tinggiBar / 2, yBar);
  ctx.stroke();

  const rasioIsi = Math.max(0, Math.min(1, state.tegangan / TEGANGAN_SUMBER));
  const xIsi = xBar + tinggiBar / 2 + rasioIsi * (lebarBar - tinggiBar);
  ctx.strokeStyle = warnaAktifSekarang;
  ctx.beginPath();
  ctx.moveTo(xBar + tinggiBar / 2, yBar);
  ctx.lineTo(xIsi, yBar);
  ctx.stroke();

  ctx.font = `700 14px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  ctx.textAlign = "center";
  ctx.fillText(`${state.tegangan.toFixed(2)} V`, cx, yBar + tinggiBar / 2 + 20);
}

function gambarSlotResistor(ctx, x, yAwal, yAkhir, terisi, warnaTeks, warnaLabel, fontUtama) {
  if (!terisi) {
    // slot kosong: garis putus-putus, TIDAK menghubungkan (rangkaian terbuka)
    ctx.save();
    ctx.strokeStyle = warnaLabel;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(x - 10, yAwal + 4, 20, yAkhir - yAwal - 8);
    ctx.restore();
    return;
  }

  const tinggiZigzag = Math.min(34, (yAkhir - yAwal) * 0.5);
  const yZigMulai = (yAwal + yAkhir) / 2 - tinggiZigzag / 2;
  const lebarZig = 8;

  ctx.strokeStyle = warnaTeks;
  ctx.beginPath();
  ctx.moveTo(x, yAwal);
  ctx.lineTo(x, yZigMulai);
  // zigzag 4 puncak
  for (let i = 0; i < 4; i++) {
    const ya = yZigMulai + (tinggiZigzag * (i + 0.25)) / 4;
    const yb = yZigMulai + (tinggiZigzag * (i + 0.75)) / 4;
    ctx.lineTo(i % 2 === 0 ? x + lebarZig : x - lebarZig, ya);
    ctx.lineTo(i % 2 === 0 ? x + lebarZig : x - lebarZig, yb);
  }
  ctx.lineTo(x, yZigMulai + tinggiZigzag);
  ctx.lineTo(x, yAkhir);
  ctx.stroke();

  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "left";
  ctx.fillText("10 kΩ", x + lebarZig + 8, (yAwal + yAkhir) / 2);
  ctx.textAlign = "center";
}

function gambarTitikArus(ctx, waktu, titikJalur) {
  const ruas = [];
  let panjangTotal = 0;
  for (let i = 0; i < titikJalur.length - 1; i++) {
    const [xa, ya] = titikJalur[i];
    const [xb, yb] = titikJalur[i + 1];
    const panjang = Math.hypot(xb - xa, yb - ya);
    ruas.push({ xa, ya, xb, yb, panjang });
    panjangTotal += panjang;
  }

  const kecepatan = 70; // piksel per detik
  const jarakAntarTitik = 46;
  const geser = (waktu * kecepatan) % jarakAntarTitik;

  ctx.fillStyle = "#ffffff";
  for (let s = geser; s < panjangTotal; s += jarakAntarTitik) {
    let sisa = s;
    for (const r of ruas) {
      if (sisa <= r.panjang) {
        const t = sisa / r.panjang;
        ctx.beginPath();
        ctx.arc(r.xa + (r.xb - r.xa) * t, r.ya + (r.yb - r.ya) * t, 3.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      sisa -= r.panjang;
    }
  }
}
