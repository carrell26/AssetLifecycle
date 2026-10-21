/**
 * Utility helper untuk sorting data tabel (teks, angka, tanggal)
 */

export function parseDateValue(dateStr) {
  if (!dateStr || dateStr === "-" || typeof dateStr !== "string") return -Infinity;

  const trimmed = dateStr.trim();
  // Format DD/MM/YYYY
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d).getTime();
      }
    }
  }

  // Format YYYY-MM-DD or standard parseable dates
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? -Infinity : parsed;
}

export function sortData(items = [], sortKey = null, direction = null, columnTypes = {}) {
  if (!sortKey || !direction || !Array.isArray(items) || items.length <= 1) {
    return items;
  }

  const colType = columnTypes[sortKey] || "text";

  return [...items].sort((a, b) => {
    const rawA = a[sortKey];
    const rawB = b[sortKey];

    const isAEmpty =
      rawA === undefined || rawA === null || rawA === "" || rawA === "-";
    const isBEmpty =
      rawB === undefined || rawB === null || rawB === "" || rawB === "-";

    // Data kosong selalu diletakkan di urutan paling bawah
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return 1;
    if (isBEmpty) return -1;

    let result = 0;

    if (colType === "date") {
      const timeA = parseDateValue(String(rawA));
      const timeB = parseDateValue(String(rawB));
      result = timeA - timeB;
    } else if (colType === "number") {
      const numA = parseFloat(String(rawA).replace(/[^0-9.-]/g, ""));
      const numB = parseFloat(String(rawB).replace(/[^0-9.-]/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        result = numA - numB;
      } else {
        result = String(rawA).localeCompare(String(rawB), undefined, {
          numeric: true,
        });
      }
    } else {
      // Teks (A-Z) dengan dukungan perbandingan numerik natural
      result = String(rawA).localeCompare(String(rawB), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return direction === "asc" ? result : -result;
  });
}
