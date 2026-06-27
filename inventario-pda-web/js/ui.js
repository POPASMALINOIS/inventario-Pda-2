// js/ui.js
//
// Todo lo que toca el DOM de la tabla principal, los indicadores y la
// barra de herramientas vive aquí. La lógica de filtrado/orden en sí
// (pura, sin DOM) vive en utils.js para poder probarla con Node.

import { COLOR_ESTADO } from "./models.js";

const CLASE_ESTADO = {
  "Operativa": "op",
  "Operativa con incidencias": "inc",
  "No operativa": "noop",
  "En reparación": "rep",
  "No localizada": "noloc",
};

const cuerpoTabla = document.getElementById("cuerpoTabla");

export function pintarTabla(pdasOrdenadas, codigoSeleccionado, onClickFila) {
  cuerpoTabla.innerHTML = "";

  for (const pda of pdasOrdenadas) {
    const tr = document.createElement("tr");
    if (pda.codigo === codigoSeleccionado) tr.classList.add("seleccionada");
    tr.dataset.codigo = pda.codigo;
    tr.addEventListener("click", () => onClickFila(pda.codigo));

    const claseEstado = CLASE_ESTADO[pda.estado] || "";

    tr.innerHTML = `
      <td>${escaparHtml(pda.codigo)}</td>
      <td class="estado-celda ${claseEstado}">${escaparHtml(pda.estado)}</td>
      <td>${escaparHtml(pda.accion_requerida)}</td>
      <td>${escaparHtml(pda.fecha_ultima_revision_fmt || "—")}</td>
      <td>${escaparHtml(pda.revisado_por || "—")}</td>
    `;
    cuerpoTabla.appendChild(tr);
  }
}

export function pintarStats(stats) {
  document.getElementById("statTotal").textContent = stats.total;
  document.getElementById("statOperativas").textContent = stats.operativas;
  document.getElementById("statIncidencias").textContent = stats.con_incidencias;
  document.getElementById("statReparacion").textContent = stats.en_reparacion;
  document.getElementById("statNoLocalizada").textContent = stats.no_localizada;
}

export function marcarBotonVistaActivo(vistaActiva) {
  document.querySelectorAll(".toolbar [data-vista]").forEach((btn) => {
    const activo = btn.dataset.vista === vistaActiva;
    btn.classList.toggle("activo", activo);
    btn.classList.toggle("sec", !activo);
  });
}

export function actualizarEstadoConexion(texto, online) {
  const el = document.getElementById("estadoConexion");
  el.textContent = texto;
  el.classList.toggle("online", online);
  el.classList.toggle("offline", !online);
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// Exportado por si otro módulo necesita el color de un estado (p. ej.
// para reutilizar la misma paleta en algún detalle visual adicional).
export function colorDeEstado(estado) {
  return COLOR_ESTADO[estado] || "#1A1A1A";
}
