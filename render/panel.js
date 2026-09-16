/*
 * Membangun panel kontrol dan panduan dari definisi lab.
 * Jenis kontrol yang dikenal: toggle, slider, tab, pilihan, tombolTahan,
 * indikatorLogika, nilai, rumus, teks.
 */

export function bangunKontrol(wadah, daftarKontrol, saatUbah) {
  const elemen = new Map();

  for (const kontrol of daftarKontrol) {
    switch (kontrol.jenis) {
      case "toggle": {
        const baris = document.createElement("div");
        baris.className = "baris-kontrol";

        const label = document.createElement("label");
        label.className = "saklar";

        const teks = document.createElement("span");
        teks.textContent = kontrol.label;

        const masukan = document.createElement("input");
        masukan.type = "checkbox";
        masukan.id = `kontrol-${kontrol.id}`;
        masukan.checked = Boolean(kontrol.nilaiAwal);

        const lintas = document.createElement("span");
        lintas.className = "lintas";
        lintas.setAttribute("aria-hidden", "true");

        masukan.addEventListener("change", () => saatUbah(kontrol, masukan.checked));

        label.append(teks, masukan, lintas);
        baris.append(label);
        wadah.append(baris);
        elemen.set(kontrol.id, masukan);
        break;
      }

      case "slider": {
        const grup = document.createElement("div");
        grup.className = "grup-slider";

        const kepala = document.createElement("div");
        kepala.className = "kepala-slider";
        const label = document.createElement("label");
        label.textContent = kontrol.label;
        label.htmlFor = `kontrol-${kontrol.id}`;
        const bacaan = document.createElement("span");
        bacaan.className = "bacaan-slider";
        kepala.append(label, bacaan);

        const masukan = document.createElement("input");
        masukan.type = "range";
        masukan.id = `kontrol-${kontrol.id}`;
        masukan.min = kontrol.min;
        masukan.max = kontrol.max;
        masukan.step = kontrol.langkah ?? 1;
        masukan.value = kontrol.nilaiAwal ?? kontrol.min;

        const perbaruiBacaan = () => {
          bacaan.textContent = `${masukan.value}${kontrol.satuan ? ` ${kontrol.satuan}` : ""}`;
        };
        perbaruiBacaan();
        masukan.addEventListener("input", () => {
          perbaruiBacaan();
          saatUbah(kontrol, Number(masukan.value));
        });

        grup.append(kepala, masukan);
        wadah.append(grup);
        elemen.set(kontrol.id, { masukan, perbaruiBacaan, kotak: grup });
        break;
      }

      case "tab": {
        const baris = document.createElement("div");
        baris.className = "baris-tab";
        baris.setAttribute("role", "tablist");
        if (kontrol.label) baris.setAttribute("aria-label", kontrol.label);

        const tombolTab = new Map();
        for (const [indeks, pilihan] of kontrol.pilihan.entries()) {
          const tab = document.createElement("button");
          tab.type = "button";
          tab.className = "tab-item" + (indeks === 0 ? " aktif" : "");
          tab.setAttribute("role", "tab");
          tab.setAttribute("aria-selected", indeks === 0 ? "true" : "false");
          tab.textContent = pilihan.label;
          tab.addEventListener("click", () => {
            for (const [, t] of tombolTab) {
              t.classList.remove("aktif");
              t.setAttribute("aria-selected", "false");
            }
            tab.classList.add("aktif");
            tab.setAttribute("aria-selected", "true");
            saatUbah(kontrol, pilihan.nilai);
          });
          tombolTab.set(pilihan.nilai, tab);
          baris.append(tab);
        }
        wadah.append(baris);
        elemen.set(kontrol.id, tombolTab);
        break;
      }

      case "pilihan": {
        const grup = document.createElement("div");
        grup.className = "grup-pilihan";
        grup.setAttribute("role", "radiogroup");

        if (kontrol.label) {
          const label = document.createElement("p");
          label.className = "label-pilihan";
          label.textContent = kontrol.label;
          grup.append(label);
        }

        const barisPilihan = document.createElement("div");
        barisPilihan.className = "baris-pilihan";
        const tombolPilihan = new Map();
        for (const pilihan of kontrol.pilihan) {
          const butir = document.createElement("button");
          butir.type = "button";
          butir.className = "pilihan-item";
          butir.setAttribute("role", "radio");
          butir.setAttribute("aria-checked", "false");
          butir.textContent = pilihan.label;
          butir.addEventListener("click", () => {
            for (const [, b] of tombolPilihan) {
              b.classList.remove("aktif");
              b.setAttribute("aria-checked", "false");
            }
            butir.classList.add("aktif");
            butir.setAttribute("aria-checked", "true");
            saatUbah(kontrol, pilihan.nilai);
          });
          tombolPilihan.set(pilihan.nilai, butir);
          barisPilihan.append(butir);
        }
        grup.append(barisPilihan);
        wadah.append(grup);
        elemen.set(kontrol.id, tombolPilihan);
        break;
      }

      case "tombolTahan": {
        const tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "tombol tombol-tahan";
        tombol.textContent = kontrol.label;

        const tekan = (aktif) => {
          tombol.classList.toggle("ditekan", aktif);
          saatUbah(kontrol, aktif);
        };
        tombol.addEventListener("pointerdown", (e) => {
          tombol.setPointerCapture(e.pointerId);
          tekan(true);
        });
        tombol.addEventListener("pointerup", () => tekan(false));
        tombol.addEventListener("pointercancel", () => tekan(false));
        // dukungan keyboard: tahan Space/Enter = tekan, lepas = lepas
        tombol.addEventListener("keydown", (e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            tekan(true);
          }
        });
        tombol.addEventListener("keyup", (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            tekan(false);
          }
        });

        wadah.append(tombol);
        elemen.set(kontrol.id, tombol);
        break;
      }

      case "tombol": {
        const tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = `tombol${kontrol.sekunder ? "-sekunder" : ""} tombol-aksi`;
        tombol.textContent = kontrol.label;
        tombol.addEventListener("click", () => saatUbah(kontrol, true));
        wadah.append(tombol);
        elemen.set(kontrol.id, tombol);
        break;
      }

      case "indikatorLogika": {
        const kotak = document.createElement("div");
        kotak.className = "indikator-logika";
        kotak.setAttribute("role", "status");

        const nilai = document.createElement("span");
        nilai.className = "nilai";
        nilai.textContent = "LOW";

        const keterangan = document.createElement("span");
        keterangan.className = "keterangan";
        keterangan.textContent = `${kontrol.label} · 0 V`;

        kotak.append(nilai, keterangan);
        wadah.append(kotak);
        elemen.set(kontrol.id, { kotak, nilai, keterangan, label: kontrol.label });
        break;
      }

      case "nilai": {
        // kartu angka: label kecil di atas, angka besar + satuan di bawah
        const kotak = document.createElement("div");
        kotak.className = "kartu-nilai";

        const label = document.createElement("span");
        label.className = "label";
        label.textContent = kontrol.label;

        const angka = document.createElement("span");
        angka.className = "angka";
        angka.textContent = "—";

        const satuan = document.createElement("span");
        satuan.className = "satuan";
        satuan.textContent = kontrol.satuan ?? "";

        kotak.append(label, angka, satuan);

        // beberapa kartu nilai berurutan otomatis berjajar dalam satu baris
        let barisNilai = wadah.lastElementChild;
        if (!barisNilai || !barisNilai.classList.contains("baris-nilai")) {
          barisNilai = document.createElement("div");
          barisNilai.className = "baris-nilai";
          wadah.append(barisNilai);
        }
        barisNilai.append(kotak);
        elemen.set(kontrol.id, { kotak, angka });
        break;
      }

      case "rumus": {
        // kartu rumus: judul opsional, lalu baris-baris "simbol → hasil" yang
        // hasilnya diperbarui tiap frame dengan angka rangkaian saat ini
        const kotak = document.createElement("div");
        kotak.className = "kartu-rumus";

        if (kontrol.judul) {
          const judul = document.createElement("p");
          judul.className = "judul-rumus";
          judul.textContent = kontrol.judul;
          kotak.append(judul);
        }

        const hasilBaris = new Map();
        for (const baris of kontrol.baris) {
          const barisEl = document.createElement("div");
          barisEl.className = "baris-rumus";

          const simbol = document.createElement("span");
          simbol.className = "simbol-rumus";
          simbol.textContent = baris.simbol;

          const hasil = document.createElement("span");
          hasil.className = "hasil-rumus";
          hasil.textContent = "—";

          barisEl.append(simbol, hasil);
          kotak.append(barisEl);
          hasilBaris.set(baris.id, hasil);
        }

        wadah.append(kotak);
        elemen.set(kontrol.id, { kotak, hasilBaris });
        break;
      }

      case "teks": {
        const baris = document.createElement("p");
        baris.className = "baris-status";
        wadah.append(baris);
        elemen.set(kontrol.id, baris);
        break;
      }

      default:
        console.warn(`Jenis kontrol belum dikenal: ${kontrol.jenis}`);
    }
  }

  return {
    /** Perbarui indikator HIGH/LOW besar (bentuk sederhana, dipakai Lab 1). */
    setLogika(id, tinggi, tegangan) {
      this.setIndikator(id, {
        nilai: tinggi ? "HIGH" : "LOW",
        varian: tinggi ? "tinggi" : "rendah",
        keterangan: null, // pakai label bawaan
        tegangan,
      });
    },

    /** Bentuk umum indikator: { nilai, varian: "tinggi"|"rendah"|"ambang", keterangan?, tegangan? } */
    setIndikator(id, { nilai, varian, keterangan = null, tegangan = null }) {
      const el = elemen.get(id);
      if (!el || !el.kotak) return;
      const teksKeterangan =
        keterangan ?? `${el.label}${tegangan !== null ? ` · ${tegangan} V` : ""}`;
      if (el.nilai.textContent !== nilai) el.nilai.textContent = nilai;
      if (el.keterangan.textContent !== teksKeterangan) el.keterangan.textContent = teksKeterangan;
      const kelasBaru = `indikator-logika ${varian === "tinggi" ? "tinggi" : varian === "ambang" ? "ambang" : ""}`.trim();
      if (el.kotak.className !== kelasBaru) el.kotak.className = kelasBaru;
    },

    /** Perbarui baris teks status. */
    setTeks(id, teks) {
      const el = elemen.get(id);
      if (el && el.textContent !== teks) el.textContent = teks;
    },

    /** Perbarui angka pada kartu nilai. */
    setAngka(id, teks) {
      const el = elemen.get(id);
      if (el?.angka && el.angka.textContent !== teks) el.angka.textContent = teks;
    },

    /** Perbarui hasil satu baris di kartu rumus (idBaris cocok dengan kontrol.baris[].id). */
    setRumus(id, idBaris, teks) {
      const hasil = elemen.get(id)?.hasilBaris?.get(idBaris);
      if (hasil && hasil.textContent !== teks) hasil.textContent = teks;
    },

    /** Tampilkan/sembunyikan kartu rumus — dipakai toggle "tampilkan rumus" Lab 7. */
    setTampil(id, tampil) {
      const kotak = elemen.get(id)?.kotak;
      if (kotak) kotak.hidden = !tampil;
    },

    /** Setel nilai kontrol secara programatik (toggle: boolean; tab/pilihan: nilai pilihan). */
    setNilai(id, nilai) {
      const el = elemen.get(id);
      if (!el) return;
      if (el instanceof Map) {
        for (const [nilaiPilihan, tombol] of el) {
          const aktif = nilaiPilihan === nilai;
          tombol.classList.toggle("aktif", aktif);
          if (tombol.getAttribute("role") === "tab") tombol.setAttribute("aria-selected", String(aktif));
          else tombol.setAttribute("aria-checked", String(aktif));
        }
      } else if (el?.masukan) {
        el.masukan.value = nilai;
        el.perbaruiBacaan();
      } else if ("checked" in el) {
        el.checked = Boolean(nilai);
      }
    },
  };
}

export function isiPanduan(wadah, langkahLangkah) {
  const daftar = document.createElement("ol");
  daftar.className = "panduan-langkah";
  for (const langkah of langkahLangkah) {
    const butir = document.createElement("li");
    butir.textContent = langkah;
    daftar.append(butir);
  }
  wadah.append(daftar);
}

/**
 * Checklist penyelesaian: tiap butir dicentang otomatis saat cek(state)
 * benar, sama seperti kriteria yang sudah dipakai lab.selesaiJika — bukan
 * self-report, peserta tidak bisa mencentang sendiri. Kembalikan null kalau
 * lab tidak punya kriteriaSelesai (belum semua lab dipindah ke pola ini).
 */
export function isiChecklist(wadah, kriteria) {
  if (!kriteria || kriteria.length === 0) return null;

  const judul = document.createElement("p");
  judul.className = "checklist-judul";
  judul.textContent = "Checklist penyelesaian";
  wadah.append(judul);

  const daftar = document.createElement("div");
  daftar.className = "checklist-daftar";

  const butir = kriteria.map((k) => {
    const item = document.createElement("div");
    item.className = "checklist-item";

    const tanda = document.createElement("span");
    tanda.className = "checklist-tanda";
    tanda.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "checklist-label";
    label.textContent = k.label;

    item.append(tanda, label);
    daftar.append(item);
    return { cek: k.cek, item, tanda, tercapaiSebelumnya: null };
  });

  wadah.append(daftar);

  return {
    /**
     * Evaluasi ulang tiap kriteria terhadap state saat ini — dipanggil tiap frame.
     * paksaSelesai: true kalau lab.id ini sudah pernah ditandai selesai sebelumnya
     * (tersimpan di localStorage) — badge "Selesai" bertahan lintas sesi, tapi
     * state simulasi selalu dimulai ulang dari awal tiap buka halaman, jadi tanpa
     * ini checklist akan terlihat kosong lagi di sebelah badge yang sudah hijau.
     */
    perbarui(state, paksaSelesai = false) {
      for (const b of butir) {
        const tercapai = paksaSelesai || Boolean(b.cek(state));
        if (tercapai === b.tercapaiSebelumnya) continue;
        b.tercapaiSebelumnya = tercapai;
        b.item.classList.toggle("selesai", tercapai);
        b.tanda.textContent = tercapai ? "✓" : "";
      }
    },
  };
}
