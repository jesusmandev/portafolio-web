# 🗄️ Backend de Testimonios — Base de Datos SQL (SQLite + Python)

Este módulo proporciona una API REST en Python con base de datos SQL (SQLite) para almacenar comentarios y testimonios de forma permanente.

---

## 🔒 Regla de Privacidad y Borrado Seguro
- **Permanencia:** Cada testimonio publicado se guarda en la base de datos SQL (`testimonials.db`) de forma indefinida.
- **Borrado Propietario Exclusivo:** Al publicar un comentario, el servidor genera un `delete_token` criptográfico único (o derivado del PIN que el usuario elija) que se entrega **únicamente al autor** y se almacena en su navegador.
- **Acceso Denegado a Terceros:** La API pública `GET /api/testimonials` **nunca** expone los tokens de borrado. Nadie más puede eliminar el comentario de otro usuario; cualquier intento sin el token correcto es rechazado con error `403 Forbidden`.

---

## 🚀 Cómo Iniciar el Servidor

Desde la raíz del proyecto, ejecuta:

```bash
# Opción 1: Con npm
npm run server

# Opción 2: Directamente con Python (biblioteca estándar, sin instalar pip extras)
python backend/server.py
```

El servidor iniciará en:
`http://localhost:5000`

---

## 📊 Estructura de la Base de Datos (SQL Schema)

La base de datos SQLite se crea automáticamente en `backend/testimonials.db` con la siguiente tabla:

```sql
CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    rating REAL NOT NULL,
    project TEXT NOT NULL,
    comment TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    raw_date TEXT NOT NULL,
    is_historical INTEGER DEFAULT 0,
    delete_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 Endpoints de la API REST

### 1. Listar testimonios
- **Método:** `GET`
- **Ruta:** `/api/testimonials`
- **Respuesta:** Lista JSON de testimonios ordenados por fecha/ID (sin revelar `delete_token`).

### 2. Crear un testimonio
- **Método:** `POST`
- **Ruta:** `/api/testimonials`
- **Cuerpo JSON:**
```json
{
  "name": "María González",
  "role": "Product Manager",
  "company": "TechInnovate",
  "project": "Plataforma Web SaaS",
  "rating": 5.0,
  "comment": "Excelente trabajo, superó todas nuestras expectativas.",
  "avatarColor": "from-purple-500 to-pink-500",
  "deletePin": "1234"
}
```
- **Respuesta:** Objeto creado con su `deleteToken` secreto.

### 3. Eliminar comentario propio
- **Método:** `DELETE`
- **Ruta:** `/api/testimonials/:id`
- **Headers:** `X-Delete-Token: <tu_token_o_pin>`
- **Respuesta:**
  - `200 OK`: Comentario eliminado permanentemente.
  - `403 Forbidden`: Token incorrecto. Solo el autor puede borrar su comentario.

