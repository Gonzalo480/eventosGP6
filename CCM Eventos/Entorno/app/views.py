from flask import jsonify, request, make_response
from app.models import Usuario, Evento
from app.database import get_db
from functools import wraps
import jwt
import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

def handle_options_request():
    return jsonify({}), 200

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return handle_options_request()

        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]  
            data = jwt.decode(token, str(os.getenv('SECRET_KEY')), algorithms=["HS256"])
            current_user = Usuario.get_by_email(data['email'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            print(f"Token error: {str(e)}")
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return handle_options_request()
        
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]
            data = jwt.decode(token, str(os.getenv('SECRET_KEY')), algorithms=["HS256"])
            current_user = Usuario.get_by_email(data['email'])
            if not current_user or not current_user.es_admin:
                return jsonify({'message': 'No autorizado'}), 403
        except:
            return jsonify({'message': 'Token inválido'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


def register():
    if request.method == 'OPTIONS':
        return handle_options_request()
    
    try:
        data = request.json
        if Usuario.get_by_email(data['email']):
            return jsonify({'message': 'Email ya registrado'}), 400
        
        hashed_password = generate_password_hash(data['password'])
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO usuarios (nombre, email, password)
            VALUES (%s, %s, %s)
        """, (data['nombre'], data['email'], hashed_password))
        db.commit()
        cursor.close()
        
        return jsonify({'message': 'Usuario registrado exitosamente'}), 201
    except Exception as e:
        print(f"Register error: {str(e)}")
        return jsonify({'message': 'Error en el registro'}), 500

def login():
    if request.method == 'OPTIONS':
        return handle_options_request()
    
    try:
        data = request.json
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        cursor.close()

        if user and check_password_hash(user['password'], data['password']):
            token = jwt.encode({
                'email': user['email'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }, str(os.getenv('SECRET_KEY')), algorithm="HS256")
            
            return jsonify({
                'token': token,
                'user': {
                    'id': user['id'],
                    'nombre': user['nombre'],
                    'email': user['email'],
                    'es_admin': user['es_admin']
                }
            })
        return jsonify({'message': 'Credenciales inválidas'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': 'Error en el login'}), 500


def get_eventos_publicos():
    try:
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
            WHERE e.estado = 'activo' AND e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """)
        eventos = cursor.fetchall()
        cursor.close()
        return jsonify(eventos)
    except Exception as e:
        print(f"Error getting eventos públicos: {str(e)}")
        return jsonify({'message': 'Error al obtener eventos'}), 500

def get_evento_publico(evento_id):
    try:
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
            WHERE e.id = %s AND e.estado = 'activo'
        """, (evento_id,))
        evento = cursor.fetchone()
        cursor.close()
        
        if not evento:
            return jsonify({'message': 'Evento no encontrado'}), 404
            
        return jsonify(evento)
    except Exception as e:
        print(f"Error getting evento público: {str(e)}")
        return jsonify({'message': 'Error al obtener el evento'}), 500


@token_required
def crear_evento(current_user):
    if request.method == 'OPTIONS':
        return handle_options_request()
    
    try:
        data = request.json
        db = get_db()
        cursor = db.cursor()
        
     
        cursor.execute("""
            INSERT INTO eventos (nombre, fecha, horario, salon_id, precio,
                               descripcion, imagen_url, contacto_responsable,
                               categoria_id, max_entradas_por_persona)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (data['nombre'], data['fecha'], data['horario'], data['salon_id'],
              data['precio'], data['descripcion'], data['imagen_url'],
              data['contacto_responsable'], data['categoria_id'],
              data.get('max_entradas_por_persona', 1)))
        
        evento_id = cursor.lastrowid
        
       
        cursor.execute("""
            INSERT INTO roles_evento (usuario_id, evento_id, rol)
            VALUES (%s, %s, 'organizador')
        """, (current_user.id, evento_id))
        
        db.commit()
        cursor.close()
        
        return jsonify({'message': 'Evento creado exitosamente', 'id': evento_id}), 201
    except Exception as e:
        print(f"Error creating event: {str(e)}")
        return jsonify({'message': 'Error al crear el evento'}), 500

@token_required
def get_eventos(current_user):
    try:
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
        return jsonify(eventos)
    except Exception as e:
        print(f"Error getting eventos: {str(e)}")
        return jsonify({'message': 'Error al obtener eventos'}), 500

@token_required
def get_evento(current_user, evento_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        query = """
            SELECT 
                e.*,
                s.nombre as salon_nombre,
                c.nombre as categoria_nombre,
                u.nombre as organizador_nombre,
                CASE 
                    WHEN ef.id IS NOT NULL THEN true 
                    ELSE false 
                END as es_favorito
            FROM eventos e
            LEFT JOIN salones s ON e.salon_id = s.id
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN roles_evento re ON e.id = re.evento_id AND re.rol = 'organizador'
            LEFT JOIN usuarios u ON re.usuario_id = u.id
            LEFT JOIN eventos_favoritos ef ON e.id = ef.evento_id AND ef.usuario_id = %s
            WHERE e.id = %s
        """
        
        print("Ejecutando query:", query) 
        print("Params:", current_user.id, evento_id) 
        
        cursor.execute(query, (current_user.id, evento_id))
        evento = cursor.fetchone()
        cursor.close()
        
        if not evento:
            return jsonify({'message': 'Evento no encontrado'}), 404
            
       
        if evento.get('fecha'):
            evento['fecha'] = evento['fecha'].strftime('%Y-%m-%d')
            
        print("Evento encontrado:", evento) 
        return jsonify(evento)
        
    except Exception as e:
        print(f"Error en get_evento: {str(e)}")
        return jsonify({'message': f'Error obteniendo evento: {str(e)}'}), 500

@token_required
def update_evento(current_user, evento_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
      
        cursor.execute("""
            SELECT 1 FROM roles_evento 
            WHERE usuario_id = %s AND evento_id = %s AND rol = 'organizador'
        """, (current_user.id, evento_id))
        es_organizador = cursor.fetchone() is not None

        if not es_organizador:
            return jsonify({'message': 'No autorizado'}), 403

        data = request.json
        cursor.execute("""
            UPDATE eventos
            SET nombre = %s, fecha = %s, horario = %s, salon_id = %s,
                precio = %s, descripcion = %s, imagen_url = %s,
                contacto_responsable = %s, categoria_id = %s,
                max_entradas_por_persona = %s
            WHERE id = %s
        """, (data['nombre'], data['fecha'], data['horario'], data['salon_id'],
              data['precio'], data['descripcion'], data['imagen_url'],
              data['contacto_responsable'], data['categoria_id'],
              data.get('max_entradas_por_persona', 1), evento_id))
        
        db.commit()
        cursor.close()
        
        return jsonify({'message': 'Evento actualizado exitosamente'})
    except Exception as e:
        print(f"Error updating event: {str(e)}")
        return jsonify({'message': 'Error al actualizar el evento'}), 500

@token_required
def delete_evento(current_user, evento_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
      
        cursor.execute("""
            SELECT 1 FROM roles_evento 
            WHERE usuario_id = %s AND evento_id = %s AND rol = 'organizador'
        """, (current_user.id, evento_id))
        es_organizador = cursor.fetchone() is not None

        if not es_organizador:
            return jsonify({'message': 'No autorizado'}), 403

     
        cursor.execute("SELECT 1 FROM reservas WHERE evento_id = %s", (evento_id,))
        tiene_reservas = cursor.fetchone() is not None

        if tiene_reservas:
            cursor.execute("""
                UPDATE eventos SET estado = 'cancelado'
                WHERE id = %s
            """, (evento_id,))
        else:
            cursor.execute("DELETE FROM eventos WHERE id = %s", (evento_id,))
        
        db.commit()
        cursor.close()
        
        return jsonify({'message': 'Evento eliminado exitosamente'})
    except Exception as e:
        print(f"Error deleting event: {str(e)}")
        return jsonify({'message': 'Error al eliminar el evento'}), 500

@token_required
def get_salones(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM salones ORDER BY nombre")
        salones = cursor.fetchall()
        cursor.close()
        print("Salones encontrados:", salones)  
        return jsonify(salones)
    except Exception as e:
        print(f"Error obteniendo salones: {str(e)}")
        return jsonify({'message': str(e)}), 500

@token_required
def get_categorias(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categorias ORDER BY nombre")
        categorias = cursor.fetchall()
        cursor.close()
        print("Categorías encontradas:", categorias) 
        return jsonify(categorias)
    except Exception as e:
        print(f"Error obteniendo categorías: {str(e)}")
        return jsonify({'message': str(e)}), 500

@token_required
def crear_reserva(current_user):
    try:
        data = request.json
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
      
        cursor.execute("""
            SELECT max_entradas_por_persona FROM eventos
            WHERE id = %s AND estado = 'activo'
        """, (data['evento_id'],))
        evento = cursor.fetchone()
        
        if not evento:
            return jsonify({'message': 'Evento no encontrado o no activo'}), 404

       
        cursor.execute("""
            SELECT SUM(cantidad_entradas) as total
            FROM reservas
            WHERE usuario_id = %s AND evento_id = %s AND estado != 'cancelada'
        """, (current_user.id, data['evento_id']))
        reservas = cursor.fetchone()
        
        total_actual = reservas['total'] or 0
        if total_actual + data['cantidad_entradas'] > evento['max_entradas_por_persona']:
            return jsonify({'message': 'Excede el límite de entradas por persona'}), 400

   
        codigo = str(uuid.uuid4())[:8].upper()
        cursor.execute("""
            INSERT INTO reservas (usuario_id, evento_id, cantidad_entradas,
                                codigo_unico, estado)
            VALUES (%s, %s, %s, %s, 'pendiente')
        """, (current_user.id, data['evento_id'], data['cantidad_entradas'], codigo))
        
    
        cursor.execute("""
            INSERT IGNORE INTO roles_evento (usuario_id, evento_id, rol)
            VALUES (%s, %s, 'asistente')
        """, (current_user.id, data['evento_id']))
        
        db.commit()
        cursor.close()
        
        return jsonify({
            'message': 'Reserva creada exitosamente',
            'codigo': codigo
        }), 201
    except Exception as e:
        print(f"Error creating reservation: {str(e)}")
        return jsonify({'message': 'Error al crear la reserva'}), 500

@token_required
def cancelar_reserva(current_user, reserva_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
       
        cursor.execute("""
            SELECT r.*, e.fecha 
            FROM reservas r
            JOIN eventos e ON r.evento_id = e.id
            WHERE r.id = %s AND r.usuario_id = %s
        """, (reserva_id, current_user.id))
        reserva = cursor.fetchone()
        
        if not reserva:
            return jsonify({'message': 'Reserva no encontrada'}), 404

      
        fecha_evento = datetime.datetime.strptime(reserva['fecha'], '%Y-%m-%d')
        limite_cancelacion = fecha_evento - datetime.timedelta(hours=24)
        
        if datetime.datetime.now() > limite_cancelacion:
            return jsonify({'message': 'No se puede cancelar menos de 24 horas antes del evento'}), 400

        cursor.execute("""
            UPDATE reservas 
            SET estado = 'cancelada'
            WHERE id = %s
        """, (reserva_id,))
        
        db.commit()
        cursor.close()
        
        return jsonify({'message': 'Reserva cancelada exitosamente'})
    except Exception as e:
        print(f"Error canceling reservation: {str(e)}")
        return jsonify({'message': 'Error al cancelar la reserva'}), 500

@token_required
def get_asistentes(current_user, evento_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
      
        cursor.execute("""
            SELECT 1 FROM roles_evento 
            WHERE usuario_id = %s AND evento_id = %s AND rol = 'organizador'
        """, (current_user.id, evento_id))
        es_organizador = cursor.fetchone() is not None

        if not es_organizador:
            return jsonify({'message': 'No autorizado'}), 403

        cursor.execute("""
            SELECT u.nombre, u.email, r.cantidad_entradas,
                   r.codigo_unico, r.estado, r.fecha_reserva
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.evento_id = %s AND r.estado != 'cancelada'
            ORDER BY r.fecha_reserva
        """, (evento_id,))
        
        asistentes = cursor.fetchall()
        cursor.close()
        
        return jsonify(asistentes)
    except Exception as e:
        print(f"Error getting attendees: {str(e)}")
        return jsonify({'message': 'Error al obtener asistentes'}), 500

@token_required
def toggle_favorito(current_user, evento_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
       
        cursor.execute("""
            SELECT id FROM eventos_favoritos
            WHERE usuario_id = %s AND evento_id = %s
        """, (current_user.id, evento_id))
        
        favorito = cursor.fetchone()
        
        if favorito:
      
            cursor.execute("""
                DELETE FROM eventos_favoritos
                WHERE usuario_id = %s AND evento_id = %s
            """, (current_user.id, evento_id))
            mensaje = "Evento removido de favoritos"
        else:
  
            cursor.execute("""
                INSERT INTO eventos_favoritos (usuario_id, evento_id)
                VALUES (%s, %s)
            """, (current_user.id, evento_id))
            mensaje = "Evento agregado a favoritos"
        
        db.commit()
        cursor.close()
        
        return jsonify({'message': mensaje})
    except Exception as e:
        print(f"Error toggling favorite: {str(e)}")
        return jsonify({'message': 'Error al actualizar favoritos'}), 500

@token_required
def get_panel_usuario(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
   
        cursor.execute("""
            SELECT e.*, COUNT(r.id) as total_reservas
            FROM eventos e
            JOIN roles_evento re ON e.id = re.evento_id
            LEFT JOIN reservas r ON e.id = r.evento_id AND r.estado != 'cancelada'
            WHERE re.usuario_id = %s AND re.rol = 'organizador'
            GROUP BY e.id
            ORDER BY e.fecha DESC
        """, (current_user.id,))
        eventos_organizados = cursor.fetchall()

     
        cursor.execute("""
            SELECT r.*, e.nombre as evento_nombre, e.fecha, e.horario
            FROM reservas r
            JOIN eventos e ON r.evento_id = e.id
            WHERE r.usuario_id = %s AND r.estado != 'cancelada'
            ORDER BY e.fecha ASC
        """, (current_user.id,))
        reservas = cursor.fetchall()

       
        cursor.execute("""
            SELECT e.*
            FROM eventos e
            JOIN eventos_favoritos ef ON e.id = ef.evento_id
            WHERE ef.usuario_id = %s AND e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """, (current_user.id,))
        favoritos = cursor.fetchall()

        cursor.close()
        
        return jsonify({
            'eventos_organizados': eventos_organizados,
            'reservas': reservas,
            'favoritos': favoritos
        })
    except Exception as e:
        print(f"Error getting user panel: {str(e)}")
        return jsonify({'message': 'Error al obtener panel de usuario'}), 500
    
@token_required
def get_eventos_publicos():
    try:
        eventos = Evento.get_eventos_activos()
        return jsonify(eventos)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@token_required
def get_evento_publico(evento_id):
    try:
        evento = Evento.get_by_id(evento_id)
        if not evento:
            return jsonify({'message': 'Evento no encontrado'}), 404
        return jsonify(evento)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@token_required
def get_eventos_organizador(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre, c.nombre as categoria_nombre
            FROM eventos e
            JOIN roles_evento re ON e.id = re.evento_id
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            WHERE re.usuario_id = %s AND re.rol = 'organizador'
            ORDER BY e.fecha DESC
        """, (current_user.id,))
        eventos = cursor.fetchall()
        cursor.close()
        return jsonify(eventos)
    except Exception as e:
        print(f"Error getting organized events: {str(e)}")
        return jsonify({'message': str(e)}), 500

@token_required
def get_mis_reservas(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, e.nombre as evento_nombre, e.fecha, e.horario,
                   s.nombre as salon_nombre
            FROM reservas r
            JOIN eventos e ON r.evento_id = e.id
            JOIN salones s ON e.salon_id = s.id
            WHERE r.usuario_id = %s
            ORDER BY e.fecha DESC
        """, (current_user.id,))
        reservas = cursor.fetchall()
        cursor.close()
        return jsonify(reservas)
    except Exception as e:
        print(f"Error getting reservations: {str(e)}")
        return jsonify({'message': str(e)}), 500

@token_required
def get_mis_favoritos(current_user):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, s.nombre as salon_nombre, c.nombre as categoria_nombre
            FROM eventos e
            JOIN eventos_favoritos ef ON e.id = ef.evento_id
            JOIN salones s ON e.salon_id = s.id
            JOIN categorias c ON e.categoria_id = c.id
            WHERE ef.usuario_id = %s AND e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """, (current_user.id,))
        favoritos = cursor.fetchall()
        cursor.close()
        return jsonify(favoritos)
    except Exception as e:
        print(f"Error getting favorites: {str(e)}")
        return jsonify({'message': str(e)}), 500

@token_required
def get_roles_evento(current_user, evento_id):
    try:
      
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
       
        cursor.execute("""
            SELECT 1 FROM roles_evento 
            WHERE usuario_id = %s AND evento_id = %s AND rol = 'organizador'
        """, (current_user.id, evento_id))
        
        if not cursor.fetchone() and not current_user.es_admin:
            return jsonify({'message': 'No autorizado'}), 403

        
        cursor.execute("""
            SELECT u.nombre, u.email, re.rol, re.created_at
            FROM roles_evento re
            JOIN usuarios u ON re.usuario_id = u.id
            WHERE re.evento_id = %s
            ORDER BY re.rol, u.nombre
        """, (evento_id,))
        
        roles = cursor.fetchall()
        cursor.close()
        return jsonify(roles)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@token_required
def admin_get_usuarios(current_user):
    if not current_user.es_admin:
        return jsonify({'message': 'No autorizado'}), 403
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, email, es_admin, created_at
            FROM usuarios
            ORDER BY nombre
        """)
        usuarios = cursor.fetchall()
        cursor.close()
        return jsonify(usuarios)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@token_required
def toggle_admin(current_user, usuario_id):
    if not current_user.es_admin:
        return jsonify({'message': 'No autorizado'}), 403
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            UPDATE usuarios 
            SET es_admin = NOT es_admin 
            WHERE id = %s
            RETURNING es_admin
        """, (usuario_id,))
        
        nuevo_estado = cursor.fetchone()[0]
        db.commit()
        cursor.close()
        
        return jsonify({
            'message': 'Estado de administrador actualizado',
            'es_admin': nuevo_estado
        })
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
@token_required
def get_all_eventos(current_user):
    if request.method == 'OPTIONS':
        return handle_options_request()
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT 
                e.id,
                e.nombre,
                e.fecha,
                e.horario,
                e.precio,
                e.estado,
                e.imagen_url,
                e.descripcion,
                e.contacto_responsable,
                s.nombre as salon_nombre,
                c.nombre as categoria_nombre
            FROM eventos e
            LEFT JOIN salones s ON e.salon_id = s.id
            LEFT JOIN categorias c ON e.categoria_id = c.id
            WHERE e.fecha >= CURDATE()
            ORDER BY e.fecha ASC
        """
        
        print("Ejecutando query:", query)  
        cursor.execute(query)
        eventos = cursor.fetchall()
        cursor.close()
        
        print("Eventos encontrados:", len(eventos))  
        return jsonify(eventos)
        
    except Exception as e:
        print(f"Error en get_all_eventos: {str(e)}")  
        return jsonify({'message': f'Error getting events: {str(e)}'}), 500