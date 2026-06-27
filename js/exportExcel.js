// js/exportExcel.js
//
// Exportación a .xlsx usando SheetJS (variable global XLSX cargada por
// <script> en index.html). Misma estructura que la versión de
// escritorio (export/excel_export.py): hoja "Inventario" con una fila
// por PDA, hoja "Resumen" con los contadores.

export function exportarExcel(pdas, stats) {
  const cabeceras = [
    "Código PDA", "Estado", "Incidencias", "Acción requerida",
    "Última revisión", "Revisado por", "Observaciones",
  ];

  const filas = pdas.map((p) => [
    p.codigo,
    p.estado,
    (p.incidencias || []).join(", "),
    p.accion_requerida,
    p.fecha_ultima_revision_fmt || "",
    p.revisado_por || "",
    p.observaciones || "",
  ]);

  const hojaInventario = XLSX.utils.aoa_to_sheet([cabeceras, ...filas]);
  hojaInventario["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 40 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 40 },
  ];

  const ahora = new Date();
  const fechaTexto = `${String(ahora.getDate()).padStart(2, "0")}/${String(ahora.getMonth() + 1).padStart(2, "0")}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  const filasResumen = [
    ["Inventario PDA Expedición"],
    [`Generado: ${fechaTexto}`],
    [],
    ["Total PDA", stats.total],
    ["Operativas", stats.operativas],
    ["Con incidencias", stats.con_incidencias],
    ["No operativa", stats.no_operativa],
    ["En reparación", stats.en_reparacion],
    ["No localizadas", stats.no_localizada],
  ];
  const hojaResumen = XLSX.utils.aoa_to_sheet(filasResumen);
  hojaResumen["!cols"] = [{ wch: 22 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaInventario, "Inventario");
  XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");

  const nombreArchivo = `Inventario_PDA_Expedicion_${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}${String(ahora.getDate()).padStart(2, "0")}_${String(ahora.getHours()).padStart(2, "0")}${String(ahora.getMinutes()).padStart(2, "0")}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}
