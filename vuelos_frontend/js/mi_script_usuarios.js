import { getToken, getUser } from './local-storage.js';
import * as API from './api.js';

if (!getToken())
  window.location.href = 'login.html';

const user = getUser();
if (!user) window.location.href = "login.html";

async function cargarUsuarios() {
  try {
    const res = await API.get('/users');
    const tbody = document.querySelector("#tablaUsuarios tbody");
    tbody.innerHTML = "";

    res.data.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.id}</td>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.rol}</td>
          <td>
            <button class="edit-btn" onclick="editarUsuario(${u.id})">Editar</button>
            <button class="del-btn" onclick="eliminarUsuario(${u.id})">Eliminar</button>
          </td>
        </tr>`;
    });
  } catch (e) {
    alert("Error cargando usuarios");
  }
}

async function eliminarUsuario(id) {
  if (!confirm("¿Seguro de eliminar?")) return;
  await API.delete('/users/' + id);
  cargarUsuarios();
}

function crearUsuario() {
  alert("Aquí abriremos modal/form para crear usuario");
}

function editarUsuario(id) {
  alert("Aquí abriremos modal/form para editar usuario ID=" + id);
}

cargarUsuarios();