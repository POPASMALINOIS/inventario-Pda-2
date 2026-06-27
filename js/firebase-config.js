// js/firebase-config.js
//
// DECISIÓN DE ARQUITECTURA — por qué Firebase:
// GitHub Pages solo sirve archivos estáticos: no hay ningún servidor
// nuestro ejecutándose, así que para que VARIOS PCs del almacén vean y
// editen el MISMO inventario en tiempo real, los datos tienen que vivir
// en algún sitio de la red accesible desde el navegador de cada equipo.
// Firebase Firestore se eligió porque:
//   - Tiene un plan gratuito (Spark) más que suficiente para 160
//     documentos con ediciones ocasionales de un puñado de PCs.
//   - Se usa directamente desde JavaScript del navegador, sin escribir
//     ni mantener ningún servidor propio.
//   - Soporta escuchas en tiempo real (onSnapshot): un cambio hecho en
//     un PC aparece solo, sin recargar, en todos los demás.
//   - Tiene caché local persistente (IndexedDB) incorporada: si el wifi
//     del almacén falla un momento, la app sigue mostrando los últimos
//     datos conocidos y encola los cambios hasta reconectar.
//
// PASOS PARA OBTENER TUS PROPIOS VALORES (gratis, sin tarjeta):
//   1. Ve a https://console.firebase.google.com/ y crea un proyecto.
//   2. Dentro del proyecto: icono de engranaje > "Configuración del
//      proyecto" > pestaña "Tus apps" > añade una app web (</>) .
//   3. Copia el objeto "firebaseConfig" que te muestra y pégalo abajo.
//   4. Activa Firestore: menú lateral > "Firestore Database" > "Crear
//      base de datos" (modo producción) y sube las reglas de
//      firestore.rules incluidas en este proyecto.
//   5. Activa autenticación anónima: menú lateral > "Authentication" >
//      "Sign-in method" > habilita "Anónimo".
//   6. Añade tu dominio de GitHub Pages (ej. tuusuario.github.io) en
//      "Authentication" > "Settings" > "Authorized domains".
//
// Estos valores NO son secretos (no dan acceso por sí solos a nada): la
// seguridad real la dan las Reglas de seguridad de Firestore
// (firestore.rules), no el ocultamiento de esta configuración.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

export const app = initializeApp(firebaseConfig);

// Caché local persistente: lecturas siguen funcionando sin red, y las
// escrituras hechas sin conexión se encolan y se sincronizan solas en
// cuanto vuelve la red.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const auth = getAuth(app);

let sesionLista = null;

/**
 * Garantiza que hay una sesión anónima activa antes de leer/escribir en
 * Firestore. Es invisible para el operario: no hay pantalla de login,
 * solo sirve para que las Reglas de seguridad puedan exigir
 * "request.auth != null" en vez de dejar la base de datos abierta a
 * cualquiera que descubra la URL.
 */
export function asegurarSesion() {
  if (!sesionLista) {
    sesionLista = signInAnonymously(auth);
  }
  return sesionLista;
}
