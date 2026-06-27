// js/store.js
//
// Toda la interacción con Firestore pasa por aquí — igual que database.py
// era la única fuente de SQL en la versión de escritorio, este archivo es
// la única fuente de llamadas a Firestore. El resto del código (ui.js,
// editPanel.js, app.js) solo llama a estas funciones.
//
// MODELO DE DATOS — por qué un documento por PDA con un array de
// incidencias (y no una subcolección, como hacía la tabla SQL aparte):
// SQLite es relacional, así que normalizar las incidencias en su propia
// tabla evitaba parsear texto y respetaba la 1ª forma normal. Firestore es
// un almacén de documentos: aquí lo natural e idiomático es justo lo
// contrario, anidar la lista de incidencias (máximo 13 valores posibles)
// como un campo array dentro del propio documento de la PDA. Así cada
// lectura/escritura de una PDA es una sola operación, en vez de tener que
// cruzar una colección con otra.

import {
  collection, doc, getDoc, getDocs, onSnapshot, query,
  serverTimestamp, updateDoc, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { ACCIONES, ESTADOS, SECCION } from "./models.js";
import { formatearFechaDate, generarCodigosIniciales } from "./utils.js";

const COLECCION_PDAS = "pdas";
const DOC_META_SEED = doc(db, "meta", "estado_inicial");

function pdaRef(codigo) {
  return doc(db, COLECCION_PDAS, codigo);
}

/**
 * Convierte el Timestamp de Firestore (o null si la escritura aún no ha
 * sido confirmada por el servidor) en el mismo formato de texto
 * "YYYY-MM-DD HH:MM" que usaba la versión de escritorio. La lógica de
 * formato en sí vive en utils.js (formatearFechaDate) para poder probarla
 * con Node sin depender de Firestore.
 */
export function formatearFecha(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return null;
  return formatearFechaDate(timestamp.toDate());
}

/**
 * Siembra las 160 PDA iniciales (CA001-CA080, EX001-EX080) la primera vez
 * que la app se usa en el proyecto Firebase, igual que hacía
 * database._seed_initial_pdas en la versión de escritorio.
 *
 * Protección contra doble siembra: si dos PCs abren la app por primera
 * vez casi a la vez, ambos intentan crear el documento "meta/estado_inicial".
 * Solo uno de los dos lo conseguirá (el otro recibirá un error de permiso
 * porque las Reglas de seguridad solo permiten crear ese documento si
 * todavía no existe) y será el único que siembre los 160 documentos.
 */
export async function inicializarSiVacio() {
  const metaSnap = await getDoc(DOC_META_SEED);
  if (metaSnap.exists()) return;

  try {
    const batchMeta = writeBatch(db);
    batchMeta.set(DOC_META_SEED, { creado: serverTimestamp() });
    await batchMeta.commit();
  } catch {
    // Otro PC ganó la carrera y ya reservó la siembra: no hacemos nada.
    return;
  }

  const existentes = await getDocs(collection(db, COLECCION_PDAS));
  if (!existentes.empty) return;

  const batch = writeBatch(db);
  for (const codigo of generarCodigosIniciales()) {
    batch.set(pdaRef(codigo), {
      codigo,
      seccion: SECCION,
      estado: ESTADOS[0],
      accion_requerida: ACCIONES[0],
      incidencias: [],
      fecha_ultima_revision: null,
      revisado_por: "",
      observaciones: "",
    });
  }
  await batch.commit();
}

/**
 * Suscripción en tiempo real a las 160 PDA. `callback` se llama una vez
 * al conectar y, a partir de ahí, cada vez que cualquier PC cambia algo.
 * Devuelve la función de "darse de baja" de la suscripción.
 */
export function suscribirseAPdas(callback) {
  return onSnapshot(query(collection(db, COLECCION_PDAS)), (snap) => {
    const pdas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    pdas.sort((a, b) => a.codigo.localeCompare(b.codigo));
    callback(pdas);
  });
}

const CAMPOS_EDITABLES = new Set(["estado", "accion_requerida", "revisado_por", "observaciones"]);

export async function actualizarCampo(codigo, campo, valor) {
  if (!CAMPOS_EDITABLES.has(campo)) {
    throw new Error(`Campo no editable: ${campo}`);
  }
  await updateDoc(pdaRef(codigo), {
    [campo]: valor,
    fecha_ultima_revision: serverTimestamp(),
  });
}

export async function actualizarIncidencias(codigo, incidencias) {
  await updateDoc(pdaRef(codigo), {
    incidencias,
    fecha_ultima_revision: serverTimestamp(),
  });
}

/** Botón rápido "MARCAR OPERATIVA". */
export async function marcarOperativa(codigo) {
  await updateDoc(pdaRef(codigo), {
    estado: ESTADOS[0],
    accion_requerida: ACCIONES[0],
    incidencias: [],
    fecha_ultima_revision: serverTimestamp(),
  });
}

/** Botón rápido "LIMPIAR INCIDENCIAS" (no toca el estado, igual que en database.py). */
export async function limpiarIncidencias(codigo) {
  await updateDoc(pdaRef(codigo), {
    incidencias: [],
    fecha_ultima_revision: serverTimestamp(),
  });
}
