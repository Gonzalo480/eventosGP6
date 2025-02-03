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
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error en la conexión con el servidor'
        });
        return null;
    }
}

async function loadSalones() {
    try {
        const salones = await fetchDataWithAuth(`${BASEURL}/salones`, 'GET');
        if (salones) {
            const select = document.querySelector('#salon');
            if (select) {
                select.innerHTML = '<option value="">Seleccione salón</option>';
                salones.forEach(salon => {
                    const option = document.createElement('option');
                    option.value = salon.id;
                    option.textContent = `${salon.nombre} (Capacidad: ${salon.capacidad})`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los salones'
        });
    }
}

async function loadCategorias() {
    try {
        const categorias = await fetchDataWithAuth(`${BASEURL}/categorias`, 'GET');
        if (categorias) {
            const select = document.querySelector('#categoria');
            if (select) {
                select.innerHTML = '<option value="">Seleccione categoría</option>';
                categorias.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las categorías'
        });
    }
}

async function loadEventoData(eventoId) {
    try {
        const evento = await fetchDataWithAuth(`${BASEURL}/eventos/${eventoId}`, 'GET');
        if (evento) {
            document.querySelector('#id-evento').value = evento.id;
            document.querySelector('#nombre').value = evento.nombre;
            document.querySelector('#fecha').value = evento.fecha;
            document.querySelector('#horario').value = evento.horario;
            document.querySelector('#salon').value = evento.salon_id;
            document.querySelector('#categoria').value = evento.categoria_id;
            document.querySelector('#precio').value = evento.precio;
            document.querySelector('#descripcion').value = evento.descripcion;
            document.querySelector('#imagen').value = evento.imagen_url;
            document.querySelector('#contacto').value = evento.contacto_responsable;
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos del evento'
        });
    }
}

function validateForm() {
    const required = ['nombre', 'fecha', 'horario', 'salon', 'categoria', 'contacto'];
    const missing = required.filter(field => !document.querySelector(`#${field}`).value);
    
    if (missing.length > 0) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor complete todos los campos requeridos',
            icon: 'error'
        });
        return false;
    }

    const fechaEvento = new Date(document.querySelector('#fecha').value);
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    if (fechaEvento <= fechaActual) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha debe ser posterior a la fecha actual',
            icon: 'error'
        });
        return false;
    }

    return true;
}

async function saveEvento(event) {
    event.preventDefault();

    try {
        // Validar campos requeridos
        const camposRequeridos = ['nombre', 'fecha', 'horario', 'salon', 'categoria', 'contacto'];
        let camposFaltantes = [];

        camposRequeridos.forEach(campo => {
            const elemento = document.querySelector(`#${campo}`);
            if (!elemento || !elemento.value.trim()) {
                camposFaltantes.push(campo);
            }
        });

        if (camposFaltantes.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Campos requeridos',
                text: 'Por favor complete todos los campos obligatorios'
            });
            return;
        }

        // Validar fecha
        const fechaEvento = new Date(document.querySelector('#fecha').value);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);

        if (fechaEvento <= fechaActual) {
            Swal.fire({
                icon: 'error',
                title: 'Fecha inválida',
                text: 'La fecha debe ser posterior a hoy'
            });
            return;
        }

        // Preparar datos del evento
        const eventoData = {
            nombre: document.querySelector('#nombre').value.trim(),
            fecha: document.querySelector('#fecha').value,
            horario: document.querySelector('#horario').value,
            salon_id: parseInt(document.querySelector('#salon').value),
            categoria_id: parseInt(document.querySelector('#categoria').value),
            precio: parseFloat(document.querySelector('#precio').value) || 0,
            descripcion: document.querySelector('#descripcion').value.trim(),
            imagen_url: document.querySelector('#imagen').value.trim() || '',
            contacto_responsable: document.querySelector('#contacto').value.trim()
        };

        const idEvento = document.querySelector('#id-evento').value;
        const method = idEvento ? 'PUT' : 'POST';
        const url = idEvento ? `${BASEURL}/eventos/${idEvento}` : `${BASEURL}/eventos`;

        const response = await fetchDataWithAuth(url, method, eventoData);

        if (response) {
            await Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: idEvento ? 'Evento actualizado correctamente' : 'Evento creado correctamente'
            });
            
            // Redireccionar a la lista de eventos
            window.location.href = 'eventos.html';
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al guardar el evento. Por favor, intente nuevamente.'
        });
        console.error('Error al guardar evento:', error);
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Cargar datos necesarios
        await Promise.all([loadSalones(), loadCategorias()]);

        // Verificar si es edición y cargar datos
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');
        if (eventoId) {
            await loadEventoData(eventoId);
        }

        // Asignar evento al formulario
        const form = document.querySelector('#form-evento');
        if (form) {
            form.addEventListener('submit', saveEvento);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al inicializar el formulario'
        });
        console.error('Error en la inicialización:', error);
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        await Promise.all([loadSalones(), loadCategorias()]);

        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');
        if (eventoId) {
            await loadEventoData(eventoId);
        }

        document.querySelector('#form-evento').addEventListener('submit', saveEvento);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al inicializar la página'
        });
    }
});