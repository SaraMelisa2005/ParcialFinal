import { API } from './api.js';
import { getToken, clearSession } from './local-storage.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return location.href = 'login.html';

    cargarUsuarios();

    document.getElementById('btnNuevo').onclick = abrirNuevo;
    document.getElementById('btnCancelar').onclick = cerrarModal;
    document.getElementById('btnGuardar').onclick = guardarUsuario;
    document.getElementById('logoutBtn').onclick = salir;
});

const loader = document.getElementById('loader');
const modal = document.getElementById('modalUsuario');

function mostrarLoader(show) {
    loader.classList[show ? 'remove' : 'add']('hidden');
}

async function cargarUsuarios() {
    mostrarLoader(true);
    try {
        const res = await API.get('/users', getToken());
        const tbody = document.querySelector('#tblUsuarios tbody');
        tbody.innerHTML = '';

        res.data.forEach(u => {
            tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.name}</td>
                <td>${u.rol}</td>
                <td>
                    <button onclick="editar(${u.id}, '${u.username}', '${u.name}', '${u.rol}')">Editar</button>
                    <button onclick="eliminar(${u.id})">Eliminar</button>
                </td>
            </tr>`;
        });
    } catch (error) {
        alert("Error cargando usuarios");
    }
    mostrarLoader(false);
}

window.editar = (id, user, name, rol) => {
    document.getElementById('tituloModal').innerText = "Editar Usuario";
    document.getElementById('idUsuario').value = id;
    document.getElementById('usuario').value = user;
    document.getElementById('nombre').value = name;
    document.getElementById('rol').value = rol;
    modal.classList.remove('hidden');
};

function abrirNuevo() {
    document.getElementById('tituloModal').innerText = "Nuevo Usuario";
    document.getElementById('idUsuario').value = '';
    document.getElementById('usuario').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('rol').value = '';
    modal.classList.remove('hidden');
}

function cerrarModal() {
    modal.classList.add('hidden');
}

async function guardarUsuario() {
    const id = document.getElementById('idUsuario').value;
    const username = document.getElementById('usuario').value;
    const name = document.getElementById('nombre').value;
    const rol = document.getElementById('rol').value;

    if (!username || !name || !rol) return alert("Complete todos los campos");

    try {
        if (!id) {
            await API.post('/users', { username, name, rol }, getToken());
            alert("Usuario creado");
        } else {
            await API.put(`/users/${id}`, { username, name, rol }, getToken());
            alert("Usuario actualizado");
        }
        cerrarModal();
        cargarUsuarios();
    } catch (e) {
        alert("Error guardando usuario");
    }
}

window.eliminar = async (id) => {
    if (!confirm("¿Seguro que desea eliminar este usuario?")) return;

    try {
        await API.delete(`/users/${id}`, getToken());
        cargarUsuarios();
    } catch (e) {
        alert("Error eliminando usuario");
    }
};

function salir() {
    clearSession();
    location.href = 'login.html';
}