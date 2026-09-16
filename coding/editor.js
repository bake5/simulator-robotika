/*
 * Wrapper editor kode. Sementara berupa <textarea> polos — CodeMirror 6
 * (keputusan resmi di CLAUDE.md) belum divendor ke proyek ini. API di bawah
 * sudah dirancang supaya penggantinya nanti tinggal ditukar isi modul ini
 * saja, tanpa mengubah pemanggil (coding/runner.js maupun kode per-lab).
 */

export function buatEditor(wadah, { kodeAwal = "", onUbah } = {}) {
  const textarea = document.createElement("textarea");
  textarea.className = "editor-kode";
  textarea.spellcheck = false;
  textarea.autocapitalize = "off";
  textarea.autocomplete = "off";
  textarea.setAttribute("aria-label", "Editor kode");
  textarea.value = kodeAwal;

  textarea.addEventListener("input", () => onUbah?.(textarea.value));
  // Tab menyisipkan indentasi, bukan pindah fokus — kebiasaan yang diharapkan dari editor kode.
  textarea.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const { selectionStart, selectionEnd, value } = textarea;
    textarea.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
    onUbah?.(textarea.value);
  });

  wadah.append(textarea);

  return {
    ambilKode: () => textarea.value,
    setKode(kode) {
      textarea.value = kode;
    },
  };
}
