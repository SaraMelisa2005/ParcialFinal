
ensureAuth();
document.getElementById('welcome').textContent = "Bienvenido, " + (localStorage.getItem('user_name') || '');

async function loadNaves() {
  const res = await API.get('/naves', API.flightsBase);
  if (!res.ok) { alert('Error cargando naves'); return; }
  const naves = await res.json();
  const sel = document.getElementById('nave_select');
  sel.innerHTML = '<option value="">Seleccionar nave</option>';
  naves.forEach(n => {
    const o = document.createElement('option'); o.value = n.id; o.textContent = `${n.name} (${n.model})`; sel.appendChild(o);
  });
}

async function loadFlights(params={}) {
  let url = '/vuelos';
  const qs = new URLSearchParams(params).toString();
  if (qs) url += '?'+qs;
  const res = await API.get(url, API.flightsBase);
  if (!res.ok) { if (res.status===401) logout(); else alert('Error'); return; }
  const flights = await res.json();
  const tbody = document.querySelector('#flightsTable tbody'); tbody.innerHTML='';
  flights.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${f.id}</td>
      <td>${f.nave_id || ''}</td>
      <td>${f.origin}</td>
      <td>${f.destination}</td>
      <td>${f.departure}</td>
      <td>${f.arrival}</td>
      <td>${f.price}</td>
      <td>
        <button class="btn" data-id="${f.id}" data-action="edit">Editar</button>
        <button class="btn danger" data-id="${f.id}" data-action="delete">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
  attachFlightEvents();
}

function attachFlightEvents() {
  document.querySelectorAll('button[data-action]').forEach(b=>{
    b.onclick = async ()=> {
      const id = b.dataset.id;
      if (b.dataset.action === 'edit') {
        
        const res = await API.get('/vuelos', API.flightsBase);
        const list = await res.json();
        const f = list.find(x=>x.id==id);
        if (!f) { alert('Vuelo no encontrado'); return; }
        document.getElementById('flight_id').value = f.id;
        document.getElementById('nave_select').value = f.nave_id;
        document.getElementById('origin').value = f.origin;
        document.getElementById('destination').value = f.destination;
        document.getElementById('departure').value = f.departure.replace(' ', 'T');
        document.getElementById('arrival').value = f.arrival.replace(' ', 'T');
        document.getElementById('price').value = f.price;
      } else if (b.dataset.action === 'delete') {
        if (!confirm('Eliminar vuelo?')) return;
        const res = await API.del(`/vuelos/${id}`, API.flightsBase);
        if (res.ok) loadFlights();
        else alert('Error eliminando');
      }
    };
  });
}

document.getElementById('btnSaveFlight').addEventListener('click', async () => {
  const id = document.getElementById('flight_id').value;
  const data = {
    nave_id: parseInt(document.getElementById('nave_select').value) || null,
    origin: document.getElementById('origin').value,
    destination: document.getElementById('destination').value,
    departure: document.getElementById('departure').value.replace('T',' '),
    arrival: document.getElementById('arrival').value.replace('T',' '),
    price: parseFloat(document.getElementById('price').value) || 0
  };
  if (id) {
    const res = await API.put(`/vuelos/${id}`, data, API.flightsBase);
    if (!res.ok) { alert('Error actualizando'); return; }
  } else {
    const res = await API.post('/vuelos', data, API.flightsBase);
    if (!res.ok) { alert('Error creando'); return; }
  }
  
  document.getElementById('flight_id').value='';
  await loadFlights();
});

document.getElementById('btnSearch').addEventListener('click', async ()=>{
  const params = {};
  if (document.getElementById('q_origin').value) params.origin = document.getElementById('q_origin').value;
  if (document.getElementById('q_destination').value) params.destination = document.getElementById('q_destination').value;
  if (document.getElementById('q_date').value) params.date = document.getElementById('q_date').value;
  await loadFlights(params);
});


loadNaves();
loadFlights();