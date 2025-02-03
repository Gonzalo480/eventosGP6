from app.database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
import os


class Usuario:
    def __init__(self, id=None, nombre=None, email=None, password=None, es_admin=False):
        self.id = id
        self.nombre = nombre
        self.email = email
        self.password = password
        self.es_admin = es_admin

    def save(self):
        db = get_db()
        cursor = db.cursor()
        if self.id:
            cursor.execute("""
                UPDATE usuarios 
                SET nombre = %s, email = %s
                WHERE id = %s
            """, (self.nombre, self.email, self.id))
        else:
            hashed_password = generate_password_hash(self.password)
            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password, es_admin) 
                VALUES (%s, %s, %s, %s)
            """, (self.nombre, self.email, hashed_password, self.es_admin))
            self.id = cursor.lastrowid
        db.commit()
        cursor.close()
        
    def check_password(self, password):
        try:
            return check_password_hash(self.password, password)
        except Exception as e:
            print(f"Error checking password: {str(e)}")
            return False

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        if user:
            return Usuario(
                id=user['id'],
                nombre=user['nombre'],
                email=user['email'],
                es_admin=user['es_admin']
            )
        return None

    @staticmethod
    def get_by_email(email):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        if user:
            return Usuario(
                id=user['id'],
                nombre=user['nombre'],
                email=user['email'],
                password=user['password'],
                es_admin=user['es_admin']
            )
        return None

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'es_admin': self.es_admin
        }

    def get_roles(self):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.id as evento_id, e.nombre as evento_nombre, re.rol
            FROM roles_evento re
            JOIN eventos e ON re.evento_id = e.id
            WHERE re.usuario_id = %s
        """, (self.id,))
        roles = cursor.fetchall()
        cursor.close()
        return roles

class Evento:
    def __init__(self, id=None, nombre=None, fecha=None, horario=None, salon_id=None,
                 precio=0.00, estado='pendiente', imagen_url=None, descripcion=None,
                 contacto_responsable=None, max_entradas_por_persona=1, categoria_id=None):
        self.id = id
        self.nombre = nombre
        self.fecha = fecha if isinstance(fecha, datetime) else datetime.strptime(fecha, '%Y-%m-%d') if fecha else None
        self.horario = horario
        self.salon_id = salon_id
        self.precio = float(precio) if precio else 0.00
        self.estado = estado
        self.imagen_url = imagen_url
        self.descripcion = descripcion
        self.contacto_responsable = contacto_responsable
        self.max_entradas_por_persona = max_entradas_por_persona
        self.categoria_id = categoria_id

    def save(self):
        db = get_db()
        cursor = db.cursor()
        if self.id:
            cursor.execute("""
                UPDATE eventos 
                SET nombre = %s, fecha = %s, horario = %s, salon_id = %s,
                    precio = %s, estado = %s, imagen_url = %s, descripcion = %s,
                    contacto_responsable = %s, max_entradas_por_persona = %s,
                    categoria_id = %s
                WHERE id = %s
            """, (self.nombre, self.fecha, self.horario, self.salon_id,
                  self.precio, self.estado, self.imagen_url, self.descripcion,
                  self.contacto_responsable, self.max_entradas_por_persona,
                  self.categoria_id, self.id))
        else:
            cursor.execute("""
                INSERT INTO eventos (nombre, fecha, horario, salon_id, precio,
                                   estado, imagen_url, descripcion, 
                                   contacto_responsable, max_entradas_por_persona,
                                   categoria_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (self.nombre, self.fecha, self.horario, self.salon_id,
                  self.precio, self.estado, self.imagen_url, self.descripcion,
                  self.contacto_responsable, self.max_entradas_por_persona,
                  self.categoria_id))
            self.id = cursor.lastrowid
        
        db.commit()
        cursor.close()

    @staticmethod
    def get_all():
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre, c.nombre as categoria_nombre,
                   u.nombre as organizador_nombre
            FROM eventos e
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            JOIN roles_evento re ON e.id = re.evento_id AND re.rol = 'organizador'
            JOIN usuarios u ON re.usuario_id = u.id
            WHERE e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """)
        eventos = cursor.fetchall()
        cursor.close()
        return eventos
    
  
    @staticmethod
    def get_by_id(evento_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre, c.nombre as categoria_nombre,
                   u.nombre as organizador_nombre, re.usuario_id as organizador_id
            FROM eventos e
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            JOIN roles_evento re ON e.id = re.evento_id AND re.rol = 'organizador'
            JOIN usuarios u ON re.usuario_id = u.id
            WHERE e.id = %s
        """, (evento_id,))
        evento = cursor.fetchone()
        cursor.close()
        return evento

    @staticmethod
    def get_by_organizador(usuario_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre, c.nombre as categoria_nombre,
                   COUNT(r.id) as total_reservas
            FROM eventos e
            JOIN roles_evento re ON e.id = re.evento_id
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN reservas r ON e.id = r.evento_id AND r.estado != 'cancelada'
            WHERE re.usuario_id = %s AND re.rol = 'organizador'
            GROUP BY e.id
            ORDER BY e.fecha DESC
        """, (usuario_id,))
        eventos = cursor.fetchall()
        cursor.close()
        return eventos

    def get_asistentes(self):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.nombre, u.email, r.cantidad_entradas,
                   r.codigo_unico, r.estado, r.fecha_reserva,
                   r.fecha_confirmacion
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.evento_id = %s AND r.estado != 'cancelada'
            ORDER BY r.fecha_reserva
        """, (self.id,))
        asistentes = cursor.fetchall()
        cursor.close()
        return asistentes

class Reserva:
    def __init__(self, id=None, usuario_id=None, evento_id=None, cantidad_entradas=1,
                 codigo_unico=None, estado='pendiente', fecha_reserva=None):
        self.id = id
        self.usuario_id = usuario_id
        self.evento_id = evento_id
        self.cantidad_entradas = cantidad_entradas
        self.codigo_unico = codigo_unico or str(uuid.uuid4())[:8].upper()
        self.estado = estado
        self.fecha_reserva = fecha_reserva or datetime.now()

    def save(self):
        db = get_db()
        cursor = db.cursor()
        if self.id:
            cursor.execute("""
                UPDATE reservas 
                SET estado = %s
                WHERE id = %s
            """, (self.estado, self.id))
        else:
            cursor.execute("""
                INSERT INTO reservas (usuario_id, evento_id, cantidad_entradas,
                                    codigo_unico, estado, fecha_reserva)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (self.usuario_id, self.evento_id, self.cantidad_entradas,
                  self.codigo_unico, self.estado, self.fecha_reserva))
            self.id = cursor.lastrowid
        db.commit()
        cursor.close()

    @staticmethod
    def get_by_usuario(usuario_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, e.nombre as evento_nombre, e.fecha,
                   e.horario, e.imagen_url
            FROM reservas r
            JOIN eventos e ON r.evento_id = e.id
            WHERE r.usuario_id = %s AND e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """, (usuario_id,))
        reservas = cursor.fetchall()
        cursor.close()
        return reservas

    def cancelar(self):
        if self.puede_cancelar():
            self.estado = 'cancelada'
            self.save()
            return True
        return False

    def puede_cancelar(self):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT fecha FROM eventos WHERE id = %s
        """, (self.evento_id,))
        evento = cursor.fetchone()
        cursor.close()

        if not evento:
            return False

        fecha_evento = datetime.strptime(str(evento['fecha']), '%Y-%m-%d')
        limite_cancelacion = fecha_evento - timedelta(hours=24)
        return datetime.now() < limite_cancelacion

class EventoFavorito:
    @staticmethod
    def toggle(usuario_id, evento_id):
        db = get_db()
        cursor = db.cursor()
        
     
        cursor.execute("""
            SELECT id FROM eventos_favoritos
            WHERE usuario_id = %s AND evento_id = %s
        """, (usuario_id, evento_id))
        
        existe = cursor.fetchone()
        
        if existe:
        
            cursor.execute("""
                DELETE FROM eventos_favoritos
                WHERE usuario_id = %s AND evento_id = %s
            """, (usuario_id, evento_id))
            resultado = False
        else:
       
            cursor.execute("""
                INSERT INTO eventos_favoritos (usuario_id, evento_id)
                VALUES (%s, %s)
            """, (usuario_id, evento_id))
            resultado = True
            
        db.commit()
        cursor.close()
        return resultado

    @staticmethod
    def get_by_usuario(usuario_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre,
                   c.nombre as categoria_nombre
            FROM eventos e
            JOIN eventos_favoritos ef ON e.id = ef.evento_id
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            WHERE ef.usuario_id = %s AND e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """, (usuario_id,))
        eventos = cursor.fetchall()
        cursor.close()
        return eventos

    @staticmethod
    def is_favorito(usuario_id, evento_id):
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            SELECT 1 FROM eventos_favoritos
            WHERE usuario_id = %s AND evento_id = %s
        """, (usuario_id, evento_id))
        resultado = cursor.fetchone() is not None
        cursor.close()
        return resultado