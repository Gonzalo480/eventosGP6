
from flask_cors import CORS
from app.database import init_app
from app.views import *
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response , send_from_directory
from app.views import *
import logging
from logging.handlers import RotatingFileHandler
import os


load_dotenv()

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static',
            template_folder='templates')

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
init_app(app) 

CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

app.add_url_rule('/api/auth/register', 'register', register, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/auth/login', 'login', login, methods=['POST', 'OPTIONS'])

app.add_url_rule('/api/eventos/publicos', 'get_eventos_publicos', get_eventos_publicos, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/eventos/publicos/<int:evento_id>', 'get_evento_publico', get_evento_publico, methods=['GET', 'OPTIONS'])

app.add_url_rule('/api/eventos', 'get_eventos', get_eventos, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/eventos/<int:evento_id>', 'get_evento', get_evento, methods=['GET', 'OPTIONS'])

app.add_url_rule('/api/eventos', 'crear_evento', crear_evento, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/eventos/<int:evento_id>', 'update_evento', update_evento, methods=['PUT', 'OPTIONS'])
app.add_url_rule('/api/eventos/<int:evento_id>', 'delete_evento', delete_evento, methods=['DELETE', 'OPTIONS'])

app.add_url_rule('/api/eventos/<int:evento_id>/asistentes', 'get_asistentes', get_asistentes, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/mis-eventos-organizados', 'get_eventos_organizador', get_eventos_organizador, methods=['GET', 'OPTIONS'])


app.add_url_rule('/api/reservas', 'crear_reserva', crear_reserva, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/reservas/<int:reserva_id>', 'cancelar_reserva', cancelar_reserva, methods=['DELETE', 'OPTIONS'])
app.add_url_rule('/api/mis-reservas', 'get_mis_reservas', get_mis_reservas, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/eventos/<int:evento_id>/favorito', 'toggle_favorito', toggle_favorito, methods=['POST', 'OPTIONS'])
app.add_url_rule('/api/mis-favoritos', 'get_mis_favoritos', get_mis_favoritos, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/salones', 'get_salones', get_salones, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/categorias', 'get_categorias', get_categorias, methods=['GET', 'OPTIONS'])

app.add_url_rule('/api/admin/usuarios', 'admin_get_usuarios', admin_get_usuarios, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/admin/usuarios/<int:usuario_id>/toggle-admin', 'toggle_admin', toggle_admin, methods=['PUT', 'OPTIONS'])


app.add_url_rule('/api/panel', 'get_panel_usuario', get_panel_usuario, methods=['GET', 'OPTIONS'])
app.add_url_rule('/api/usuarios/roles/<int:evento_id>', 'get_roles_evento', get_roles_evento, methods=['GET', 'OPTIONS'])


@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Recurso no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Error interno del servidor'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Error no manejado: {str(e)}")
    return jsonify({
        "message": "Ha ocurrido un error inesperado",
        "error": str(e)
    }), 500

if __name__ == '__main__':

    if not app.debug:
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not os.path.exists('logs'):
            os.mkdir('logs')
            
        file_handler = RotatingFileHandler('logs/hallcross.log', 
                                         maxBytes=10240, 
                                         backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('Hallcross startup')

    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, port=port)