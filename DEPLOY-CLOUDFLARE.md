# Desplegar en Cloudflare Pages

La app está configurada con **export estático** (`output: 'export'`), así que Next.js genera archivos estáticos en la carpeta `out/`, listos para Cloudflare Pages.

---

## Opción 1: Subir la carpeta `out` (rápido)

1. **Genera el build:**
   ```bash
   npm run build
   ```

2. **Entra en Cloudflare Pages:**
   - [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.

3. **Arrastra la carpeta `out`:**
   - Después del build, en el proyecto verás la carpeta `out`.
   - Arrastra **todo el contenido** de `out` (no la carpeta `out` en sí) al área de upload de Cloudflare, o sube la carpeta `out` si la interfaz lo permite.

4. **Nombre del proyecto** (ej: `webp-converter`) y **Deploy**.

Tu sitio quedará en `https://webp-converter.pages.dev` (o el nombre que hayas puesto).

---

## Opción 2: Conectar con Git (GitHub/GitLab)

1. **Sube el proyecto a un repositorio** (GitHub o GitLab).

2. En **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.

3. **Configuración del build:**
   - **Framework preset:** Next.js (Static HTML).
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** (dejar vacío si el repo es solo este proyecto).

4. **Variables de entorno:** no hace falta ninguna (todo es client-side).

5. **Save and Deploy.** Los siguientes pushes al repo desplegarán automáticamente.

---

## Opción 3: Wrangler (línea de comandos)

1. **Instala Wrangler** (si no lo tienes):
   ```bash
   npm install -g wrangler
   ```

2. **Login en Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Genera el build:**
   ```bash
   npm run build
   ```

4. **Crea el proyecto en Pages** (solo la primera vez):
   ```bash
   wrangler pages project create webp-converter
   ```

5. **Despliega la carpeta `out`:**
   ```bash
   wrangler pages deploy out --project-name=webp-converter
   ```

---

## Resumen

| Paso | Comando / Acción |
|------|-------------------|
| Build | `npm run build` |
| Salida | Carpeta `out/` |
| Deploy | Subir `out`, conectar Git, o `wrangler pages deploy out` |

Si algo no carga (rutas o assets), revisa que en Cloudflare el **Build output directory** sea `out` y que hayas subido el **contenido** de `out`, no el proyecto entero.
