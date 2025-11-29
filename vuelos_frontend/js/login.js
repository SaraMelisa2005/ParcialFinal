import { saveUser } from './js/local-storage.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://127.0.0.1:8000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: username, password }),
  });

  const data = await res.json();

  if (data.success === true) {
    saveUser(data.user); // <--- IMPORTANTE
    window.location.href = "home.html"; // asegúrate que existe
  } else {
    alert('Credenciales incorrectas');
  }
});