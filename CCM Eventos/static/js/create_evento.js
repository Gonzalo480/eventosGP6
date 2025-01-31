// create_evento.js
const BASEURL = 'http://127.0.0.1:5000/api';

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
        
        const responseData = await response.json();
        console.log('Response data:', responseData); 
        
        if (response.status === 401) {
            console.log('Unauthorized - redirecting to login'); 
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return responseData;
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

async function loadSalones() {
    try {
        console.log('Iniciando carga de salones...');
        const salones = await fetchDataWithAuth(`${BASEURL}/salones`, 'GET');
        console.log('Salones recibidos:', salones);
        
        const select = document.querySelector('#salon');
        if (!select) {
            console.error('No se encontró el elemento select para salones');
            return;
        }

        select.innerHTML = '<option value="">Seleccione salón</option>';
        
        if (Array.isArray(salones) && salones.length > 0) {
            salones.forEach(salon => {
                const option = document.createElement('option');
                option.value = salon.id;
                option.textContent = `${salon.nombre} (Capacidad: ${salon.capacidad})`;
                select.appendChild(option);
            });
            console.log('Salones cargados en el select');
        } else {
            console.log('No se recibieron salones del servidor');
            select.innerHTML = '<option value="">No hay salones disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando salones:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los salones'
        });
    }
}

async function loadCategorias() {
    try {
        console.log('Iniciando carga de categorías...');
        const categorias = await fetchDataWithAuth(`${BASEURL}/categorias`, 'GET');
        console.log('Categorías recibidas:', categorias);
        
        const select = document.querySelector('#categoria');
        if (!select) {
            console.error('No se encontró el elemento select para categorías');
            return;
        }

        select.innerHTML = '<option value="">Seleccione categoría</option>';
        
        if (Array.isArray(categorias) && categorias.length > 0) {
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                select.appendChild(option);
            });
            console.log('Categorías cargadas en el select');
        } else {
            console.log('No se recibieron categorías del servidor');
            select.innerHTML = '<option value="">No hay categorías disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las categorías'
        });
    }
}

async function saveEvento(event) {
    event.preventDefault();
    console.log('Iniciando guardado de evento...'); 

    try {
      
        const fechaEvento = new Date(document.querySelector('#fecha').value);
        const fechaActual = new Date();

        if (fechaEvento <= fechaActual) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha debe ser posterior a la fecha actual',
                icon: 'error'
            });
            return;
        }

      
        const camposRequeridos = ['nombre', 'fecha', 'horario', 'salon', 'categoria', 'precio'];
        let faltanCampos = false;
        
        camposRequeridos.forEach(campo => {
            const elemento = document.querySelector(`#${campo}`);
            if (!elemento.value) {
                faltanCampos = true;
                elemento.classList.add('error');
            } else {
                elemento.classList.remove('error');
            }
        });

        if (faltanCampos) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor complete todos los campos requeridos',
                icon: 'error'
            });
            return;
        }

        const eventoData = {
            nombre: document.querySelector('#nombre').value,
            fecha: document.querySelector('#fecha').value,
            horario: document.querySelector('#horario').value,
            salon_id: parseInt(document.querySelector('#salon').value),
            categoria_id: parseInt(document.querySelector('#categoria').value),
            precio: parseFloat(document.querySelector('#precio').value),
            descripcion: document.querySelector('#descripcion').value,
            imagen_url: document.querySelector('#imagen').value,
            contacto_responsable: document.querySelector('#contacto').value
        };

        console.log('Datos del evento a guardar:', eventoData); 

        const idEvento = document.querySelector('#id-evento').value;
        const method = idEvento ? 'PUT' : 'POST';
        const url = idEvento ? `${BASEURL}/eventos/${idEvento}` : `${BASEURL}/eventos`;

        const response = await fetchDataWithAuth(url, method, eventoData);
        console.log('Respuesta del servidor:', response); 

        if (response) {
            Swal.fire({
                title: 'Éxito',
                text: idEvento ? 'Evento actualizado correctamente' : 'Evento creado correctamente',
                icon: 'success'
            }).then(() => {
                window.location.href = 'eventos.html';
            });
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al guardar el evento'
        });
    }
}

async function loadEventoData() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    if (eventoId) {
        try {
            console.log('Cargando datos del evento:', eventoId); 
            const evento = await fetchDataWithAuth(`${BASEURL}/eventos/${eventoId}`, 'GET');
            if (!evento) return;

            console.log('Datos del evento recibidos:', evento); 
       
            const campos = {
                'id-evento': evento.id,
                'nombre': evento.nombre,
                'fecha': evento.fecha,
                'horario': evento.horario,
                'salon': evento.salon_id,
                'categoria': evento.categoria_id,
                'precio': evento.precio,
                'descripcion': evento.descripcion,
                'imagen': evento.imagen_url,
                'contacto': evento.contacto_responsable
            };

            Object.entries(campos).forEach(([id, valor]) => {
                const elemento = document.querySelector(`#${id}`);
                if (elemento) {
                    elemento.value = valor;
                }
            });

            console.log('Formulario actualizado con datos del evento'); 
        } catch (error) {
            console.error('Error cargando datos del evento:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los datos del evento'
            });
        }
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Cargado, iniciando...'); 
    
    try {
      
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No hay token, redirigiendo a login');
            window.location.href = 'login.html';
            return;
        }
        console.log('Token encontrado');

  
        console.log('Iniciando carga de datos...');
        await Promise.all([
            loadSalones(),
            loadCategorias()
        ]);

    
        await loadEventoData();

   
        const form = document.querySelector('#form-evento');
        if (form) {
            form.addEventListener('submit', saveEvento);
            console.log('Formulario configurado');
        } else {
            console.error('No se encontró el formulario');
        }
    } catch (error) {
        console.error('Error en la inicialización:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al inicializar la página'
        });
    }
});