// js/app.js
//
// Punto de entrada de la aplicación web. Orquesta: autenticación anónima,
// siembra inicial, suscripción en tiempo real a Firestore, y conecta los
// eventos de la barra de herramientas con el renderizado (ui.js) y el
// panel de edición (editPanel.js).

import { asegurarSesion } from "./firebase-config.js";
import * as store from "./store.js";
import * as ui from "./ui.js";
import * as editPanel from "./editPanel.js";
import { exportarExcel } from "./exportExcel.js";
import { exportarPdf } from "./exportPdf.js";
import { calcularEstadisticas, filtrarPdas, ordenarPdas } from "./utils.js";

// --- Estado de la aplicación (única fuente de verdad en memoria) ---
let todasLasPdas = [];
let textoBusqueda = "";
let vistaActual = "todas";
let columnaOrden = "codigo";
let ordenAscendente = true;

function pdasConFechaFormateada(pdas) {
  // Adjunta fecha_ultima_revision_fmt (texto "YYYY-MM-DD HH:MM") a cada
  // PDA, derivado del Timestamp de Firestore. Se hace una sola vez aquí
  // para que ui.js, editPanel.js y los módulos de exportación no tengan
  // que conocer el formato nativo de Firestore.
  return pdas.map((p) => ({
    ...p,
    fecha_ultima_revision_fmt: store.formatearFecha(p.fecha_ultima_revision),
  }));
}

function renderizarTodo() {
  const filtradas = filtrarPdas(todasLasPdas, textoBusqueda, vistaActual);
  const ordenadas = ordenarPdas(filtradas, columnaOrden, ordenAscendente);

  ui.pintarTabla(ordenadas, editPanel.codigoActual(), onClickFila);
  ui.pintarStats(calcularEstadisticas(todasLasPdas));

  const codigoAbierto = editPanel.codigoActual();
  if (codigoAbierto) {
    const actualizada = todasLasPdas.find((p) => p.codigo === codigoAbierto);
    if (actualizada) editPanel.sincronizarSiCorresponde(actualizada);
  }
}

function onClickFila(codigo) {
  const pda = todasLasPdas.find((p) => p.codigo === codigo);
  if (!pda) return;
  editPanel.cargarPda(pda);
  renderizarTodo(); // para resaltar la fila seleccionada
}

function inicializarToolbar() {
  const buscador = document.getElementById("buscador");
  buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value;
    renderizarTodo();
  });

  document.querySelectorAll(".toolbar [data-vista]").forEach((btn) => {
    btn.addEventListener("click", () => {
      vistaActual = btn.dataset.vista;
      ui.marcarBotonVistaActivo(vistaActual);
      renderizarTodo();
    });
  });

  document.querySelectorAll("thead [data-col]").forEach((th) => {
    th.addEventListener("click", () => {
      const columna = th.dataset.col;
      if (columnaOrden === columna) {
        ordenAscendente = !ordenAscendente;
      } else {
        columnaOrden = columna;
        ordenAscendente = true;
      }
      renderizarTodo();
    });
  });

  document.getElementById("btnExportarExcel").addEventListener("click", () => {
    exportarExcel(todasLasPdas, calcularEstadisticas(todasLasPdas));
  });

  document.getElementById("btnExportarPdf").addEventListener("click", () => {
    const responsable = window.prompt("Nombre del responsable del inventario:", "");
    if (responsable === null) return; // cancelado
    exportarPdf(todasLasPdas, calcularEstadisticas(todasLasPdas), responsable.trim() || "—");
  });
}

function inicializarEstadoConexion() {
  const actualizar = () => ui.actualizarEstadoConexion(
    navigator.onLine ? "Conectado" : "Sin conexión — mostrando últimos datos guardados",
    navigator.onLine,
  );
  window.addEventListener("online", actualizar);
  window.addEventListener("offline", actualizar);
  actualizar();
}

async function iniciar() {
  inicializarToolbar();
  inicializarEstadoConexion();
  editPanel.inicializar();

  try {
    await asegurarSesion();
    await store.inicializarSiVacio();
  } catch (error) {
    console.error("Error al iniciar sesión o sembrar datos:", error);
    ui.actualizarEstadoConexion("Error de conexión con la base de datos", false);
  }

  store.suscribirseAPdas((pdas) => {
    todasLasPdas = pdasConFechaFormateada(pdas);
    renderizarTodo();
  });
}

iniciar();
