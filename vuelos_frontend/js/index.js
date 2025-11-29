// redirección automática si ya hay sesión
  (function(){
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');

    // si hay token y rol, redirigir al panel correspondiente
    if (token && role) {
      if (role === 'administrador') {
        window.location.href = 'admin_users.html';
        return;
      }
      if (role === 'gestor') {
        window.location.href = 'gestor_reservas.html';
        return;
      }
    }

    // botones
    document.getElementById('btnLogin').addEventListener('click', ()=> location.href = 'login.html');
    document.getElementById('btnAdminUsers').addEventListener('click', ()=> location.href = 'admin_users.html');
    document.getElementById('btnAdminFlights').addEventListener('click', ()=> location.href = 'admin_flights.html');
    document.getElementById('btnGestor').addEventListener('click', ()=> location.href = 'gestor_reservas.html');

    // atajos
    document.getElementById('gotoAdminUsers').addEventListener('click', ()=> location.href = 'admin_users.html');
    document.getElementById('gotoAdminFlights').addEventListener('click', ()=> location.href = 'admin_flights.html');
    document.getElementById('gotoGestor').addEventListener('click', ()=> location.href = 'gestor_reservas.html');
  })();