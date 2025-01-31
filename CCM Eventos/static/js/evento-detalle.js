const BASEURL = 'http://127.0.0.1:5000/api';
let eventoData = null;

function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount || 0);
}

async function fetchDataWithAuth(url, method, data = null) {
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
    }

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos'
        });
        return null;
    }
}

function displayEventoDetalle(evento) {
    console.log('Mostrando evento:', evento); 

    
    document.getElementById('evento-imagen').src = evento.imagen_url || '../static/img/evento-default.jpg';
    document.getElementById('evento-imagen').alt = evento.nombre;

    
    document.getElementById('evento-titulo').textContent = evento.nombre;
    document.getElementById('evento-fecha').textContent = formatDate(evento.fecha);
    document.getElementById('evento-horario').textContent = evento.horario;
    document.getElementById('evento-salon').textContent = evento.salon_nombre;
    document.getElementById('evento-categoria').textContent = evento.categoria_nombre;
    document.getElementById('evento-precio').textContent = formatCurrency(evento.precio);
    document.getElementById('evento-estado').textContent = evento.estado;
    
   
    document.getElementById('evento-descripcion').textContent = evento.descripcion || 'No hay descripción disponible.';
    document.getElementById('evento-contacto').textContent = evento.contacto_responsable;
    document.getElementById('evento-organizador').textContent = evento.organizador_nombre;

    
    const reservaSection = document.getElementById('reserva-section');
    if (evento.estado === 'activo') {
        reservaSection.style.display = 'block';
        document.getElementById('max-entradas-info').textContent = 
            `Máximo ${evento.max_entradas_por_persona || 1} entradas por persona`;
    } else {
        reservaSection.style.display = 'none';
    }
}

async function loadEventoDetalle() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');
        
        if (!eventoId) {
            window.location.href = 'eventos.html';
            return;
        }

        eventoData = await fetchDataWithAuth(`${BASEURL}/eventos/${eventoId}`, 'GET');
        console.log('Datos del evento recibidos:', eventoData); // Para debugging
        
        if (!eventoData) return;

        displayEventoDetalle(eventoData);
        setupReservaForm(eventoData);

       
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.rol === 'organizador' && eventoData.organizador_id === userData.id) {
            document.getElementById('lista-asistentes').style.display = 'block';
            loadAsistentes(eventoId);
        }
    } catch (error) {
        console.error('Error cargando evento:', error);
    }
}

function setupReservaForm(evento) {
    const form = document.getElementById('reserva-form');
    const cantidadInput = document.getElementById('cantidad');
    
    if (!form || !cantidadInput) return;

    cantidadInput.max = evento.max_entradas_por_persona || 1;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const cantidad = parseInt(cantidadInput.value);
            const response = await fetchDataWithAuth(
                `${BASEURL}/reservas`,
                'POST',
                {
                    evento_id: evento.id,
                    cantidad_entradas: cantidad
                }
            );

            if (response) {
                Swal.fire({
                    title: '¡Reserva exitosa!',
                    html: `Tu código de acceso es: <strong>${response.codigo}</strong><br>
                          Guárdalo para presentarlo el día del evento`,
                    icon: 'success'
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
    });
}

async function loadAsistentes(eventoId) {
    try {
        const asistentes = await fetchDataWithAuth(
            `${BASEURL}/eventos/${eventoId}/asistentes`,
            'GET'
        );
        if (!asistentes) return;

        const container = document.getElementById('asistentes-container');
        container.innerHTML = asistentes.map(asistente => `
            <div class="asistente-card">
                <p><strong>Nombre:</strong> ${asistente.nombre}</p>
                <p><strong>Email:</strong> ${asistente.email}</p>
                <p><strong>Cantidad:</strong> ${asistente.cantidad_entradas}</p>
                <p><strong>Código:</strong> ${asistente.codigo}</p>
                <p><strong>Estado:</strong> ${asistente.confirmado ? 'Confirmado' : 'Pendiente'}</p>
                ${asistente.confirmado ? `<p><strong>Confirmado por:</strong> ${asistente.recepcionista_nombre}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando asistentes:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadEventoDetalle);