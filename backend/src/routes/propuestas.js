const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { emailService } = require('../services/emailService');
const { prisma } = require('../utils/prisma');

// POST /api/propuestas/enviar-disponibilidad
router.post('/enviar-disponibilidad', authenticate, async (req, res) => {
  const { clienteEmail, clienteNombre, propiedadesIds, fechaEntrada, fechaSalida } = req.body;
  if (!clienteEmail || !clienteNombre || !propiedadesIds || !Array.isArray(propiedadesIds)) {
    return res.status(400).json({ error: 'Faltan campos requeridos o propiedadesIds no es un array' });
  }
  try {
    const propiedades = await prisma.propiedad.findMany({
      where: { id: { in: propiedadesIds } },
      include: { alquilerVacacional: true }
    });
    
    await emailService.sendVillaProposal(clienteEmail, clienteNombre, propiedades, fechaEntrada, fechaSalida);
    res.json({ message: 'Propuesta enviada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
