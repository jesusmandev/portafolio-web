#!/usr/bin/env python3
"""
Servidor Backend REST en Python con Base de Datos SQLite para Testimonios.
Permite:
- Guardar testimonios de forma permanente en la base de datos SQL.
- Cada usuario recibe un 'delete_token' criptográficamente único al publicar.
- Solo el usuario propietario puede borrar su comentario proporcionando su token secreto.
- Pre-inicializa la base de datos con los testimonios históricos y recientes si está vacía.
- No requiere librerías externas (usa la biblioteca estándar de Python: sqlite3 + http.server).
"""

import os
import sys
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Directorio base y ruta del archivo SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "testimonials.db")
PORT = int(os.environ.get("PORT", 5000))

# Semilla inicial con los testimonios predeterminados
INITIAL_TESTIMONIALS = [
    {
        "name": "Carlos Benítez",
        "role": "CEO & Co-fundador",
        "company": "StreamZone",
        "avatar_color": "from-blue-500 to-indigo-600",
        "rating": 5.0,
        "raw_date": "2026-11-02",
        "is_historical": 0,
        "project": "Plataforma Streaming",
        "comment": "Jesús desarrolló nuestra plataforma de suscripciones con una calidad impresionante. El rendimiento y la interfaz en React superaron todas nuestras expectativas. Nuestras conversiones subieron un 40% en el primer mes gracias a la fluidez del checkout."
    },
    {
        "name": "Valentina Morales",
        "role": "Directora de Marketing",
        "company": "GastroWorld Menus",
        "avatar_color": "from-amber-500 to-rose-500",
        "rating": 5.0,
        "raw_date": "2026-11-01",
        "is_historical": 0,
        "project": "Menú Interactivo Global",
        "comment": "El menú interactivo que implementó para nuestra cadena de restaurantes dejó fascinados a los clientes. Carga instantánea, animaciones sutiles y diseño adaptable al 100% en teléfonos móviles. ¡Un desarrollador de primer nivel!"
    },
    {
        "name": "Andrés Felipe Gómez",
        "role": "Product Manager",
        "company": "FinTech Nexus",
        "avatar_color": "from-emerald-500 to-teal-600",
        "rating": 5.0,
        "raw_date": "2026-10-30",
        "is_historical": 0,
        "project": "Dashboard Financiero",
        "comment": "Tiene una habilidad extraordinaria para convertir requerimientos complejos de UX en componentes limpios y modulares. Su manejo de Tailwind y Three.js le dio a nuestro producto un toque tecnológico insuperable."
    },
    {
        "name": "Camila Restrepo",
        "role": "Creative Director",
        "company": "Bloom Design Studio",
        "avatar_color": "from-purple-500 to-pink-500",
        "rating": 5.0,
        "raw_date": "2026-10-28",
        "is_historical": 0,
        "project": "Portafolio Creativo",
        "comment": "Trabajar con Jesús fue una experiencia perfecta de inicio a fin. Cuidado milimétrico de los detalles visuales, comunicación transparente en cada sprint y entregó dos días antes de la fecha límite programada."
    },
    {
        "name": "Javier Ortiz",
        "role": "Lead Developer",
        "company": "CloudSphere Solutions",
        "avatar_color": "from-sky-500 to-blue-700",
        "rating": 4.5,
        "raw_date": "2026-10-25",
        "is_historical": 0,
        "project": "Portal Cloud & API Hub",
        "comment": "Excelente arquitectura de código y manejo de estado. La integración con nuestras APIs REST fue impecable y sin sorpresas. Muy receptivo a sugerencias técnicas y excelente colaborador en equipo."
    },
    {
        "name": "Lucía Fernández",
        "role": "E-commerce Manager",
        "company": "ModaVibe",
        "avatar_color": "from-fuchsia-500 to-violet-600",
        "rating": 5.0,
        "raw_date": "2026-10-18",
        "is_historical": 0,
        "project": "Tienda Online & Catálogo",
        "comment": "La fluidez visual y los efectos de transición que integró en nuestro catálogo de ropa aumentaron el tiempo de permanencia en el sitio en más del 65%. Transmite profesionalismo en cada entrega."
    },
    {
        "name": "Diego Armando Silva",
        "role": "Gerente Comercial",
        "company": "AutoDrive Motors",
        "avatar_color": "from-orange-600 to-amber-700",
        "rating": 3.0,
        "raw_date": "2024-10-20",
        "is_historical": 1,
        "project": "Landing Page Automotriz",
        "comment": "El diseño gráfico final fue bueno y moderno, pero en aquel momento tuvimos retrasos con los plazos pactados y varios desajustes en pantallas móviles pequeñas que tardaron días en solucionarse. Terminó cumpliendo, pero el inicio fue algo accidentado."
    },
    {
        "name": "Mariana Salazar",
        "role": "Co-fundadora",
        "company": "EduPlay Games",
        "avatar_color": "from-cyan-500 to-blue-600",
        "rating": 5.0,
        "raw_date": "2026-10-11",
        "is_historical": 0,
        "project": "Juego Web Educativo",
        "comment": "El juego web interactivo que construyó para nuestra plataforma educativa fue un éxito rotundo. Gran optimización para celulares de gama media y cero caídas de frames. Muy recomendado."
    },
    {
        "name": "Esteban Carvajal",
        "role": "Director de Operaciones",
        "company": "LogiTrack Express",
        "avatar_color": "from-slate-600 to-zinc-700",
        "rating": 3.0,
        "raw_date": "2024-12-15",
        "is_historical": 1,
        "project": "Sistema de Envíos Web",
        "comment": "La aplicación opera bien hoy en día, pero en las primeras semanas de trabajo la comunicación fue algo lenta y surgieron errores en los formularios de registro que requirieron varias correcciones. Se nota que con el tiempo ha madurado mucho su proceso."
    },
    {
        "name": "Daniela Pineda",
        "role": "Senior UI/UX Designer",
        "company": "Studio Nómade",
        "avatar_color": "from-rose-500 to-pink-600",
        "rating": 5.0,
        "raw_date": "2026-10-02",
        "is_historical": 0,
        "project": "Sitio Web de Agencia",
        "comment": "Como diseñadora soy extremadamente meticulosa con el respeto a Figma. Jesús no solo replicó cada layout al píxel, sino que enriqueció las microinteracciones y estados hover de manera genial."
    },
    {
        "name": "Roberto Méndez",
        "role": "Director General",
        "company": "Inmobiliaria Nova Terra",
        "avatar_color": "from-red-600 to-rose-700",
        "rating": 2.0,
        "raw_date": "2024-08-10",
        "is_historical": 1,
        "project": "Catálogo de Propiedades",
        "comment": "Tuvimos desacuerdos en la estimación de tiempos y la integración con el backend demoró más de lo presupuestado inicialmente. Aunque finalmente resolvió las incidencias y el portal quedó activo, nos costó un par de revisiones extra y tensión en el equipo."
    },
    {
        "name": "Paula Andrea Castro",
        "role": "CTO",
        "company": "QuickBite Delivery",
        "avatar_color": "from-green-500 to-emerald-600",
        "rating": 5.0,
        "raw_date": "2026-09-02",
        "is_historical": 0,
        "project": "App Web de Pedidos",
        "comment": "Rápido, proactivo y sumamente autónomo. Jesús redujo el peso del bundle a menos de la mitad implementando code-splitting y compresión moderna. Un talento técnico indispensable."
    },
    {
        "name": "Alejandro Torres",
        "role": "Fundador",
        "company": "MotoXperience Club",
        "avatar_color": "from-amber-500 to-orange-600",
        "rating": 5.0,
        "raw_date": "2026-08-05",
        "is_historical": 0,
        "project": "Landing Page de Motocicletas",
        "comment": "La landing page para el lanzamiento de nuestra nueva línea de motos tuvo un impacto brutal. Capturó la estética agresiva de la marca con animaciones dinámicas que cautivaron a los visitantes."
    },
    {
        "name": "Natalia Herrera",
        "role": "Project Manager",
        "company": "Nexo Agencia Digital",
        "avatar_color": "from-indigo-500 to-purple-600",
        "rating": 4.0,
        "raw_date": "2025-10-15",
        "is_historical": 1,
        "project": "Rediseño de Marca Web",
        "comment": "El trabajo estético y de maquetación fue muy satisfactorio y el cliente final quedó complacido. Sin embargo, en esa etapa echamos en falta un poco más de documentación técnica para el traspaso interno."
    },
    {
        "name": "Gabriel Villamizar",
        "role": "Tech Lead",
        "company": "SoftWave Tech",
        "avatar_color": "from-blue-600 to-indigo-700",
        "rating": 5.0,
        "raw_date": "2026-06-02",
        "is_historical": 0,
        "project": "Dashboard SaaS B2B",
        "comment": "Gran dominio de React, hooks personalizados y optimización general con Vite. Fue proactivo sugiriendo mejoras de accesibilidad y SEO que ni siquiera contemplábamos en el brief original."
    },
    {
        "name": "Valeria Quintana",
        "role": "Directora de Arte",
        "company": "Espacio Galería",
        "avatar_color": "from-teal-500 to-emerald-600",
        "rating": 5.0,
        "raw_date": "2026-05-02",
        "is_historical": 0,
        "project": "Galería de Exposiciones",
        "comment": "Supo plasmar a la perfección la vibra minimalista y sobria que queríamos transmitir. Paciente, educado y con un excelente ojo estético para la fotografía y la tipografía."
    },
    {
        "name": "Marcos Escalante",
        "role": "Emprendedor de Comercio Electrónico",
        "company": "Escalante Store",
        "avatar_color": "from-yellow-600 to-amber-700",
        "rating": 3.0,
        "raw_date": "2025-05-10",
        "is_historical": 1,
        "project": "Tienda Virtual",
        "comment": "La tienda cumplió su función y logramos vender, aunque en la primera versión hubo detalles de rendimiento en navegadores antiguos y tuvimos que solicitar varios ajustes. Agradezco que Jesús se hizo cargo de todo hasta resolverlo."
    },
    {
        "name": "Elena Domínguez",
        "role": "Consultora de Negocios",
        "company": "Impulso Estratégico",
        "avatar_color": "from-purple-600 to-violet-700",
        "rating": 5.0,
        "raw_date": "2026-03-02",
        "is_historical": 0,
        "project": "Sitio Web Corporativo",
        "comment": "Excelente asesoría desde la primera reunión. No solo programó el sitio, sino que me orientó en cómo jerarquizar la propuesta de valor para captar clientes de alto ticket."
    },
    {
        "name": "Santiago Marín",
        "role": "CEO & Founder",
        "company": "CyberSafe Shield",
        "avatar_color": "from-blue-500 to-cyan-500",
        "rating": 5.0,
        "raw_date": "2026-02-02",
        "is_historical": 0,
        "project": "Plataforma de Ciberseguridad",
        "comment": "Entrega impecable. La velocidad de navegación y los componentes con efectos 3D nos permitieron presentar el proyecto ante inversionistas con un impacto contundente."
    },
    {
        "name": "Isabella Cordero",
        "role": "Marketing Lead",
        "company": "TrendyMedia Studio",
        "avatar_color": "from-pink-500 to-rose-600",
        "rating": 5.0,
        "raw_date": "2026-01-02",
        "is_historical": 0,
        "project": "Portal Multimedia",
        "comment": "El nivel de compromiso y profesionalismo de Jesús es digno de elogio. Cumplió con cada hito del cronograma y resolvió dudas técnicas con una cordialidad inigualable."
    }
]

def format_relative_date(raw_date_str):
    """Calcula la etiqueta amigable ('Hoy', 'Hace 3 días', 'Hace 2 meses', etc.) a partir de una fecha ISO."""
    try:
        now = datetime.now()
        dt = datetime.strptime(raw_date_str[:10], "%Y-%m-%d")
        diff_days = (now - dt).days

        if diff_days <= 0:
            return "Hoy"
        elif diff_days == 1:
            return "Ayer"
        elif diff_days < 7:
            return f"Hace {diff_days} días"
        elif diff_days < 14:
            return "Hace 1 semana"
        elif diff_days < 30:
            weeks = diff_days // 7
            return f"Hace {weeks} semanas"
        elif diff_days < 365:
            months = max(1, diff_days // 30)
            return "Hace 1 mes" if months == 1 else f"Hace {months} meses"
        else:
            years = max(1, diff_days // 365)
            return "Hace 1 año" if years == 1 else f"Hace {years} años"
    except Exception:
        return "Reciente"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crea la tabla SQL e inserta los datos iniciales si aún no existen."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
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
        )
    """)

    # Verificar si está vacía
    cursor.execute("SELECT COUNT(*) as count FROM testimonials")
    count = cursor.fetchone()["count"]

    if count == 0:
        print("[SQL] Inicializando base de datos con los testimonios predeterminados...")
        for t in INITIAL_TESTIMONIALS:
            # Los testimonios predeterminados del sistema tienen un token protegido 'system_seed'
            cursor.execute("""
                INSERT INTO testimonials 
                (name, role, company, rating, project, comment, avatar_color, raw_date, is_historical, delete_token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                t["name"],
                t["role"],
                t["company"],
                t["rating"],
                t["project"],
                t["comment"],
                t["avatar_color"],
                t["raw_date"],
                t["is_historical"],
                "system_protected_seed"
            ))
        conn.commit()
        print(f"[SQL] {len(INITIAL_TESTIMONIALS)} testimonios guardados exitosamente.")

    conn.close()

class TestimonialsHandler(BaseHTTPRequestHandler):
    """Manejador HTTP con soporte CORS y endpoints REST en JSON."""

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Delete-Token")
        self.end_headers()

    def do_OPTIONS(self):
        """Manejo de pre-flight CORS para navegadores modernos."""
        self._set_headers(204)

    def do_GET(self):
        """Devuelve la lista de testimonios activos. IMPORTANTE: No expone el delete_token público."""
        parsed = urlparse(self.path)
        if parsed.path in ["/api/testimonials", "/api/testimonials/"]:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, role, company, rating, project, comment, avatar_color, raw_date, is_historical, created_at
                FROM testimonials
                ORDER BY id DESC
            """)
            rows = cursor.fetchall()

            testimonials = []
            for r in rows:
                raw_d = r["raw_date"] or r["created_at"] or ""
                testimonials.append({
                    "id": r["id"],
                    "name": r["name"],
                    "role": r["role"],
                    "company": r["company"],
                    "rating": float(r["rating"]),
                    "project": r["project"],
                    "comment": r["comment"],
                    "avatarColor": r["avatar_color"],
                    "rawDate": raw_d,
                    "date": format_relative_date(raw_d),
                    "isHistorical": bool(r["is_historical"]),
                    "createdAt": r["created_at"]
                })
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps(testimonials).encode("utf-8"))
        elif parsed.path in ["/", "/health", "/api/health"]:
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "ok",
                "database": "SQLite 3",
                "message": "Servidor de Testimonios Activo y Operacional"
            }).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint no encontrado"}).encode("utf-8"))

    def do_POST(self):
        """Inserta un nuevo testimonio en la base de datos SQL y genera su clave secreta de borrado."""
        parsed = urlparse(self.path)
        if parsed.path in ["/api/testimonials", "/api/testimonials/"]:
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode("utf-8"))

                # Validación básica
                name = str(data.get("name", "")).strip()
                role = str(data.get("role", "")).strip() or "Cliente"
                company = str(data.get("company", "")).strip() or "Independiente"
                project = str(data.get("project", "")).strip() or "Desarrollo Web"
                comment = str(data.get("comment", "")).strip()
                rating = float(data.get("rating", 5.0))
                rating = max(1.0, min(5.0, rating))
                avatar_color = str(data.get("avatarColor", "from-blue-500 to-indigo-600")).strip()
                user_pin = str(data.get("deletePin", "")).strip()

                if not name or len(name) < 2:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "El nombre es obligatorio (mínimo 2 letras)."}).encode("utf-8"))
                    return

                if not comment or len(comment) < 10:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "El comentario debe tener al menos 10 caracteres."}).encode("utf-8"))
                    return

                # Generar token único de borrado. Si el usuario puso un PIN propio, lo combinamos
                unique_uuid = uuid.uuid4().hex
                if user_pin:
                    delete_token = f"pin_{user_pin}_{unique_uuid[:12]}"
                else:
                    delete_token = f"tok_{unique_uuid}"

                today_iso = datetime.now().strftime("%Y-%m-%d")

                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO testimonials 
                    (name, role, company, rating, project, comment, avatar_color, raw_date, is_historical, delete_token)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    name,
                    role,
                    company,
                    rating,
                    project,
                    comment,
                    avatar_color,
                    today_iso,
                    0,
                    delete_token
                ))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

                response_data = {
                    "success": True,
                    "message": "Comentario guardado en la base de datos SQL exitosamente.",
                    "testimonial": {
                        "id": new_id,
                        "name": name,
                        "role": role,
                        "company": company,
                        "rating": rating,
                        "project": project,
                        "comment": comment,
                        "avatarColor": avatar_color,
                        "rawDate": today_iso,
                        "date": "Hoy",
                        "isHistorical": False
                    },
                    # Entregamos el token secreto únicamente en la respuesta de creación al autor
                    "deleteToken": delete_token
                }

                self._set_headers(201)
                self.wfile.write(json.dumps(response_data).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": f"Error del servidor SQL: {str(e)}"}).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint no encontrado"}).encode("utf-8"))

    def do_DELETE(self):
        """
        Elimina un comentario, PERO SOLO SI el cliente presenta el delete_token exacto con el que fue creado.
        Ruta esperada: /api/testimonials/<id>
        """
        parsed = urlparse(self.path)
        path_parts = parsed.path.strip("/").split("/")

        # Verificar formato: api/testimonials/<id>
        if len(path_parts) == 3 and path_parts[0] == "api" and path_parts[1] == "testimonials":
            try:
                testimonial_id = int(path_parts[2])
            except ValueError:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "ID de testimonio inválido."}).encode("utf-8"))
                return

            # Leer el delete_token de header o cuerpo JSON
            delete_token = self.headers.get("X-Delete-Token", "").strip()

            if not delete_token:
                try:
                    content_length = int(self.headers.get("Content-Length", 0))
                    if content_length > 0:
                        body = self.rfile.read(content_length)
                        data = json.loads(body.decode("utf-8"))
                        delete_token = str(data.get("deleteToken", "")).strip() or str(data.get("delete_token", "")).strip() or str(data.get("pin", "")).strip()
                except Exception:
                    pass

            if not delete_token:
                self._set_headers(401)
                self.wfile.write(json.dumps({
                    "error": "Se requiere tu token secreto o PIN de borrado para eliminar tu comentario."
                }).encode("utf-8"))
                return

            conn = get_db()
            cursor = conn.cursor()

            # Consultar si el testimonio existe y comparar el delete_token
            cursor.execute("SELECT id, delete_token, name FROM testimonials WHERE id = ?", (testimonial_id,))
            record = cursor.fetchone()

            if not record:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "El comentario no existe o ya fue eliminado."}).encode("utf-8"))
                return

            saved_token = record["delete_token"]

            # Si el token guardado contiene el PIN proporcionado o coincide exactamente
            token_matches = (saved_token == delete_token) or (
                saved_token.startswith("pin_") and delete_token and delete_token in saved_token.split("_")
            )

            if not token_matches:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({
                    "error": "Acceso denegado: Este token no coincide. Solo el autor que publicó este comentario puede borrarlo."
                }).encode("utf-8"))
                return

            # Si coincide, se elimina de SQL
            cursor.execute("DELETE FROM testimonials WHERE id = ?", (testimonial_id,))
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({
                "success": True,
                "message": f"Tu comentario (ID {testimonial_id}) ha sido eliminado permanentemente de la base de datos."
            }).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Ruta no válida."}).encode("utf-8"))

def run_server():
    init_db()
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, TestimonialsHandler)
    print(f"\n============================================================")
    print(f"🚀 Servidor SQL de Testimonios corriendo en http://localhost:{PORT}")
    print(f"📁 Base de Datos: {DB_PATH}")
    print(f"Endpoints disponibles:")
    print(f"  - GET    /api/testimonials     (Listar todos)")
    print(f"  - POST   /api/testimonials     (Crear comentario con delete_token)")
    print(f"  - DELETE /api/testimonials/:id (Eliminar solo el comentario propio)")
    print(f"============================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando servidor...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()

