const BASEURL = 'http://127.0.0.1:5000/api';

async function fetchData(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.message || 'Error en el servidor');
        }
        
        return responseData;
    } catch (error) {
        console.error('Error en la petición:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al procesar la solicitud'
        });
        throw error;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;

        if (!email || !password) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor complete todos los campos'
            });
            return;
        }

        const loginData = {
            email: email,
            password: password
        };

        const response = await fetchData(`${BASEURL}/auth/login`, 'POST', loginData);
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: 'Has iniciado sesión correctamente'
        }).then(() => {
            window.location.href = 'eventos.html';
        });
    } catch (error) {
        console.error('Error en login:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    try {
        const nombre = document.querySelector('#nombre').value;
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        const confirmPassword = document.querySelector('#confirm-password').value;

        if (!nombre || !email || !password || !confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor complete todos los campos'
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden'
            });
            return;
        }

        const registerData = {
            nombre: nombre,
            email: email,
            password: password
        };

        const response = await fetchData(`${BASEURL}/auth/register`, 'POST', registerData);

        Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Por favor inicia sesión'
        }).then(() => {
            window.location.href = 'login.html';
        });
    } catch (error) {
        console.error('Error en registro:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#form-login');
    const registerForm = document.querySelector('#form-registro');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});