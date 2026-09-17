/*
 * Registry 16 lab: identitas kartu beranda dan berkas definisi.
 * Lab yang belum dibangun: berkas = null, tersedia = false → kartu "Segera".
 * Menambah lab = buat berkas definisinya lalu ubah tersedia jadi true di sini.
 */

// Pembagian 5 modul ini mengikuti struktur kursus di elearning.atmajaya.ac.id
// (course id 23812): Modul 1 Lab 1-4, Modul 2 Lab 5-7, Modul 3 Lab 8-11,
// Modul 4 Lab 12-15, Modul 5 Lab 16 (Eksperimen Komparatif dan Capstone).
export const daftarModul = [
  { id: 1, nama: "Modul 1: Dasar Elektronika" },
  { id: 2, nama: "Modul 2: Sensor Photodiode" },
  { id: 3, nama: "Modul 3: Kendali Gerak Robot" },
  { id: 4, nama: "Modul 4: Persepsi Kamera" },
  { id: 5, nama: "Modul 5: Eksperimen dan Proyek Akhir" },
];

export const daftarLab = [
  { id: 1,  singkat: "LED ON/OFF",               modul: 1, thumb: "assets/thumbs/lab01.svg", berkas: "lab01-led.js", tersedia: true },
  { id: 2,  singkat: "Aktif High/Low",          modul: 1, thumb: "assets/thumbs/lab02.svg", berkas: "lab02-pullupdown.js", tersedia: true },
  { id: 3,  singkat: "Pembagi Tegangan",          modul: 1, thumb: "assets/thumbs/lab03.svg", berkas: "lab03-resistor.js", tersedia: true },
  { id: 4,  singkat: "Potensiometer",           modul: 1, thumb: "assets/thumbs/lab04.svg", berkas: "lab04-potensiometer.js", tersedia: true },
  { id: 5,  singkat: "Photodiode",              modul: 2, thumb: "assets/thumbs/lab05.svg", berkas: "lab05-photodiode.js", tersedia: true },
  { id: 6,  singkat: "Photodiode di Permukaan", modul: 2, thumb: "assets/thumbs/lab06.svg", berkas: "lab06-sensor-permukaan.js", tersedia: true },
  { id: 7,  singkat: "Array 8 Photodiode",      modul: 2, thumb: "assets/thumbs/lab07.svg", berkas: "lab07-array-sensor.js", tersedia: true },
  { id: 8,  singkat: "Driver Motor",            modul: 3, thumb: "assets/thumbs/lab08.svg", berkas: "lab08-driver-motor.js", tersedia: true },
  { id: 9,  singkat: "Gerak Robot Dua Roda",    modul: 3, thumb: "assets/thumbs/lab09.svg", berkas: "lab09-gerak-robot.js", tersedia: true },
  { id: 10, singkat: "Kendali On-Off",          modul: 3, thumb: "assets/thumbs/lab10.svg", berkas: "lab10-kendali-onoff.js", tersedia: true },
  { id: 11, singkat: "Kendali P, PD, PID",      modul: 3, thumb: "assets/thumbs/lab11.svg", berkas: "lab11-kendali-pid.js", tersedia: true },
  { id: 12, singkat: "Konsep Piksel",           modul: 4, thumb: "assets/thumbs/lab12.svg", berkas: "lab12-piksel.js", tersedia: true },
  { id: 13, singkat: "Thresholding",            modul: 4, thumb: "assets/thumbs/lab13.svg", berkas: "lab13-thresholding.js", tersedia: true },
  { id: 14, singkat: "Frame jadi 8 Region",     modul: 4, thumb: "assets/thumbs/lab14.svg", berkas: "lab14-frame-region.js", tersedia: true },
  { id: 15, singkat: "Robot dengan Kamera",     modul: 4, thumb: "assets/thumbs/lab15.svg", berkas: "lab15-robot-kamera.js", tersedia: true },
  { id: 16, singkat: "Eksperimen Komparatif",   modul: 5, thumb: "assets/thumbs/lab16.svg", berkas: "lab16-eksperimen.js", tersedia: true },
];
