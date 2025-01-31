// eventos.js
const BASEURL = 'http://127.0.0.1:5000/api';
let eventosData = [];

async function fetchDataWithAuth(url, method, data = null) {
    console.log('Fetching:', url, method);
    
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Presente' : 'No presente');
    
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
        console.log('Fetch options:', options);
        const response = await fetch(url, options);
        console.log('Response status:', response.status);
        
        if (response.status === 401) {
            console.log('Unauthorized - redirecting to login');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos. Por favor, intenta de nuevo.'
        });
        return null;
    }
}


async function loadCategorias() {
    console.log('Cargando categorías...');
    try {
        const categorias = await fetchDataWithAuth(`${BASEURL}/categorias`, 'GET');
        console.log('Categorías recibidas:', categorias);
        
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
        console.error('Error cargando categorías:', error);
    }
}

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

async function loadEventos() {
    console.log('Iniciando carga de eventos');
    try {
        const eventos = await fetchDataWithAuth(`${BASEURL}/eventos`, 'GET');
        console.log('Eventos recibidos:', eventos);
        
        if (!eventos) {
            console.log('No se recibieron eventos');
            return;
        }

        eventosData = eventos;
        console.log('Eventos guardados en eventosData:', eventosData);
        displayEventos(eventosData);
    } catch (error) {
        console.error('Error loading eventos:', error);
    }
}

function filterEventos() {
    const nombre = document.querySelector('#search-nombre')?.value.toLowerCase() || '';
    const categoria = document.querySelector('#filter-categoria')?.value || '';
    const fecha = document.querySelector('#filter-fecha')?.value || '';
    const precioMin = parseFloat(document.querySelector('#filter-precio-min')?.value) || 0;
    const precioMax = parseFloat(document.querySelector('#filter-precio-max')?.value) || Infinity;

    const eventosFiltrados = eventosData.filter(evento => {
        const cumpleNombre = evento.nombre.toLowerCase().includes(nombre);
        const cumpleCategoria = !categoria || evento.categoria_id === parseInt(categoria);
        const cumpleFecha = !fecha || evento.fecha === fecha;
        const cumplePrecio = evento.precio >= precioMin && evento.precio <= precioMax;

        return cumpleNombre && cumpleCategoria && cumpleFecha && cumplePrecio;
    });

    displayEventos(eventosFiltrados);
}

function displayEventos(eventos) {
    console.log('Mostrando eventos:', eventos);
    const container = document.querySelector('#eventos-container');
    
    if (!container) {
        console.error('No se encontró el contenedor de eventos');
        return;
    }

    container.innerHTML = '';

    if (!eventos || eventos.length === 0) {
        console.log('No hay eventos para mostrar');
        container.innerHTML = `
            <div class="no-results">
                <p>No se encontraron eventos.</p>
            </div>`;
        return;
    }

    eventos.forEach(evento => {
        try {
            console.log('Procesando evento:', evento);
            const eventoElement = createEventoElement(evento);
            if (eventoElement) {
                container.appendChild(eventoElement);
            }
        } catch (error) {
            console.error('Error al crear elemento de evento:', error);
        }
    });
}

function createEventoElement(evento) {
    const template = document.querySelector('#evento-template');
    if (!template) {
        console.error('No se encontró el template de evento');
        return null;
    }

    try {
        const clone = template.content.cloneNode(true);

    
        const img = clone.querySelector('.evento-imagen img');
        if (img) {
            img.src = evento.imagen_url || '../static/img/evento-default.jpg';
            img.alt = evento.nombre || 'Imagen del evento';
        }

   
        const elementos = {
            '.evento-titulo': evento.nombre || 'Sin título',
            '.evento-fecha': evento.fecha ? formatDate(evento.fecha) : 'Fecha no especificada',
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
        console.error('Error al crear elemento de evento:', error);
        return null;
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Cargado, iniciando...');
    

    const token = localStorage.getItem('token');
    console.log('Token en localStorage:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
       
        await Promise.all([
            loadEventos(),
            loadCategorias()
        ]);
        
     
        const btnSearch = document.querySelector('#btn-search');
        const btnReset = document.querySelector('#btn-reset');
        
        if (btnSearch) {
            btnSearch.addEventListener('click', filterEventos);
        }
        
        if (btnReset) {
            btnReset.addEventListener('click', () => {
             
                document.querySelectorAll('.input-search').forEach(input => input.value = '');
                displayEventos(eventosData);
            });
        }
    } catch (error) {
        console.error('Error en la inicialización:', error);
    }
});