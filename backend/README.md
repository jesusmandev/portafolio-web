# 🗄️ Backend de Testimonios — Base de Datos SQL (SQLite + Python)

Este backend REST en Python gestiona la base de datos SQL (`testimonials.db`) para almacenar permanentemente testimonios de clientes y permitir que cada autor elimine únicamente su comentario mediante un token criptográfico seguro.

---

## 🟢 Estado Actual
- **Servidor Local:** Ya está corregido y corriendo en segundo plano (`http://localhost:5000`).
- **Codificación Windows:** Se aseguró UTF-8 para evitar errores de consola en Windows (`cp1252`).
- **Interfaz Frontend:** Muestra el distintivo profesional `🟢 Base de Datos SQL Activa`.
- **Sincronización:** Si el servidor está activo, guarda directamente en SQLite. Si se visita desde un entorno estático sin backend en línea, persiste en almacenamiento seguro para que el usuario no pierda su experiencia.

---

## 🚀 Despliegue Gratuito en Producción (24/7 en la Nube)

Como el frontend está alojado en **GitHub Pages** (que solo aloja archivos estáticos HTML/JS/CSS), para que el servidor Python esté disponible para visitantes de todo el mundo 24/7, puedes desplegarlo gratis en cualquiera de estas plataformas:

### Opción 1: Render.com (Recomendado y 100% Gratuito)
1. Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** > **Web Service**.
3. Selecciona tu repositorio: `jesusmandev/portafolio-web`.
4. Configuración:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** *(dejar vacío)*
   - **Start Command:** `python server.py`
   - **Plan:** `Free`
5. Haz clic en **Deploy Web Service**.
6. Render te dará una URL pública como:
   `https://tu-api-testimonials.onrender.com`
7. Agrega esa URL en tu archivo `.env` del frontend:
   ```env
   VITE_API_URL=https://tu-api-testimonials.onrender.com/api/testimonials
   ```
8. ¡Listo! Todo el mundo podrá comentar y borrar sus comentarios en vivo en producción.

### Opción 2: Railway.app o Koyeb
- Ambos soportan el `Dockerfile` incluido en la carpeta `backend/` de forma automática con solo conectar tu repositorio de GitHub.

---

## 🔒 Regla de Privacidad y Borrado Seguro
- **Permanencia:** Cada testimonio publicado se guarda en la base de datos SQL (`testimonials.db`) de forma indefinida.
- **Borrado Propietario Exclusivo:** Al publicar un comentario, el servidor genera un `delete_token` único que se entrega **únicamente al autor**.
- **Acceso Denegado a Terceros:** La API pública `GET /api/testimonials` **nunca** expone los tokens de borrado. Cualquier intento de borrado sin el token correcto es rechazado con error `403 Forbidden`.
