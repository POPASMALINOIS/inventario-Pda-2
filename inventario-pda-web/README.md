# Inventario PDA Expedición — Versión Web / PWA

App web para el inventario semanal de las 160 terminales PDA de la sección EXPEDICIÓN. Funciona en cualquier navegador moderno sin instalar nada, y puede convertirse en una app de escritorio para Windows mediante PWABuilder.

---

## Arquitectura

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | HTML/CSS/JS vanilla | Sin build, sin npm, funciona directamente en GitHub Pages |
| Base de datos compartida | Firebase Firestore | Datos en tiempo real visibles simultáneamente en todos los PCs del almacén |
| Autenticación | Firebase Anonymous Auth | Invisible para el operario; permite aplicar reglas de seguridad sin pantalla de login |
| Exportación Excel | SheetJS (CDN) | Mismo resultado que la versión de escritorio (openpyxl) |
| Exportación PDF | jsPDF + autoTable (CDN) | Mismo resultado que la versión de escritorio (reportlab) |
| Instalación Windows | PWABuilder | Convierte la URL de GitHub Pages en un instalador .msix sin código adicional |

**Diferencia clave con la versión de escritorio (SQLite):** los datos ya no son locales. Todos los PCs leen y escriben contra el mismo proyecto Firebase, de modo que cualquier cambio aparece en el resto de equipos en tiempo real. Firebase amortigua caídas breves de wifi (caché IndexedDB local), pero no hay un modo "100% sin internet" real.

---

## Paso 1 — Crear el proyecto Firebase (gratis, sin tarjeta)

1. Ve a https://console.firebase.google.com/ e inicia sesión con una cuenta Google del almacén.
2. Haz clic en **Añadir proyecto**, ponle un nombre (ej. `inventario-pda-expedicion`) y crea el proyecto.

### 1a — Activar Firestore

3. En el menú lateral: **Firestore Database → Crear base de datos**.
4. Elige **Modo producción** (las reglas de seguridad del paso siguiente lo protegen correctamente).
5. Elige la región más cercana (ej. `europe-west3` para Europa central).

### 1b — Subir las reglas de seguridad

6. En Firestore → pestaña **Reglas** → pega el contenido del archivo `firestore.rules` incluido en este proyecto → **Publicar**.

### 1c — Activar autenticación anónima

7. Menú lateral: **Authentication → Comenzar → Sign-in method**.
8. Habilita **Anónimo** y guarda.

### 1d — Obtener las credenciales de la app

9. Icono de engranaje (arriba a la izquierda) → **Configuración del proyecto → Tus apps → Añadir app → Web (`</>`)**.
10. Ponle un nombre (ej. `inventario-web`) y haz clic en **Registrar app**.
11. Copia el objeto `firebaseConfig` que aparece (tiene `apiKey`, `authDomain`, etc.).

---

## Paso 2 — Configurar la app

Abre el archivo `js/firebase-config.js` y reemplaza los valores de ejemplo con los que copiaste en el paso anterior:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",           // ← pega aquí
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:...",
};
```

Estos valores **no son secretos** (cualquier usuario que abra la app los ve igualmente en el código). La seguridad real viene de las reglas de Firestore, no de ocultar esta configuración.

---

## Paso 3 — Publicar en GitHub Pages

1. Crea un repositorio en GitHub (puede ser privado o público).
2. Sube todos los archivos de este proyecto a la rama `main` (o `master`).
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)** → Guardar.
4. En unos segundos GitHub Pages publica la app en: `https://tu-usuario.github.io/nombre-del-repositorio/`

> **Importante:** Vuelve a Firebase → **Authentication → Settings → Authorized domains** y añade `tu-usuario.github.io`. Sin esto, Firebase rechazará las conexiones desde tu URL de Pages.

---

## Paso 4 — Usar la app

Abre la URL de GitHub Pages en cualquier navegador de los PCs del almacén. La primera vez que se abre siembra automáticamente las 160 terminales (CA001-CA080 y EX001-EX080) en Firestore. A partir de ahí todos los PCs ven los mismos datos en tiempo real.

### Instalar como PWA (acceso directo en el escritorio)

- **Chrome / Edge:** aparece un icono de instalación en la barra de direcciones → clic → "Instalar". La app se abre en su propia ventana sin la barra del navegador.
- **Firefox:** menú (⋮) → "Instalar sitio como aplicación".

---

## Paso 5 (opcional) — Convertir en ejecutable Windows (.msix)

Si prefieres un instalador de Windows en lugar de un acceso directo del navegador:

1. Publica la app en GitHub Pages y comprueba que funciona bien en el navegador.
2. Ve a https://www.pwabuilder.com/ y pega la URL de tu GitHub Pages.
3. PWABuilder analiza la PWA y ofrece paquetes descargables → elige **Windows → Descargar paquete**.
4. El paquete incluye un archivo `.msix` firmado con un certificado autogenerado y las instrucciones para instalarlo en Windows 10/11 (WebView2, que ya viene preinstalado en Windows 11 y en Windows 10 actualizado).

---

## Estructura de archivos

```
inventario-pda-web/
├── index.html              ← UI completa (tabla + panel de edición)
├── manifest.json           ← Configuración PWA
├── service-worker.js       ← Caché del app shell (carga rápida sin red)
├── firestore.rules         ← Reglas de seguridad (subir a la consola Firebase)
├── css/
│   └── styles.css          ← Paleta industrial (idéntica a la versión de escritorio)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── js/
│   ├── models.js           ← Constantes de dominio (estados, incidencias, acciones)
│   ├── utils.js            ← Lógica pura sin dependencias (filtrar, ordenar, stats)
│   ├── firebase-config.js  ← ⚠ RELLENAR con tus credenciales Firebase
│   ├── store.js            ← Acceso a Firestore (lectura/escritura/suscripción)
│   ├── ui.js               ← Renderizado de la tabla e indicadores
│   ├── editPanel.js        ← Panel de edición con guardado automático
│   ├── exportExcel.js      ← Exportación a .xlsx (SheetJS)
│   ├── exportPdf.js        ← Exportación a .pdf (jsPDF + autoTable)
│   └── app.js              ← Punto de entrada: orquesta todo lo anterior
└── tests/
    └── utils.test.mjs      ← 6 tests unitarios (node --test tests/utils.test.mjs)
```

---

## Tests

```bash
node --test tests/utils.test.mjs
```

6 pruebas unitarias sobre la lógica pura (generación de códigos, formato de fecha, estadísticas, filtrado, ordenación). No requieren red ni Firebase.
