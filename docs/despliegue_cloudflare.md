# Cómo publicar AnesHealth en Cloudflare (guía paso a paso)

> **Para quién es esta guía.** Está escrita para alguien **sin conocimientos
> técnicos**. No hay que programar nada: solo hacer clic, copiar y pegar textos tal
> cual aparecen aquí. Cada vez que veas un recuadro con texto, cópialo **exactamente**,
> sin cambiar mayúsculas ni espacios.

> **⚠️ Muy importante — cuándo hacer esto.** Esta migración hay que hacerla **ANTES**
> de empezar a usar el programa con pacientes reales. El motivo: los códigos QR que se
> entregan a los pacientes llevan impresa la dirección web del programa. Si imprimes
> QR con la dirección antigua (la de pruebas, GitHub Pages) y luego cambias de
> dirección, **esos QR dejarían de funcionar**. Por eso primero se fija la dirección
> definitiva (Cloudflare) y, a partir de ahí, ya se pueden imprimir QR para pacientes.

---

## Qué vamos a conseguir

Al terminar esta guía tendrás:

1. El código del programa en un repositorio **privado** (solo lo ve quien tú autorices).
2. **Dos páginas publicadas** en Cloudflare, gratis:
   - La aplicación de **enfermería** (la entrevista completa).
   - La **vista del paciente** (la hoja que se abre al escanear el QR), en la
     dirección `.../paciente/`.
3. La aplicación de enfermería **protegida con contraseña por correo**: solo entra
   quien tenga un correo del hospital (`@vithas.es`). La vista del paciente queda
   **sin protección**, para que cualquier paciente pueda abrir su hoja desde casa.
4. (Opcional) Un **dominio propio** más bonito y fácil de recordar.

Todo con los **planes gratuitos** de Cloudflare.

---

## Antes de empezar: lo que necesitas tener a mano

- La cuenta de **GitHub** donde está el proyecto (`holaaneshealth-eng/preanestesia`).
- Un **correo electrónico** para crear la cuenta de Cloudflare (puede ser el tuyo).
- La lista de **correos del personal** que debe poder entrar en la app de enfermería
  (todos deberían terminar en `@vithas.es`).
- Unos 30–45 minutos sin prisa.

---

## Paso 1 — Poner el repositorio en privado

Mientras ha sido un proyecto en pruebas, el repositorio podía estar en abierto. Para
usarlo de verdad conviene que sea **privado**.

1. Entra en GitHub y abre el repositorio: `https://github.com/holaaneshealth-eng/preanestesia`.
2. Arriba, pulsa en **Settings** (Configuración).
3. Baja del todo hasta la zona **Danger Zone** (Zona de peligro).
4. Busca **Change repository visibility** (Cambiar visibilidad) y pulsa **Change visibility**.
5. Elige **Make private** (Hacer privado) y confirma escribiendo el nombre del
   repositorio cuando te lo pida.

> ✅ A partir de ahora el código solo lo verá quien tú invites. Cloudflare, al que
> conectaremos a continuación, **sí** podrá leerlo porque tú le darás permiso en el
> paso 2.

---

## Paso 2 — Crear la cuenta de Cloudflare y conectar GitHub

1. Entra en `https://dash.cloudflare.com/sign-up` y crea una cuenta gratuita con tu
   correo. Confirma el correo de verificación que te llegue.
2. Una vez dentro, en el menú de la izquierda busca **Workers & Pages** y pulsa en él.
3. Pulsa el botón **Create** (Crear) y luego la pestaña **Pages**.
4. Pulsa **Connect to Git** (Conectar con Git) y elige **GitHub**.
5. Cloudflare te pedirá permiso para acceder a tus repositorios de GitHub. Autorízalo
   y, cuando pregunte a qué repositorios, selecciona **solo** `preanestesia`
   (recomendado) o todos, como prefieras.
6. De vuelta en Cloudflare, en la lista de repositorios elige **preanestesia** y pulsa
   **Begin setup** (Comenzar configuración).

---

## Paso 3 — Configurar la compilación (¡los valores exactos!)

Esta es la pantalla más importante. Cloudflare te mostrará varios campos. Rellénalos
**exactamente** con estos valores (copia y pega):

| Campo en Cloudflare | Qué escribir (valor exacto) |
|---|---|
| **Project name** (Nombre del proyecto) | `aneshealth` |
| **Production branch** (Rama de producción) | `main` |
| **Framework preset** (Preajuste de framework) | `None` (Ninguno) — o `Vite` si aparece |
| **Build command** (Orden de compilación) | `npm run build:prod` |
| **Build output directory** (Carpeta de salida) | `dist` |
| **Root directory** (Carpeta raíz) | *(déjalo vacío)* |

> **🔴 Clave:** la orden de compilación tiene que ser **`npm run build:prod`**, NO
> `npm run build`. La versión `build:prod` es la de **producción ofuscada** (código
> protegido). Si pusieras `npm run build`, se publicaría la versión sin ofuscar.

Después, en la misma pantalla, despliega **Environment variables (advanced)**
(Variables de entorno, avanzado) y añade **una** variable, para fijar la versión de
Node correcta:

| Variable (Variable name) | Valor (Value) |
|---|---|
| `NODE_VERSION` | `22` |

> La versión de Node debe ser **22**. Es con la que está probado el programa.

Cuando lo tengas todo relleno, pulsa **Save and Deploy** (Guardar y desplegar).
Cloudflare construirá el programa (tarda uno o dos minutos) y te dará una dirección
parecida a `https://aneshealth.pages.dev`.

> Esa dirección `aneshealth.pages.dev` es la **dirección definitiva** del programa.
> La vista del paciente estará en `https://aneshealth.pages.dev/paciente/`.

---

## Paso 4 — Proteger la aplicación de enfermería con acceso por correo

Queremos que **solo el personal del hospital** pueda abrir la app de enfermería, pero
que la **vista del paciente siga abierta** para cualquier paciente. Lo haremos con
**Cloudflare Access** (gratis).

### 4.1 — Activar Cloudflare Access (Zero Trust)

1. En el menú de la izquierda de Cloudflare, pulsa **Zero Trust**.
2. La primera vez te pedirá elegir un nombre para tu "equipo" (team name): escribe algo
   sencillo, por ejemplo `aneshealth`, y confirma.
3. Cuando pregunte por un plan, elige el **Free** (Gratuito) y continúa. (No hace falta
   introducir tarjeta para el plan gratuito).

### 4.2 — Crear la regla de acceso (una aplicación de Access)

1. Dentro de Zero Trust, ve a **Access → Applications** (Aplicaciones) y pulsa
   **Add an application** (Añadir una aplicación).
2. Elige el tipo **Self-hosted** (Autoalojada).
3. Rellena:
   - **Application name** (Nombre): `AnesHealth enfermería`
   - **Session duration** (Duración de la sesión): `24 hours` (un día; cómodo para la
     consulta).
   - **Application domain** (Dominio de la aplicación): escribe el dominio de tu página
     de Cloudflare, por ejemplo `aneshealth.pages.dev`, y **deja la ruta (path) vacía**
     para proteger toda la app.

4. **🔵 Dejar la vista del paciente SIN protección.** Esto es imprescindible. Baja a la
   sección **Bypass / excepciones** del propio formulario (o, si no aparece ahí, crea
   después una segunda aplicación de Access como se explica abajo) y añade una
   **excepción para la ruta del paciente**:
   - Añade una ruta (path) **`/paciente`** (y, si te deja, también **`/paciente/*``**)
     con una política de tipo **Bypass** (Omitir / Saltar) y condición **Everyone**
     (Todos). Así cualquier paciente puede abrir su hoja sin iniciar sesión.

   > Si tu versión de Cloudflare no permite poner excepciones dentro de la misma
   > aplicación, haz esto en su lugar: crea **dos** aplicaciones de Access.
   > - Aplicación A: dominio `aneshealth.pages.dev/paciente` con política **Bypass /
   >   Everyone** (deja pasar a todos). Créala **primero**.
   > - Aplicación B: dominio `aneshealth.pages.dev` (toda la app) con la política de
   >   correo del hospital del punto 4.3.
   > Cloudflare aplica primero la ruta más concreta (`/paciente`), así que los
   > pacientes entran libres y el resto queda protegido.

### 4.3 — Política: acceso por código al correo, solo correos del hospital

En la aplicación que protege la app de enfermería (la del dominio `aneshealth.pages.dev`
sin la ruta `/paciente`), crea la política de entrada:

1. En **Add policy** (Añadir política):
   - **Policy name** (Nombre): `Personal Vithas`
   - **Action** (Acción): **Allow** (Permitir).
2. En **Configure rules → Include** (Incluir), elige el criterio **Emails ending in**
   (Correos que terminan en) y escribe el dominio del hospital:

   ```
   @vithas.es
   ```

   > Si algún miembro del personal usa un correo que **no** termina en `@vithas.es`,
   > puedes añadirlo aparte: añade otra regla **Include → Emails** (Correos) y escribe
   > su dirección completa, una por línea.
3. Guarda la política y la aplicación.

### 4.4 — Comprobar que el acceso por código funciona

Así es como entrará el personal (acceso por **código de un solo uso al correo**, sin
contraseñas que recordar):

1. Abre `https://aneshealth.pages.dev` en el navegador.
2. Aparecerá una pantalla de Cloudflare pidiendo el correo. Escribe un correo
   `@vithas.es`.
3. Llegará un **código** a ese correo. Cópialo y pégalo en la pantalla.
4. Entrarás en la app de enfermería.
5. Ahora abre `https://aneshealth.pages.dev/paciente/` (la vista del paciente):
   **no debe pedir ningún código**, se abre directamente. Si pidiera código, revisa la
   excepción del punto 4.2.

> Cloudflare Access ya trae el método de **código al correo (One-time PIN)** activado
> por defecto en el plan gratuito, así que normalmente no hay que configurar nada más.

---

## Paso 5 (opcional) — Usar un dominio propio

Si el hospital tiene (o compra) un dominio propio, por ejemplo
`preanestesia.vithasbarcelona.es`, puedes usarlo en vez de `aneshealth.pages.dev`:

1. En Cloudflare, dentro del proyecto de Pages, ve a **Custom domains** (Dominios
   personalizados) y pulsa **Set up a custom domain**.
2. Escribe el dominio deseado y sigue las instrucciones (Cloudflare te dirá qué anotar
   en la configuración del dominio; si el dominio ya está en Cloudflare, se hace casi
   solo).
3. **Importante:** si usas dominio propio, repite el **paso 4** usando ese dominio en
   lugar de `aneshealth.pages.dev` (tanto en la protección como en la excepción
   `/paciente`).

---

## Paso 6 — Apuntar los QR a la nueva dirección

El programa guarda la dirección a la que apuntan los QR de los pacientes en un fichero
de configuración. Hay que ponerle la dirección definitiva de Cloudflare.

1. En GitHub, abre el fichero `datos/config.json` del repositorio.
2. Busca la línea que pone `url_vista_paciente`. Ahora mismo dice:

   ```json
   "url_vista_paciente": "https://holaaneshealth-eng.github.io/preanestesia/paciente/",
   ```

3. Cámbiala por la dirección de la vista del paciente en Cloudflare (fíjate en que
   **termina en `/paciente/`**, con la barra final):

   ```json
   "url_vista_paciente": "https://aneshealth.pages.dev/paciente/",
   ```

   > Si usaste dominio propio (paso 5), pon ese en su lugar, por ejemplo:
   > `"url_vista_paciente": "https://preanestesia.vithasbarcelona.es/paciente/",`

4. Guarda el cambio (en GitHub, **Commit changes**). Cloudflare detectará el cambio y
   volverá a publicar el programa automáticamente en uno o dos minutos.

> A partir de este momento, **todos los QR nuevos** que genere el programa apuntarán a
> la dirección de Cloudflare.

---

## Paso 7 — Retirar la versión de pruebas de GitHub Pages

Para que nadie use por error la dirección antigua de pruebas:

1. En GitHub, repositorio `preanestesia` → **Settings → Pages**.
2. En **Source** (Origen), selecciona **None** (Ninguno) para desactivar GitHub Pages.
3. (Opcional) Si quieres, puedes dejar de publicar la rama `desarrollo`; a partir de
   ahora la que importa es la rama `main` publicada en Cloudflare.

> Recuerda: la versión de pruebas mostraba la banda **«VERSIÓN DE PRUEBA · NO USAR CON
> PACIENTES»**. La versión de Cloudflare (rama `main`) es la buena, sin esa banda.

---

## Paso 8 — Comprobación final en dispositivos reales (¡no te lo saltes!)

Antes de usar el programa con el primer paciente, haz esta prueba **en los
dispositivos de verdad del servicio**. Es el último control de seguridad.

Hazlo **en cada tipo de dispositivo que vayáis a usar**: las **tablets** del servicio
(incluido **iPad**, si se usa alguno) **y** un **móvil** (el tipo de teléfono que
tendrá un paciente).

En cada dispositivo:

1. **Abrir la versión publicada.** Entra en `https://aneshealth.pages.dev` (o tu
   dominio propio). Comprueba que:
   - Pide el código por correo y, tras introducirlo, entras bien.
   - La app va **fluida** (sin tirones ni esperas largas) al tocar los botones.
2. **Recorrer una entrevista completa.** Haz una entrevista de principio a fin con un
   caso de ejemplo (puedes inventarte los datos), hasta llegar al resumen.
3. **Generar el QR del paciente.** En el resumen, pulsa *Generar hoja y QR del
   paciente* y comprueba que aparece el código QR.
4. **Escanear el QR con un móvil.** Con la cámara del móvil, escanea ese QR. Debe
   abrirse la **vista del paciente** en la dirección `.../paciente/`, y **sin pedir
   ningún código** (los pacientes no inician sesión).
5. **Comprobar la hoja del paciente.** En el móvil, verifica que:
   - Se ve bien la hoja (medicación, ayuno, qué traer…).
   - Funciona el **cambio de idioma** castellano ↔ catalán.
   - Funciona el botón **«Me han dado la fecha o me la han cambiado»**: al introducir
     una fecha, las instrucciones y el ayuno **se recalculan** y muestran días/horas
     coherentes.
   - Funciona **Guardar como PDF**.
6. **Confirmar la protección.** Desde un navegador donde **no** hayas iniciado sesión
   (o en modo incógnito), abre `https://aneshealth.pages.dev`: debe pedir el código.
   Y abre `https://aneshealth.pages.dev/paciente/`: debe abrirse **sin** pedir código.

> Si todos estos puntos funcionan en las tablets reales (y en el iPad, si lo usáis) y
> en un móvil, el programa está listo para usarse con pacientes. Si algo falla, anótalo
> y avísame antes de empezar.

---

## Resumen de los valores exactos (chuleta)

| Dónde | Valor exacto |
|---|---|
| Orden de compilación (Build command) | `npm run build:prod` |
| Carpeta de salida (Build output directory) | `dist` |
| Variable de entorno | `NODE_VERSION` = `22` |
| Rama de producción | `main` |
| Correos permitidos (app enfermería) | terminan en `@vithas.es` |
| Ruta sin protección (pacientes) | `/paciente` (y `/paciente/*`) |
| `url_vista_paciente` en `datos/config.json` | `https://aneshealth.pages.dev/paciente/` (o tu dominio propio) |
