// js/models.js
//
// Constantes de dominio (listas cerradas de valores). Misma fuente única
// de verdad que tenía models.py en la versión de escritorio: tanto los
// <select>/checklist del HTML como las reglas de negocio referencian
// estas mismas listas.

export const ESTADOS = [
  "Operativa",
  "Operativa con incidencias",
  "No operativa",
  "En reparación",
  "No localizada",
];

export const INCIDENCIAS = [
  "No enciende",
  "No carga",
  "No tiene conexión",
  "No conecta con AS400",
  "Pantalla rota",
  "Botones dañados",
  "Batería defectuosa",
  "Lector código de barras averiado",
  "Golpes o carcasa rota",
  "Carcasa protectora perdida",
  "Base de carga defectuosa",
  "No contiene aplicaciones",
  "Otro",
];

export const ACCIONES = [
  "Ninguna",
  "Revisar",
  "Reparar",
  "Sustituir batería",
  "Sustituir terminal",
  "Baja",
];

export const SECCION = "EXPEDICIÓN";

// Mismos colores que la versión de escritorio (ver models.py para la
// justificación del color elegido para "No operativa", que no estaba
// definido en la especificación original).
export const COLOR_ESTADO = {
  "Operativa": "#73A65A",
  "Operativa con incidencias": "#C98A1B",
  "No operativa": "#8E2E22",
  "En reparación": "#B23A2E",
  "No localizada": "#4A4A4A",
};

export const VISTA = {
  TODAS: "todas",
  INCIDENCIAS: "incidencias",
  REPARACION: "reparacion",
  NO_LOCALIZADA: "no_localizada",
};
