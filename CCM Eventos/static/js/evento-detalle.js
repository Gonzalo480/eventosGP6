const BASEURL = 'http://127.0.0.1:5000/api';


function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return dateString;
    }
}

function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount || 0);
    } catch (error) {
        console.error('Error formateando moneda:', error);
        return `$${amount || 0}`;
    }
}


async function fetchDataWithAuth(url, method, data = null) {
    console.log('Fetching:', url, method);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
        console.log('Request data:', data);
    }

    try {
        const response = await fetch(url, options);
        console.log('Response status:', response.status);

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response data:', responseData);
        return responseData;
    } catch (error) {
        console.error('Fetch error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al procesar la solicitud'
        });
        return null;
    }
}


function displayEventoDetalle(evento) {
    console.log('Mostrando evento:', evento);
    
    const container = document.querySelector('#evento-detalle');
    if (!container) {
        console.error('No se encontró el contenedor del evento');
        return;
    }

    container.innerHTML = `
        <div class="evento-detalle-grid">
            <div class="evento-imagen-detalle">
                <img src="${evento.imagen_url || '../static/img/default-evento.jpg'}" 
                     alt="${evento.nombre}" 
                     onerror="this.src='../static/img/default-evento.jpg'; this.onerror=null;"
                     class="evento-imagen">
            </div>
            <div class="evento-info-detalle">
                <h1 class="evento-titulo">${evento.nombre || 'Sin título'}</h1>
                
                <div class="evento-metadata">
                    <p><strong>Fecha:</strong> ${formatDate(evento.fecha)}</p>
                    <p><strong>Horario:</strong> ${evento.horario || 'No especificado'}</p>
                    <p><strong>Salón:</strong> ${evento.salon_nombre || 'No especificado'}</p>
                    <p><strong>Categoría:</strong> ${evento.categoria_nombre || 'Sin categoría'}</p>
                    <p><strong>Precio:</strong> ${formatCurrency(evento.precio)}</p>
                    <p><strong>Estado:</strong> ${evento.estado || 'No especificado'}</p>
                </div>

                <div class="evento-descripcion">
                    <h3>Descripción</h3>
                    <p>${evento.descripcion || 'No hay descripción disponible.'}</p>
                </div>

                <div class="evento-contacto">
                    <h3>Información de contacto</h3>
                    <p>${evento.contacto_responsable || 'No hay información de contacto disponible.'}</p>
                </div>

                <div class="evento-organizador">
                    <p><strong>Organizado por:</strong> ${evento.organizador_nombre || 'No especificado'}</p>
                </div>

                ${evento.estado === 'activo' ? `
                    <div class="evento-acciones">
                        <button onclick="mostrarFormularioReserva()" class="btn-1">Reservar</button>
                        <button onclick="toggleFavorito(${evento.id})" 
                                class="btn-2 ${evento.es_favorito ? 'active' : ''}"
                                title="${evento.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                            ${evento.es_favorito ? '❤️' : '🤍'}
                        </button>
                    </div>
                ` : '<p class="evento-estado-inactivo">Este evento no está disponible para reservas</p>'}
            </div>
        </div>

        <div id="formulario-reserva" style="display: none;" class="formulario-reserva">
            <h3>Realizar Reserva</h3>
            <form id="form-reserva" class="form-reserva">
                <div class="form-control">
                    <label for="cantidad">Cantidad de entradas:</label>
                    <input type="number" id="cantidad" name="cantidad" min="1" 
                           max="${evento.max_entradas_por_persona || 1}" required>
                    <p class="help-text">Máximo ${evento.max_entradas_por_persona || 1} entradas por persona</p>
                </div>
                <button type="submit" class="btn-1">Confirmar Reserva</button>
            </form>
        </div>
    `;

  
    if (evento.estado === 'finalizado' || evento.estado === 'cancelado') {
        Swal.fire({
            icon: 'info',
            title: 'Evento no disponible',
            text: 'Este evento ya no está disponible para reservas'
        });
    }
}


async function loadEventoDetalle() {
    try {
        console.log('Cargando detalle del evento...');
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');
        
        if (!eventoId) {
            console.log('No se proporcionó ID de evento');
            window.location.href = 'eventos.html';
            return;
        }

        const evento = await fetchDataWithAuth(`${BASEURL}/eventos/${eventoId}`, 'GET');
        if (!evento) {
            console.log('No se encontró el evento');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo encontrar el evento'
            }).then(() => {
                window.location.href = 'eventos.html';
            });
            return;
        }

        displayEventoDetalle(evento);
    } catch (error) {
        console.error('Error cargando evento:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos del evento'
        });
    }
}


function mostrarFormularioReserva() {
    const formulario = document.getElementById('formulario-reserva');
    formulario.style.display = 'block';
    

    const form = document.getElementById('form-reserva');
    form.addEventListener('submit', handleReserva);
}


async function handleReserva(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');
    const cantidad = document.getElementById('cantidad').value;

    try {
        const reservaData = {
            evento_id: parseInt(eventoId),
            cantidad_entradas: parseInt(cantidad)
        };

        const response = await fetchDataWithAuth(`${BASEURL}/reservas`, 'POST', reservaData);
        
        if (response && response.codigo) {
            Swal.fire({
                icon: 'success',
                title: '¡Reserva exitosa!',
                html: `
                    <p>Tu reserva ha sido confirmada.</p>
                    <p>Tu código de acceso es: <strong>${response.codigo}</strong></p>
                    <p>Guarda este código, lo necesitarás para el evento.</p>
                `,
                confirmButtonText: 'Ir a mis reservas'
            }).then(() => {
                window.location.href = 'panel-usuario.html';
            });
        }
    } catch (error) {
        console.error('Error en la reserva:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo procesar la reserva'
        });
    }
}


async function toggleFavorito(eventoId) {
    try {
        const response = await fetchDataWithAuth(`${BASEURL}/eventos/${eventoId}/favorito`, 'POST');
        if (response) {
   
            loadEventoDetalle();
        }
    } catch (error) {
        console.error('Error toggle favorito:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar favoritos'
        });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadEventoDetalle);