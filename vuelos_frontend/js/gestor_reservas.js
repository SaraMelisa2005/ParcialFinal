
ensureAuth();
document.getElementById('welcome').textContent = "Bienvenido, " + (localStorage.getItem('user_name') || '');

async function loadFlightsForReservation() {
  const res = await API.get('/vuelos', API.flightsBase);
  if (!res.ok) { alert('Error cargando vuelos'); return; }
  const vuelos = await res.json();
  const sel = document.getElementById('select_flight');
  sel.innerHTML = '<option value="">Seleccionar vuelo</option>';
  vuelos.forEach(v => {
    const o = document.createElement('option'); o.value = v.id; o.textContent = `${v.origin} → ${v.destination} (${v.departure})`; sel.appendChild(o);
  });
}

async function loadReservations() {
  const res = await API.get('/reservas', API.flightsBase);
  if (!res.ok) { if (res.status===401) logout(); else alert('Error'); return; }
  const r = await res.json();
  const tbody = document.querySelector('#reservasTable tbody'); tbody.innerHTML='';
  r.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.id}</td>
      <td>${item.flight_id}</td>
      <td>${item.status}</td>
      <td>${item.reserved_at}</td>
      <td>
        ${item.status === 'activa' ? `<button class="btn danger" data-id="${item.id}" data-action="cancel">Cancelar</button>` : ''}
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('button[data-action="cancel"]').forEach(b=>{
    b.onclick = async () => {
      const id = b.dataset.id;
      const res = await API.post(`/reservas/${id}/cancel`, {}, API.flightsBase);
      if (!res.ok) { alert('Error cancelando'); return; }
      await loadReservations();
    };
  });
}

document.getElementById('btnCreateReservation').addEventListener('click', async ()=>{
  const flight_id = document.getElementById('select_flight').value;
  if (!flight_id) { alert('Selecciona un vuelo'); return; }
  const res = await API.post('/reservas', { flight_id: parseInt(flight_id) }, API.flightsBase);
  if (!res.ok) { alert('Error creando reserva'); return; }
  await loadReservations();
});

loadFlightsForReservation();
loadReservations();