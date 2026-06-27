// js/editPanel.js
//
// Panel lateral de edición. Misma filosofía que ui/edit_panel.py en la
// versión de escritorio: sin botón "Guardar", combos/checklist se
// guardan al instante, texto libre con un pequeño debounce.
//
// DIFERENCIA CLAVE respecto a la versión de escritorio:
// Allí, tras guardar, había que emitir manualmente una señal
// "pda_actualizada" para refrescar la tabla. Aquí no hace falta: la
// suscripción en tiempo real de Firestore (store.suscribirseAPdas) ya
// recibe el cambio automáticamente y app.js vuelve a renderizar todo. Lo
// único que este módulo necesita hacer cuando llega una actualización en
// vivo de OTRO PC es decidir si refrescar lo que se está mostrando sin
// "robarle" al operario un campo que esté escribiendo en ese momento
// (ver `sincronizarSiCorresponde`).

import * as store from "./store.js";
import { ACCIONES, ESTADOS, INCIDENCIAS } from "./models.js";

const panelVacio = document.getElementById("panelVacio");
const panelContenido = document.getElementById("panelContenido");
const panelTitulo = document.getElementById("panelTitulo");
const panelMeta = document.getElementById("panelMeta");
const selectEstado = document.getElementById("selectEstado");
const selectAccion = document.getElementById("selectAccion");
const checklistIncidencias = document.getElementById("checklistIncidencias");
const inputRevisadoPor = document.getElementById("inputRevisadoPor");
const textareaObservaciones = document.getElementById("textareaObservaciones");
const btnMarcarOperativa = document.getElementById("btnMarcarOperativa");
const btnLimpiarIncidencias = document.getElementById("btnLimpiarIncidencias");

let pdaActual = null;
let cargando = false; // evita guardados en cascada mientras se rellenan los campos
let debounceTimer = null;
let campoPendiente = null; // { campo, valor }

function poblarSelect(select, opciones) {
  select.innerHTML = "";
  for (const op of opciones) {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    select.appendChild(option);
  }
}

function poblarChecklist() {
  checklistIncidencias.innerHTML = "";
  for (const incidencia of INCIDENCIAS) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = incidencia;
    checkbox.addEventListener("change", onIncidenciasChange);
    label.appendChild(checkbox);
    label.append(incidencia);
    checklistIncidencias.appendChild(label);
  }
}

export function inicializar() {
  poblarSelect(selectEstado, ESTADOS);
  poblarSelect(selectAccion, ACCIONES);
  poblarChecklist();

  selectEstado.addEventListener("change", () => guardarInmediato("estado", selectEstado.value));
  selectAccion.addEventListener("change", () => guardarInmediato("accion_requerida", selectAccion.value));

  inputRevisadoPor.addEventListener("input", () => programarGuardado("revisado_por", inputRevisadoPor.value));
  textareaObservaciones.addEventListener("input", () => programarGuardado("observaciones", textareaObservaciones.value));

  btnMarcarOperativa.addEventListener("click", onMarcarOperativa);
  btnLimpiarIncidencias.addEventListener("click", onLimpiarIncidencias);

  mostrarVacio();
}

export function mostrarVacio() {
  // Se guarda (no se descarta) cualquier edición de texto pendiente
  // antes de vaciar el panel, igual que en la versión de escritorio.
  guardarPendienteAhora();
  pdaActual = null;
  panelVacio.classList.remove("oculto");
  panelContenido.classList.add("oculto");
}

export function cargarPda(pda) {
  guardarPendienteAhora();

  cargando = true;
  pdaActual = pda;
  panelVacio.classList.add("oculto");
  panelContenido.classList.remove("oculto");

  panelTitulo.textContent = pda.codigo;
  selectEstado.value = pda.estado;
  selectAccion.value = pda.accion_requerida;
  inputRevisadoPor.value = pda.revisado_por || "";
  textareaObservaciones.value = pda.observaciones || "";

  const incidenciasActuales = new Set(pda.incidencias || []);
  checklistIncidencias.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.checked = incidenciasActuales.has(cb.value);
  });

  actualizarMeta();
  cargando = false;
}

/**
 * Se llama desde app.js cada vez que llega una actualización en tiempo
 * real de Firestore para la PDA actualmente abierta en el panel (puede
 * venir de OTRO PC, o ser el eco de nuestro propio guardado). Solo
 * re-sincroniza los campos si el operario no tiene ahora mismo el foco
 * puesto en uno de ellos ni una escritura con debounce pendiente, para
 * no "robarle" de las manos un campo que está escribiendo.
 */
export function sincronizarSiCorresponde(pdaActualizada) {
  if (!pdaActual || pdaActualizada.codigo !== pdaActual.codigo) return;
  pdaActual = pdaActualizada;
  actualizarMeta();

  const elementoActivo = document.activeElement;
  const escribiendoEnPanel = panelContenido.contains(elementoActivo) && elementoActivo !== document.body;
  if (campoPendiente || escribiendoEnPanel) return; // no pisar lo que el operario está tecleando

  cargando = true;
  selectEstado.value = pdaActualizada.estado;
  selectAccion.value = pdaActualizada.accion_requerida;
  const incidenciasActuales = new Set(pdaActualizada.incidencias || []);
  checklistIncidencias.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.checked = incidenciasActuales.has(cb.value);
  });
  cargando = false;
}

function actualizarMeta() {
  if (!pdaActual) return;
  const fecha = pdaActual.fecha_ultima_revision_fmt || "Sin revisión registrada todavía";
  const revisor = pdaActual.revisado_por || "—";
  panelMeta.textContent = `Última revisión: ${fecha}    ·    Revisado por: ${revisor}`;
}

function programarGuardado(campo, valor) {
  if (cargando || !pdaActual) return;
  campoPendiente = { campo, valor };
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(guardarPendienteAhora, 400);
}

function guardarPendienteAhora() {
  clearTimeout(debounceTimer);
  if (!campoPendiente || !pdaActual) {
    campoPendiente = null;
    return;
  }
  const { campo, valor } = campoPendiente;
  const codigo = pdaActual.codigo;
  campoPendiente = null;
  store.actualizarCampo(codigo, campo, valor).catch(mostrarErrorGuardado);
}

function guardarInmediato(campo, valor) {
  if (cargando || !pdaActual) return;
  store.actualizarCampo(pdaActual.codigo, campo, valor).catch(mostrarErrorGuardado);
}

function onIncidenciasChange() {
  if (cargando || !pdaActual) return;
  const seleccionadas = Array.from(
    checklistIncidencias.querySelectorAll("input[type=checkbox]:checked"),
  ).map((cb) => cb.value);
  store.actualizarIncidencias(pdaActual.codigo, seleccionadas).catch(mostrarErrorGuardado);
}

function onMarcarOperativa() {
  if (!pdaActual) return;
  guardarPendienteAhora();
  store.marcarOperativa(pdaActual.codigo).catch(mostrarErrorGuardado);
}

function onLimpiarIncidencias() {
  if (!pdaActual) return;
  guardarPendienteAhora();
  store.limpiarIncidencias(pdaActual.codigo).catch(mostrarErrorGuardado);
}

function mostrarErrorGuardado(error) {
  // No se silencia: un fallo de guardado (p. ej. sin conexión y sin
  // caché local disponible) debe ser visible para el operario.
  console.error("Error al guardar:", error);
  alert("No se ha podido guardar el cambio. Revisa la conexión e inténtalo de nuevo.");
}

export function codigoActual() {
  return pdaActual ? pdaActual.codigo : null;
}
