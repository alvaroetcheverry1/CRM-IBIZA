#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/dev-login | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')
curl -s -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Test","apellidos":"","email":"","telefono":"","tipo":"COMPRADOR","estado":"NUEVO","presupuesto":null,"zonaInteres":"","habitacionesMin":null,"habitacionesMax":null,"origen":"","notas":""}'
