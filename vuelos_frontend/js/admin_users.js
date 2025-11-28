// admin_users.js
ensureAuth();
document.getElementById('welcome').textContent = "Bienvenido, " + (localStorage.getItem('user_name') || '');

async function loadUsers() {
  const res = await API.get('/users', API.usersBase);
  if (!res.ok) {
    if (res.status === 401) { logout(); return; }
    alert('Error cargando usuarios');
    return;
  }
  const users = await res.json();
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.id}</td>
      <td><input data-id="${u.id}" class="edit-name" value="${u.name}"></td>
      <td>${u.email}</td>
      <td>
        <select data-id="${u.id}" class="edit-role">
          <option ${u.role==='administrador'?'selected':''} value="administrador">administrador</option>
          <option ${u.role==='gestor'?'selected':''} value="gestor">gestor</option>
        </select>
      </td>
      <td>
        <button class="btn primary btn-save" data-id="${u.id}">Guardar</button>
      </td>`;
    tbody.appendChild(tr);
  });
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.btn-save').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const name = document.querySelector('.edit-name[data-id="'+id+'"]').value;
      const role = document.querySelector('.edit-role[data-id="'+id+'"]').value;
      const res = await API.put('/users/'+id, { name, role }, API.usersBase);
      if (!res.ok) { alert('Error al actualizar'); return; }
      await loadUsers();
    };
  });
}

document.getElementById('btnCreate').addEventListener('click', async () => {
  const name = document.getElementById('new_name').value.trim();
  const email = document.getElementById('new_email').value.trim();
  const password = document.getElementById('new_password').value.trim();
  const role = document.getElementById('new_role').value;
  if(!name||!email||!password){ alert('Completa todos los campos'); return; }
  const res = await API.post('/register', { name, email, password, role }, API.usersBase);
  if (!res.ok) { alert('Error creando usuario'); return; }
  document.getElementById('new_name').value='';document.getElementById('new_email').value='';document.getElementById('new_password').value='';
  await loadUsers();
});

loadUsers();