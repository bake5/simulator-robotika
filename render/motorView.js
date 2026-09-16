/*
 * Menggambar tiga panel Lab 8 — Driver Motor.
 * Panel 1: pin langsung vs lewat driver. Panel 2: H-bridge empat saklar.
 * Panel 3: PWM duty cycle. Geometri H-bridge diekspor supaya hit-test klik
 * (pasangInteraksi di labs/lab08-driver-motor.js) memakai koordinat yang
 * benar-benar sama dengan yang digambar — satu sumber kebenaran.
 */

import { warnaToken } from "./kanvas.js";
import { TEGANGAN_SUMBER } from "../engine/rangkaian.js";
import { ARUS_PIN_MAKS_MA, ARUS_MOTOR_TIPIKAL_MA, ARUS_MOTOR_STALL_MA } from "../engine/motor.js";

const LEBAR_SAKLAR = 56;
const TINGGI_SAKLAR = 26;

/** Geometri H-bridge Panel 2 — dipakai bersama gambar & hit-test klik. */
export function geometriHBridge(lebar, tinggi) {
  const xKiri = lebar * 0.28;
  const xKanan = lebar * 0.72;
  const yVCC = tinggi * 0.14;
  const yGND = tinggi * 0.86;
  const yMotor = tinggi * 0.5;
  return {
    xKiri,
    xKanan,
    yVCC,
    yGND,
    yMotor,
    s1: { x: xKiri, y: (yVCC + yMotor) / 2 },
    s2: { x: xKiri, y: (yMotor + yGND) / 2 },
    s3: { x: xKanan, y: (yVCC + yMotor) / 2 },
    s4: { x: xKanan, y: (yMotor + yGND) / 2 },
  };
}

/** Saklar mana (jika ada) yang berada di bawah titik (x,y) kanvas — dipakai hit-test klik Panel 2. */
export function saklarDiTitik(lebar, tinggi, x, y) {
  const g = geometriHBridge(lebar, tinggi);
  for (const nama of ["s1", "s2", "s3", "s4"]) {
    const p = g[nama];
    if (Math.abs(x - p.x) <= LEBAR_SAKLAR / 2 && Math.abs(y - p.y) <= TINGGI_SAKLAR / 2 + 10) return nama;
  }
  return null;
}

function gambarSaklar(ctx, x, y, nyala, fontUtama) {
  const warnaOn = warnaToken("--oranye");
  const warnaOff = warnaToken("--abu-garis");
  const warnaTeksOn = "#ffffff";
  const warnaTeksOff = warnaToken("--teks-lembut");

  ctx.fillStyle = nyala ? warnaOn : warnaToken("--putih-kartu");
  ctx.strokeStyle = nyala ? warnaOn : warnaOff;
  ctx.lineWidth = 2;
  const rx = 8;
  const x0 = x - LEBAR_SAKLAR / 2;
  const y0 = y - TINGGI_SAKLAR / 2;
  ctx.beginPath();
  ctx.roundRect(x0, y0, LEBAR_SAKLAR, TINGGI_SAKLAR, rx);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = nyala ? warnaTeksOn : warnaTeksOff;
  ctx.font = `700 12px ${fontUtama}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(nyala ? "ON" : "OFF", x, y);
}

function gambarMotorBulat(ctx, x, y, jari, sudut, warna, warnaLabel, fontUtama, label) {
  ctx.beginPath();
  ctx.arc(x, y, jari, 0, Math.PI * 2);
  ctx.fillStyle = warnaToken("--putih-kartu");
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = warna;
  ctx.stroke();

  // satu jari-jari sebagai penanda putaran, supaya arah & kecepatan putar terlihat
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + jari * 0.8 * Math.cos(sudut), y + jari * 0.8 * Math.sin(sudut));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = warna;
  ctx.fill();

  if (label) {
    ctx.font = `600 12px ${fontUtama}`;
    ctx.fillStyle = warnaLabel;
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + jari + 20);
  }
}

/** Panel 1 — kenapa perlu driver: dua baris berdampingan, pin langsung (gagal) vs lewat driver (jalan). */
function gambarPanel1(ctx, state, ukuran, waktu, fontUtama) {
  const { lebar, tinggi } = ukuran;
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaMerah = warnaToken("--merah");
  const warnaHijau = warnaToken("--hijau");
  const warnaKawat = warnaToken("--abu-garis");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const xPin = lebar * 0.14;
  const xTengah = lebar * 0.47;
  const xMotor = lebar * 0.84;

  function barisSkema(y, jalurDriver) {
    ctx.fillStyle = warnaToken("--abu-muda");
    ctx.strokeStyle = warnaTeks;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(xPin - 34, y - 22, 68, 44, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = warnaTeks;
    ctx.font = `700 11px ${fontUtama}`;
    ctx.fillText("pin GPIO", xPin, y - 5);
    ctx.font = `600 10px ${fontUtama}`;
    ctx.fillStyle = warnaLabel;
    ctx.fillText(`maks ${ARUS_PIN_MAKS_MA} mA`, xPin, y + 11);

    if (jalurDriver) {
      ctx.strokeStyle = warnaHijau;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xPin + 34, y);
      ctx.lineTo(xTengah - 38, y);
      ctx.stroke();
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(xTengah + 38, y);
      ctx.lineTo(xMotor - 26, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = warnaToken("--oranye-muda");
      ctx.strokeStyle = warnaToken("--oranye");
      ctx.beginPath();
      ctx.roundRect(xTengah - 38, y - 24, 76, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = warnaToken("--oranye");
      ctx.font = `700 11px ${fontUtama}`;
      ctx.fillText("driver IC", xTengah, y - 4);
      ctx.font = `600 9px ${fontUtama}`;
      ctx.fillStyle = warnaLabel;
      ctx.fillText("sinyal masuk", xTengah, y + 9);
      ctx.fillText("arus besar", xTengah, y + 20);

      gambarMotorBulat(ctx, xMotor, y, 22, waktu * 3, warnaHijau, warnaLabel, fontUtama, null);
      ctx.fillStyle = warnaHijau;
      ctx.font = `700 12px ${fontUtama}`;
      ctx.fillText("✓ motor berputar", xMotor, y + 40);
    } else {
      ctx.strokeStyle = warnaMerah;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(xPin + 34, y);
      ctx.lineTo(xMotor - 26, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const xSilang = (xPin + xMotor) / 2;
      ctx.strokeStyle = warnaMerah;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xSilang - 8, y - 8);
      ctx.lineTo(xSilang + 8, y + 8);
      ctx.moveTo(xSilang + 8, y - 8);
      ctx.lineTo(xSilang - 8, y + 8);
      ctx.stroke();

      gambarMotorBulat(ctx, xMotor, y, 22, 0, warnaKawat, warnaLabel, fontUtama, null);
      ctx.fillStyle = warnaMerah;
      ctx.font = `700 12px ${fontUtama}`;
      ctx.fillText("✗ motor diam", xMotor, y + 40);
    }
  }

  const yAtas = tinggi * 0.28;
  const yBawah = tinggi * 0.62;
  ctx.font = `700 12px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.textAlign = "left";
  ctx.fillText("langsung dari pin", 12, yAtas - 42);
  ctx.fillText("lewat driver motor", 12, yBawah - 46);
  ctx.textAlign = "center";

  barisSkema(yAtas, false);
  barisSkema(yBawah, true);

  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText(
    `motor DC kecil butuh arus ≈ ${ARUS_MOTOR_TIPIKAL_MA} mA saat jalan normal, bisa ≈ ${ARUS_MOTOR_STALL_MA} mA saat macet`,
    lebar * 0.5,
    tinggi * 0.88,
  );
  ctx.fillText(`jauh di atas ${ARUS_PIN_MAKS_MA} mA yang aman ditarik dari satu pin`, lebar * 0.5, tinggi * 0.88 + 16);
}

/** Panel 2 — H-bridge: empat saklar, motor di tengah, rel VCC/GND di atas-bawah. */
function gambarPanel2(ctx, state, ukuran, waktu, fontUtama) {
  const { lebar, tinggi } = ukuran;
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaMerah = warnaToken("--merah");
  const warnaHijau = warnaToken("--hijau");
  const warnaOranye = warnaToken("--oranye");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const g = geometriHBridge(lebar, tinggi);
  const kondisi = state.kondisiHBridge;

  ctx.strokeStyle = warnaTeks;
  ctx.lineWidth = 2.5;
  // rel VCC dan GND
  ctx.beginPath();
  ctx.moveTo(g.xKiri - 30, g.yVCC);
  ctx.lineTo(g.xKanan + 30, g.yVCC);
  ctx.moveTo(g.xKiri - 30, g.yGND);
  ctx.lineTo(g.xKanan + 30, g.yGND);
  ctx.stroke();
  ctx.fillStyle = warnaLabel;
  ctx.font = `700 12px ${fontUtama}`;
  ctx.textAlign = "right";
  ctx.fillText("VCC", g.xKiri - 36, g.yVCC);
  ctx.fillText("GND", g.xKiri - 36, g.yGND);
  ctx.textAlign = "center";

  // dua kaki vertikal (kiri: A, kanan: B), dengan celah tempat saklar
  const warnaLegKiri = kondisi === "short" && state.s1 && state.s2 ? warnaMerah : warnaTeks;
  const warnaLegKanan = kondisi === "short" && state.s3 && state.s4 ? warnaMerah : warnaTeks;
  for (const [xLeg, warnaLeg] of [
    [g.xKiri, warnaLegKiri],
    [g.xKanan, warnaLegKanan],
  ]) {
    ctx.strokeStyle = warnaLeg;
    ctx.beginPath();
    ctx.moveTo(xLeg, g.yVCC);
    ctx.lineTo(xLeg, g.yMotor - TINGGI_SAKLAR);
    ctx.moveTo(xLeg, g.yMotor - TINGGI_SAKLAR + 14);
    ctx.lineTo(xLeg, g.yMotor);
    ctx.moveTo(xLeg, g.yMotor);
    ctx.lineTo(xLeg, g.yMotor + TINGGI_SAKLAR - 14);
    ctx.moveTo(xLeg, g.yMotor + TINGGI_SAKLAR);
    ctx.lineTo(xLeg, g.yGND);
    ctx.stroke();
  }

  // kawat motor mendatar menghubungkan titik A (kiri) dan titik B (kanan)
  const warnaMotorKawat = kondisi === "maju" ? warnaHijau : kondisi === "mundur" ? warnaOranye : kondisi === "short" ? warnaMerah : warnaTeks;
  ctx.strokeStyle = warnaMotorKawat;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.xKiri, g.yMotor);
  ctx.lineTo(g.xKanan, g.yMotor);
  ctx.stroke();

  // titik A dan B
  ctx.fillStyle = warnaTeks;
  for (const x of [g.xKiri, g.xKanan]) {
    ctx.beginPath();
    ctx.arc(x, g.yMotor, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = `600 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("A", g.xKiri - 14, g.yMotor - 14);
  ctx.fillText("B", g.xKanan + 14, g.yMotor - 14);

  // motor di tengah kawat
  gambarMotorBulat(
    ctx,
    (g.xKiri + g.xKanan) / 2,
    g.yMotor,
    30,
    state.sudutMotor2,
    warnaMotorKawat,
    warnaLabel,
    fontUtama,
    null,
  );

  // empat saklar
  gambarSaklar(ctx, g.s1.x, g.s1.y, state.s1, fontUtama);
  gambarSaklar(ctx, g.s2.x, g.s2.y, state.s2, fontUtama);
  gambarSaklar(ctx, g.s3.x, g.s3.y, state.s3, fontUtama);
  gambarSaklar(ctx, g.s4.x, g.s4.y, state.s4, fontUtama);
  ctx.font = `700 11px ${fontUtama}`;
  ctx.fillStyle = warnaLabel;
  ctx.fillText("S1", g.s1.x - LEBAR_SAKLAR / 2 - 14, g.s1.y);
  ctx.fillText("S2", g.s2.x - LEBAR_SAKLAR / 2 - 14, g.s2.y);
  ctx.fillText("S3", g.s3.x + LEBAR_SAKLAR / 2 + 14, g.s3.y);
  ctx.fillText("S4", g.s4.x + LEBAR_SAKLAR / 2 + 14, g.s4.y);

  // status besar di bawah, boleh dua baris supaya tidak meluber lebar kanvas sempit
  const barisStatus =
    kondisi === "maju"
      ? ["MAJU: S1 dan S4 menyala", "arus mengalir A ke B"]
      : kondisi === "mundur"
        ? ["MUNDUR: S2 dan S3 menyala", "arus mengalir B ke A"]
        : kondisi === "short"
          ? ["⚠ HUBUNG SINGKAT: dua saklar sekaki menyala bersamaan", "JANGAN dicoba di rangkaian sungguhan"]
          : ["netral: motor mengambang atau direm", "tidak ada beda tegangan"];
  ctx.font = `700 12px ${fontUtama}`;
  ctx.fillStyle = kondisi === "maju" ? warnaHijau : kondisi === "mundur" ? warnaOranye : kondisi === "short" ? warnaMerah : warnaLabel;
  ctx.fillText(barisStatus[0], lebar * 0.5, tinggi * 0.9);
  ctx.fillText(barisStatus[1], lebar * 0.5, tinggi * 0.9 + 15);
}

/** Panel 3 — PWM: gelombang kotak duty cycle + kecepatan motor hasilnya. */
function gambarPanel3(ctx, state, ukuran, waktu, fontUtama) {
  const { lebar, tinggi } = ukuran;
  const warnaTeks = warnaToken("--teks");
  const warnaLabel = warnaToken("--teks-lembut");
  const warnaOranye = warnaToken("--oranye");
  const warnaKisi = warnaToken("--abu-garis");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ---- gelombang kotak PWM, dua periode berjalan ----
  const yPlot = tinggi * 0.36;
  const tinggiPlot = tinggi * 0.22;
  const xPlot = lebar * 0.1;
  const lebarPlot = lebar * 0.8;
  const periodePx = lebarPlot / 2.4; // dua-tiga periode kelihatan sekaligus
  const duty = state.dutyCycle / 100;
  const kecepatanGeser = 24; // px/s, sekadar menunjukkan sinyal "hidup", bukan frekuensi PWM sungguhan

  ctx.strokeStyle = warnaKisi;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPlot, yPlot);
  ctx.lineTo(xPlot + lebarPlot, yPlot);
  ctx.moveTo(xPlot, yPlot - tinggiPlot);
  ctx.lineTo(xPlot + lebarPlot, yPlot - tinggiPlot);
  ctx.stroke();
  ctx.fillStyle = warnaLabel;
  ctx.font = `600 11px ${fontUtama}`;
  ctx.textAlign = "right";
  ctx.fillText("0 V", xPlot - 8, yPlot);
  ctx.fillText(`${TEGANGAN_SUMBER} V`, xPlot - 8, yPlot - tinggiPlot);
  ctx.textAlign = "center";

  const geser = (waktu * kecepatanGeser) % periodePx;
  ctx.strokeStyle = warnaOranye;
  ctx.lineWidth = 3;
  ctx.beginPath();
  let xAwal = xPlot - geser;
  let yLevel = yPlot; // mulai LOW pada tepi kiri periode
  let pertama = true;
  for (let x = xAwal; x <= xPlot + lebarPlot + periodePx; x += 0.5) {
    const posDalamPeriode = ((x - xAwal) % periodePx + periodePx) % periodePx;
    const tinggiSinyal = posDalamPeriode < duty * periodePx ? yPlot - tinggiPlot : yPlot;
    const xGambar = Math.max(xPlot, Math.min(xPlot + lebarPlot, x));
    if (pertama) {
      ctx.moveTo(xGambar, tinggiSinyal);
      pertama = false;
      yLevel = tinggiSinyal;
    } else if (tinggiSinyal !== yLevel) {
      ctx.lineTo(xGambar, yLevel);
      ctx.lineTo(xGambar, tinggiSinyal);
      yLevel = tinggiSinyal;
    } else {
      ctx.lineTo(xGambar, tinggiSinyal);
    }
    if (x >= xPlot + lebarPlot) break;
  }
  ctx.stroke();

  // garis putus-putus tegangan rata-rata
  const yRata = yPlot - (state.teganganRataDuty / TEGANGAN_SUMBER) * tinggiPlot;
  ctx.strokeStyle = warnaToken("--hijau");
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xPlot, yRata);
  ctx.lineTo(xPlot + lebarPlot, yRata);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = warnaToken("--hijau");
  ctx.textAlign = "left";
  ctx.font = `700 11px ${fontUtama}`;
  ctx.fillText(`V rata-rata = ${state.teganganRataDuty.toFixed(2)} V`, xPlot + lebarPlot - 150, yRata - 10);
  ctx.textAlign = "center";

  ctx.fillStyle = warnaTeks;
  ctx.font = `700 13px ${fontUtama}`;
  ctx.fillText(`duty cycle ${state.dutyCycle}%`, lebar * 0.5, yPlot - tinggiPlot - 20);

  // ---- motor berputar sesuai kecepatan hasil duty cycle ----
  const yMotor = tinggi * 0.72;
  gambarMotorBulat(ctx, lebar * 0.5, yMotor, 34, state.sudutMotor3, warnaOranye, warnaLabel, fontUtama, null);
  ctx.font = `700 15px ${fontUtama}`;
  ctx.fillStyle = warnaTeks;
  ctx.fillText(`${Math.round(state.rpmDuty)} RPM`, lebar * 0.5, yMotor + 58);
}

export function gambarDriverMotor(ctx, state, ukuran, waktu) {
  const { lebar, tinggi } = ukuran;
  ctx.clearRect(0, 0, lebar, tinggi);
  const fontUtama = getComputedStyle(document.documentElement).getPropertyValue("--font-utama");

  if (state.panelAktif === 1) gambarPanel1(ctx, state, ukuran, waktu, fontUtama);
  else if (state.panelAktif === 2) gambarPanel2(ctx, state, ukuran, waktu, fontUtama);
  else gambarPanel3(ctx, state, ukuran, waktu, fontUtama);
}
