
const BASEURL = 'http://127.0.0.1:5000/api';

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
        console.log('Response status:', response.status); 

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }

        const data = await response.json();
        console.log('Response data:', data); 
        return data;
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

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function createEventoCard(evento) {
    const template = document.querySelector('#evento-card-template');
    const clone = template.content.cloneNode(true);

    const img = clone.querySelector('.evento-imagen img');
    img.src = evento.imagen_url || '/static/img/evento-default.jpg';
    img.alt = evento.nombre;

    clone.querySelector('.evento-titulo').textContent = evento.nombre;
    clone.querySelector('.evento-fecha').textContent = formatDate(evento.fecha);
    clone.querySelector('.evento-horario').textContent = `Horario: ${evento.horario}`;
    clone.querySelector('.evento-estado').textContent = `Estado: ${evento.estado}`;

    const acciones = clone.querySelector('.evento-acciones');
    acciones.innerHTML = `
        <button onclick="window.location.href='evento-detalle.html?id=${evento.id}'" class="btn-1">Ver Detalles</button>
        <button onclick="window.location.href='crear-evento.html?id=${evento.id}'" class="btn-2">Editar</button>
    `;

    return clone;
}

function createReservaCard(reserva) {
    const template = document.querySelector('#reserva-card-template');
    const clone = template.content.cloneNode(true);

    clone.querySelector('.reserva-evento').textContent = reserva.evento_nombre;
    clone.querySelector('.reserva-fecha').textContent = formatDate(reserva.fecha);
    clone.querySelector('.reserva-estado').textContent = `Estado: ${reserva.estado}`;
    clone.querySelector('.reserva-codigo').textContent = `Código: ${reserva.codigo_unico}`;

    const acciones = clone.querySelector('.reserva-acciones');
    if (reserva.estado === 'pendiente') {
        acciones.innerHTML = `
            <button onclick="cancelarReserva(${reserva.id})" class="btn-2">Cancelar Reserva</button>
        `;
    }

    return clone;
}

async function cargarDatosUsuario() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('user-name').textContent = user.nombre;
        document.getElementById('user-email').textContent = user.email;
    }
}

async function cargarEventosOrganizados() {
    const eventos = await fetchDataWithAuth(`${BASEURL}/mis-eventos-organizados`, 'GET');
    const container = document.getElementById('eventos-organizados-container');
    
    if (eventos && eventos.length > 0) {
        eventos.forEach(evento => {
            container.appendChild(createEventoCard(evento));
        });
    } else {
        container.innerHTML = '<p class="no-results">No has organizado ningún evento aún.</p>';
    }
}

async function cargarReservas() {
    const reservas = await fetchDataWithAuth(`${BASEURL}/mis-reservas`, 'GET');
    const container = document.getElementById('reservas-container');
    
    if (reservas && reservas.length > 0) {
        reservas.forEach(reserva => {
            container.appendChild(createReservaCard(reserva));
        });
    } else {
        container.innerHTML = '<p class="no-results">No tienes reservas activas.</p>';
    }
}

async function cargarFavoritos() {
    const favoritos = await fetchDataWithAuth(`${BASEURL}/mis-favoritos`, 'GET');
    const container = document.getElementById('favoritos-container');
    
    if (favoritos && favoritos.length > 0) {
        favoritos.forEach(evento => {
            container.appendChild(createEventoCard(evento));
        });
    } else {
        container.innerHTML = '<p class="no-results">No tienes eventos favoritos.</p>';
    }
}

async function cancelarReserva(reservaId) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
        const response = await fetchDataWithAuth(`${BASEURL}/reservas/${reservaId}`, 'DELETE');
        if (response) {
            Swal.fire({
                title: 'Éxito',
                text: 'Reserva cancelada correctamente',
                icon: 'success'
            }).then(() => {
                window.location.reload();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando carga del panel de usuario...'); 
    
    try {
        await cargarDatosUsuario();

        await Promise.all([
            cargarEventosOrganizados(),
            cargarReservas(),
            cargarFavoritos()
        ]);
    } catch (error) {
        console.error('Error cargando el panel:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar el panel de usuario'
        });
    }
});