// js/utils.js
//
// Funciones puras, sin ninguna dependencia de Firebase ni del DOM. Se
// separan deliberadamente en su propio archivo para poder probarlas con
// Node sin necesitar red ni un navegador (ver tests/utils.test.mjs).

/**
 * Genera los 160 códigos iniciales: CA001-CA080, EX001-EX080.
 */
export function generarCodigosIniciales() {
  const codigos = [];
  for (const prefijo of ["CA", "EX"]) {
    for (let n = 1; n <= 80; n++) {
      codigos.push(`${prefijo}${String(n).padStart(3, "0")}`);
    }
  }
  return codigos;
}

/**
 * Formatea un objeto Date de JavaScript como "YYYY-MM-DD HH:MM", igual
 * que hacía la versión de escritorio (database.py:_touch_revision).
 */
export function formatearFechaDate(date) {
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Calcula los contadores de los indicadores superiores y de los
 * resúmenes de exportación, igual que database.get_estadisticas().
 */
export function calcularEstadisticas(pdas) {
  const stats = {
    total: pdas.length,
    operativas: 0,
    con_incidencias: 0,
    no_operativa: 0,
    en_reparacion: 0,
    no_localizada: 0,
  };
  for (const p of pdas) {
    if (p.estado === "Operativa") stats.operativas++;
    else if (p.estado === "Operativa con incidencias") stats.con_incidencias++;
    else if (p.estado === "No operativa") stats.no_operativa++;
    else if (p.estado === "En reparación") stats.en_reparacion++;
    else if (p.estado === "No localizada") stats.no_localizada++;
  }
  return stats;
}

/**
 * Aplica el buscador instantáneo (subcadena sobre el código, sin
 * distinguir mayúsculas/minúsculas) y la vista rápida seleccionada
 * (todas / incidencias / reparacion / no_localizada). Ambos criterios se
 * combinan con AND, igual que hacía ui/pda_table_model.py.
 */
export function filtrarPdas(pdas, texto, vista) {
  const t = (texto || "").trim().toLowerCase();
  return pdas.filter((p) => {
    if (t && !p.codigo.toLowerCase().includes(t)) return false;
    if (vista === "incidencias" && p.estado !== "Operativa con incidencias") return false;
    if (vista === "reparacion" && p.estado !== "En reparación") return false;
    if (vista === "no_localizada" && p.estado !== "No localizada") return false;
    return true;
  });
}

/**
 * PDA que deben aparecer en el "Listado de incidencias" del PDF/Excel:
 * cualquiera que no esté en estado "Operativa" (ver pdf_export.py para
 * la justificación de esta interpretación).
 */
export function pdasQueRequierenAtencion(pdas) {
  return pdas.filter((p) => (p.incidencias && p.incidencias.length > 0) || p.estado !== "Operativa");
}

/**
 * Ordena por una columna de texto, ascendente o descendente. Las fechas
 * ya vienen formateadas como "YYYY-MM-DD HH:MM" (ver formatearFechaDate),
 * así que el orden lexicográfico de texto coincide con el cronológico.
 */
export function ordenarPdas(pdas, columna, ascendente) {
  const copia = [...pdas];
  copia.sort((a, b) => {
    const va = (a[columna] ?? "").toString().toLowerCase();
    const vb = (b[columna] ?? "").toString().toLowerCase();
    if (va < vb) return ascendente ? -1 : 1;
    if (va > vb) return ascendente ? 1 : -1;
    return 0;
  });
  return copia;
}
