(async () => {
  const get = (url, opts) => fetch(url, opts).then(r => r.json());

  // 1. Dev login
  const auth = await fetch('http://localhost:3000/api/auth/dev-login', { method: 'POST' }).then(r => r.json());
  const token = auth.accessToken || auth.token;

  if (!token) { console.error('No token!', auth); return; }

  // 2. Post lead
  const payload = {
    nombre: "Test", apellidos: "", email: "", telefono: "",
    tipo: "COMPRADOR", estado: "NUEVO", presupuesto: null,
    zonaInteres: "", habitacionesMin: null, habitacionesMax: null,
    origen: "", notas: ""
  };

  const res = await fetch('http://localhost:3000/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(payload)
  });

  const body = await res.json();
  console.log("Status:", res.status);
  console.log("Body:", body);
})();
