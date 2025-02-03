const BASEURL = 'http://127.0.0.1:5000/api';
let eventosData = [];

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
            text: 'Error al cargar los datos. Por favor, intenta de nuevo.'
        });
        return null;
    }
}

async function loadCategorias() {
    try {
        const categorias = await fetchDataWithAuth(`${BASEURL}/categorias`, 'GET');
        if (categorias) {
            const select = document.querySelector('#filter-categoria');
            if (select) {
                select.innerHTML = '<option value="">Todas las categorías</option>';
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

function formatDateToISO(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount || 0);
}

async function loadEventos() {
    try {
        const eventos = await fetchDataWithAuth(`${BASEURL}/eventos`, 'GET');
        if (eventos) {
            eventosData = eventos;
            displayEventos(eventosData);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los eventos'
        });
    }
}

function filterEventos() {
    const nombre = document.querySelector('#search-nombre')?.value.toLowerCase() || '';
    const categoria = document.querySelector('#filter-categoria')?.value || '';
    const fechaInput = document.querySelector('#filter-fecha')?.value || '';
    const precioMin = parseFloat(document.querySelector('#filter-precio-min')?.value) || 0;
    const precioMax = parseFloat(document.querySelector('#filter-precio-max')?.value) || Infinity;

    const eventosFiltrados = eventosData.filter(evento => {
        const fechaEvento = formatDateToISO(evento.fecha);
        
        const cumpleNombre = evento.nombre.toLowerCase().includes(nombre);
        const cumpleCategoria = !categoria || evento.categoria_id.toString() === categoria;
        const cumpleFecha = !fechaInput || fechaEvento === fechaInput;
        const cumplePrecio = (!precioMin || evento.precio >= precioMin) && 
                            (!precioMax || evento.precio <= precioMax);

        return cumpleNombre && cumpleCategoria && cumpleFecha && cumplePrecio;
    });

    displayEventos(eventosFiltrados);
}

function createEventoElement(evento) {
    const template = document.querySelector('#evento-template');
    if (!template) return null;

    try {
        const clone = template.content.cloneNode(true);

        const img = clone.querySelector('.evento-imagen img');
        if (img) {
            img.src = evento.imagen_url || '../static/img/default-evento.jpg';
            img.alt = evento.nombre || 'Imagen del evento';
        }

        const elementos = {
            '.evento-titulo': evento.nombre || 'Sin título',
            '.evento-fecha': evento.fecha ? formatDateForDisplay(evento.fecha) : 'Fecha no especificada',
            '.evento-horario': `Horario: ${evento.horario || 'No especificado'}`,
            '.evento-salon': `Salón: ${evento.salon_nombre || 'No especificado'}`,
            '.evento-categoria': `Categoría: ${evento.categoria_nombre || 'Sin categoría'}`,
            '.evento-precio': formatCurrency(evento.precio || 0)
        };

        Object.entries(elementos).forEach(([selector, valor]) => {
            const elemento = clone.querySelector(selector);
            if (elemento) {
                elemento.textContent = valor;
            }
        });

        const verMasBtn = clone.querySelector('.ver-mas');
        if (verMasBtn) {
            verMasBtn.addEventListener('click', () => {
                window.location.href = `evento-detalle.html?id=${evento.id}`;
            });
        }

        return clone;
    } catch (error) {
        return null;
    }
}

function displayEventos(eventos) {
    const container = document.querySelector('#eventos-container');
    if (!container) return;

    container.innerHTML = '';

    if (!eventos || eventos.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>No se encontraron eventos.</p>
            </div>`;
        return;
    }

    eventos.forEach(evento => {
        const eventoElement = createEventoElement(evento);
        if (eventoElement) {
            container.appendChild(eventoElement);
        }
    });
}

function clearFilters() {
    const elements = ['#search-nombre', '#filter-categoria', '#filter-fecha', 
                     '#filter-precio-min', '#filter-precio-max'];
    
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.value = '';
    });

    displayEventos(eventosData);
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await Promise.all([loadEventos(), loadCategorias()]);
        
        document.querySelector('#filter-fecha')?.addEventListener('change', filterEventos);
        document.querySelector('#filter-categoria')?.addEventListener('change', filterEventos);
        document.querySelector('#search-nombre')?.addEventListener('input', filterEventos);
        document.querySelector('#filter-precio-min')?.addEventListener('input', filterEventos);
        document.querySelector('#filter-precio-max')?.addEventListener('input', filterEventos);
        document.querySelector('#btn-reset')?.addEventListener('click', clearFilters);
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al inicializar la página'
        });
    }
});