const BASEURL = 'http://127.0.0.1:5000';

/**
 * @param {string} url
 * @param {string} method
 * @param {Object} [data=null]
 * @returns {Promise<Object>}
 */
async function fetchData(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
    };

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.message || `Error: ${response.statusText}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

/**
 * @param {Event} event
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    try {
        const loginData = {
            email: email,
            password: password
        };

        const response = await fetchData(`${BASEURL}/api/auth/login`, 'POST', loginData);
     
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        Swal.fire({
            title: 'Éxito!',
            text: 'Has iniciado sesión correctamente',
            icon: 'success',
            confirmButtonText: 'Continuar'
        }).then(() => {
            window.location.href = './../index.html';
        });
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: error.message || 'Error al iniciar sesión',
            icon: 'error',
            confirmButtonText: 'Cerrar'
        });
    }
}

/**
 * @param {Event} event
 */
async function handleRegistro(event) {
    event.preventDefault();
    
    const nombre = document.querySelector('#nombre').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirm-password').value;

    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Error!',
            text: 'Las contraseñas no coinciden',
            icon: 'error',
            confirmButtonText: 'Cerrar'
        });
        return;
    }

    try {
        const registroData = {
            nombre: nombre,
            email: email,
            password: password
        };

        const response = await fetchData(`${BASEURL}/api/auth/register`, 'POST', registroData);

        Swal.fire({
            title: 'Éxito!',
            text: 'Registro exitoso. Por favor, inicia sesión.',
            icon: 'success',
            confirmButtonText: 'Ir al login'
        }).then(() => {
            window.location.href = 'login.html';
        });
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: error.message || 'Error al registrar usuario',
            icon: 'error',
            confirmButtonText: 'Cerrar'
        });
    }
}


function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

async function fetchDataWithAuth(url, method, data = null) {
    const options = {
        method: method,
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : null,
    };

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
          
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('#form-login');
    const registroForm = document.querySelector('#form-registro');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }


    if (window.location.pathname.includes('../../index.html')) {
        checkAuth();
    }
});