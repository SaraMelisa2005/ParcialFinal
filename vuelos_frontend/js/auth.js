
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? 'Credenciales inválidas');
        return;
      }

      
      localStorage.setItem('jwt_token', data.token);

     
      window.location = 'home.html';

    } catch (err) {
      alert('Error de conexión con el servidor');
      console.error(err);
    }
  });
});


function ensureAuth(redirectTo='login.html') {
  const t = localStorage.getItem('jwt_token');
  if (!t) location.href = redirectTo;
}

function logout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_name');
  location.href = 'login.html';
}