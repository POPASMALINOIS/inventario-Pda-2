// js/exportPdf.js
//
// Exportación a PDF usando jsPDF + jspdf-autotable (variables globales
// cargadas por <script> en index.html: window.jspdf.jsPDF). Mismo
// contenido que la versión de escritorio (export/pdf_export.py): fecha,
// responsable, resumen estadístico y listado de incidencias.

import { pdasQueRequierenAtencion } from "./utils.js";

const COLOR_HEADER = [32, 32, 32];
const COLOR_BORDE = [213, 213, 213];
const COLOR_FONDO_CLARO = [242, 242, 242];

export function exportarPdf(pdas, stats, responsable) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const ahora = new Date();
  const fechaTexto = `${String(ahora.getDate()).padStart(2, "0")}/${String(ahora.getMonth() + 1).padStart(2, "0")}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  doc.setFontSize(16);
  doc.setTextColor(...COLOR_HEADER);
  doc.text("INVENTARIO PDA EXPEDICIÓN", 16, 18);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Fecha del inventario: ${fechaTexto}`, 16, 25);
  doc.text(`Responsable: ${responsable}`, 16, 30);

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_HEADER);
  doc.text("Resumen estadístico", 16, 40);

  doc.autoTable({
    startY: 43,
    head: [],
    body: [
      ["Total PDA", String(stats.total)],
      ["Operativas", String(stats.operativas)],
      ["Con incidencias", String(stats.con_incidencias)],
      ["No operativa", String(stats.no_operativa)],
      ["En reparación", String(stats.en_reparacion)],
      ["No localizadas", String(stats.no_localizada)],
    ],
    theme: "grid",
    styles: { fontSize: 9, lineColor: COLOR_BORDE, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 80, fillColor: COLOR_FONDO_CLARO },
      1: { cellWidth: 40, halign: "right" },
    },
    margin: { left: 16 },
  });

  const pendientes = pdasQueRequierenAtencion(pdas);
  const finResumenY = doc.lastAutoTable.finY + 10;

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_HEADER);
  doc.text("Listado de incidencias", 16, finResumenY);

  if (pendientes.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_HEADER);
    doc.text("No se han detectado incidencias en este inventario.", 16, finResumenY + 7);
  } else {
    doc.autoTable({
      startY: finResumenY + 3,
      head: [["Código", "Estado", "Incidencias", "Acción requerida"]],
      body: pendientes.map((p) => [
        p.codigo,
        p.estado,
        (p.incidencias && p.incidencias.length) ? p.incidencias.join(", ") : "—",
        p.accion_requerida,
      ]),
      theme: "grid",
      styles: { fontSize: 8, lineColor: COLOR_BORDE, lineWidth: 0.2 },
      headStyles: { fillColor: COLOR_HEADER, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 75 },
        3: { cellWidth: 35 },
      },
      margin: { left: 16 },
    });
  }

  const nombreArchivo = `Inventario_PDA_Expedicion_${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}${String(ahora.getDate()).padStart(2, "0")}_${String(ahora.getHours()).padStart(2, "0")}${String(ahora.getMinutes()).padStart(2, "0")}.pdf`;
  doc.save(nombreArchivo);
}
