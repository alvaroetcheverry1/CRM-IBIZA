/**
 * portalesService.js
 * Servicio de publicación automática en portales inmobiliarios.
 *
 * Portales soportados:
 *  - Idealista      → Feed XML estándar (Idealista XML v1)
 *  - Fotocasa       → Feed XML estándar (Fotocasa XML)
 *  - James Edition  → JSON REST (formato propio simulated/mock)
 *  - Kyero          → Feed XML estándar Kyero (usado por múltiples portales internacionales)
 *
 * NOTA: En producción, Idealista y Fotocasa consumen un feed XML hospedado en tu servidor.
 * Tú les proporcionas la URL del feed y ellos lo procesan periódicamente.
 * James Edition dispone de una API REST directa para agencias premium.
 *
 * Este servicio:
 *  1. Convierte el objeto `Propiedad` del CRM al formato de cada portal.
 *  2. Llama a la API del portal (o actualiza el estado del feed).
 *  3. Almacena el estado de la publicación en `PublicacionPortal`.
 */

const { prisma } = require('../utils/prisma');

// ─── Configuración de portales ─────────────────────────────────────────────
const PORTALES_CONFIG = {
  idealista: {
    nombre: 'Idealista',
    logo: '🏠',
    tipo: 'xml_feed',
    feedUrl: process.env.IDEALISTA_FEED_URL || null,
    apiKey: process.env.IDEALISTA_API_KEY || null,
    baseUrl: 'https://www.idealista.com',
  },
  fotocasa: {
    nombre: 'Fotocasa',
    logo: '📸',
    tipo: 'xml_feed',
    feedUrl: process.env.FOTOCASA_FEED_URL || null,
    apiKey: process.env.FOTOCASA_API_KEY || null,
    baseUrl: 'https://www.fotocasa.es',
  },
  james_edition: {
    nombre: 'James Edition',
    logo: '💎',
    tipo: 'api_rest',
    apiEndpoint: process.env.JAMES_EDITION_API_ENDPOINT || 'https://www.jamesedition.com/api/v1/listings',
    apiKey: process.env.JAMES_EDITION_API_KEY || null,
    baseUrl: 'https://www.jamesedition.com',
  },
  kyero: {
    nombre: 'Kyero',
    logo: '🌍',
    tipo: 'xml_feed',
    feedUrl: process.env.KYERO_FEED_URL || null,
    apiKey: null,
    baseUrl: 'https://www.kyero.com',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Obtiene las URLs absolutas de fotos de una propiedad.
 * Prioriza Google Drive, luego fallback local.
 */
function obtenerFotosUrls(propiedad, baseUrl) {
  const fotosLocal = (() => {
    try { return JSON.parse(propiedad.fotos || '[]'); } catch { return []; }
  })();

  const fotosDocs = (propiedad.documentos || [])
    .filter(d => d.tipo === 'FOTO' && (d.urlDrive || d.id))
    .map(d => {
      if (d.urlDrive && d.urlDrive.startsWith('http')) return d.urlDrive;
      if (d.driveFileId) return `https://drive.google.com/uc?export=view&id=${d.driveFileId}`;
      // Fallback local
      return `${baseUrl}/api/uploads/${d.id}`;
    });

  // Combinar y deduplicar
  const todas = [...new Set([...fotosDocs, ...fotosLocal])].slice(0, 20);
  return todas;
}

/**
 * Obtiene el precio principal de la propiedad según su tipo.
 */
function obtenerPrecioPrincipal(propiedad) {
  if (propiedad.venta?.precioVenta) return Number(propiedad.venta.precioVenta);
  if (propiedad.alquilerVacacional?.precioTemporadaAlta) return Number(propiedad.alquilerVacacional.precioTemporadaAlta);
  if (propiedad.alquilerLargaDuracion?.rentaMensual) return Number(propiedad.alquilerLargaDuracion.rentaMensual);
  return null;
}

/**
 * Mapea el tipo de propiedad del CRM al formato del portal.
 */
function mapearTipoPropiedad(tipo, portal) {
  const mapas = {
    idealista: { VENTA: 'sale', VACACIONAL: 'rental', LARGA_DURACION: 'rental' },
    fotocasa: { VENTA: 'venta', VACACIONAL: 'alquiler', LARGA_DURACION: 'alquiler' },
    james_edition: { VENTA: 'for-sale', VACACIONAL: 'for-rent', LARGA_DURACION: 'for-rent' },
    kyero: { VENTA: 'sale', VACACIONAL: 'rental', LARGA_DURACION: 'rental' },
  };
  return mapas[portal]?.[tipo] || 'sale';
}

// ─── Adaptadores de formato ──────────────────────────────────────────────────

/**
 * Genera el XML estándar para Idealista Feed v1.
 * https://www.idealista.com/pro/herramientas/publicacion-propiedades/
 */
function adaptarParaIdealistaXML(propiedades, serverBaseUrl) {
  const items = propiedades.map(p => {
    const fotos = obtenerFotosUrls(p, serverBaseUrl);
    const precio = obtenerPrecioPrincipal(p);
    const operacion = p.tipo === 'VENTA' ? 'sale' : 'rental';

    return `
    <property>
      <id>${p.referencia}</id>
      <update-date>${new Date(p.actualizadoEn).toISOString()}</update-date>
      <operation>${operacion}</operation>
      <title><![CDATA[${p.nombre}]]></title>
      <description><![CDATA[${p.descripcion || `${p.habitaciones} habitaciones, ${p.banos} baños en ${p.zona}`}]]></description>
      <category>${p.tipo === 'VACACIONAL' ? 'homes' : p.tipo === 'LARGA_DURACION' ? 'homes' : 'homes'}</category>
      <subcategory>villa</subcategory>
      ${precio ? `<price>${precio}</price>` : ''}
      ${p.tipo === 'LARGA_DURACION' ? '<price-period>month</price-period>' : ''}
      <area>${Math.round(Number(p.metrosConstruidos) || 0)}</area>
      <rooms>${p.habitaciones || 0}</rooms>
      <bathrooms>${p.banos || 0}</bathrooms>
      <location>
        <zone><![CDATA[${p.zona}]]></zone>
        <municipality><![CDATA[${p.municipio || 'Ibiza'}]]></municipality>
        <province>Islas Baleares</province>
        <country>es</country>
        ${p.latitud ? `<lat>${p.latitud}</lat>` : ''}
        ${p.longitud ? `<lng>${p.longitud}</lng>` : ''}
      </location>
      <features>
        <bedrooms>${p.habitaciones || 0}</bedrooms>
        <bathrooms>${p.banos || 0}</bathrooms>
        ${p.garaje ? '<garage>true</garage>' : ''}
        ${p.piscina !== 'NO' ? '<pool>true</pool>' : ''}
        ${p.jardin ? '<garden>true</garden>' : ''}
        ${p.terraza ? '<terrace>true</terrace>' : ''}
        ${p.vistasMar ? '<sea-views>true</sea-views>' : ''}
        ${p.metrosParcela ? `<plot-area>${Math.round(Number(p.metrosParcela))}</plot-area>` : ''}
      </features>
      ${fotos.length > 0 ? `<pictures>${fotos.map(url => `<picture><url><![CDATA[${url}]]></url></picture>`).join('\n')}</pictures>` : ''}
      <contact>
        <name>Ibiza Luxury Dreams</name>
        <phone>+34 971 000 000</phone>
        <email>info@ibizaluxurydreams.com</email>
      </contact>
      <reference><![CDATA[${p.referencia}]]></reference>
    </property>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<listings version="1.0" generator="IbizaLuxuryDreamsCRM">
  <date>${new Date().toISOString()}</date>
  ${items}
</listings>`;
}

/**
 * Genera el XML para Fotocasa Feed.
 */
function adaptarParaFotocasaXML(propiedades, serverBaseUrl) {
  const items = propiedades.map(p => {
    const fotos = obtenerFotosUrls(p, serverBaseUrl);
    const precio = obtenerPrecioPrincipal(p);
    const operacion = p.tipo === 'VENTA' ? 'sale' : 'rent';

    return `
    <ad>
      <ref>${p.referencia}</ref>
      <type>${operacion}</type>
      <property-type>house</property-type>
      <sub-type>villa</sub-type>
      <title><![CDATA[${p.nombre}]]></title>
      <description><![CDATA[${p.descripcion || `Villa en ${p.zona}, Ibiza. ${p.habitaciones} habitaciones, ${p.banos} baños.`}]]></description>
      ${precio ? `<price currency="EUR">${precio}</price>` : ''}
      <sqm>${Math.round(Number(p.metrosConstruidos) || 0)}</sqm>
      <rooms>${p.habitaciones || 0}</rooms>
      <baths>${p.banos || 0}</baths>
      <country-code>es</country-code>
      <region>Islas Baleares</region>
      <city>${p.municipio || 'Ibiza'}</city>
      <district><![CDATA[${p.zona}]]></district>
      ${p.latitud && p.longitud ? `<geo><lat>${p.latitud}</lat><lon>${p.longitud}</lon></geo>` : ''}
      <features>
        ${p.piscina !== 'NO' ? '<feature>pool</feature>' : ''}
        ${p.garaje ? '<feature>garage</feature>' : ''}
        ${p.jardin ? '<feature>garden</feature>' : ''}
        ${p.terraza ? '<feature>terrace</feature>' : ''}
        ${p.vistasMar ? '<feature>sea_views</feature>' : ''}
      </features>
      ${fotos.length > 0 ? `<photos>${fotos.map((url, i) => `<photo order="${i + 1}"><url><![CDATA[${url}]]></url></photo>`).join('\n')}</photos>` : ''}
    </ad>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ads generator="IbizaLuxuryDreamsCRM" date="${new Date().toISOString()}">
  ${items}
</ads>`;
}

/**
 * Genera el XML estándar Kyero (usado por Kyero, Thinkspain, etc.)
 * https://www.kyero.com/xml
 */
function adaptarParaKyeroXML(propiedades, serverBaseUrl) {
  const items = propiedades.map(p => {
    const fotos = obtenerFotosUrls(p, serverBaseUrl);
    const precio = obtenerPrecioPrincipal(p);
    const operacion = p.tipo === 'VENTA' ? 'sale' : 'long_term_rental';

    return `
  <property>
    <id>${p.referencia}</id>
    <date>${new Date(p.actualizadoEn).toISOString().split('T')[0]}</date>
    <ref><![CDATA[${p.referencia}]]></ref>
    <price>${precio || 0}</price>
    <currency>EUR</currency>
    <price_freq>${p.tipo === 'LARGA_DURACION' ? 'month' : 'sale'}</price_freq>
    <type>${operacion}</type>
    <beds>${p.habitaciones || 0}</beds>
    <baths>${p.banos || 0}</baths>
    <built>${Math.round(Number(p.metrosConstruidos) || 0)}</built>
    ${p.metrosParcela ? `<plot>${Math.round(Number(p.metrosParcela))}</plot>` : ''}
    <country>es</country>
    <region>ibiza</region>
    <town><![CDATA[${p.municipio || 'Ibiza'}]]></town>
    <province>baleares</province>
    ${p.latitud ? `<latitude>${p.latitud}</latitude>` : ''}
    ${p.longitud ? `<longitude>${p.longitud}</longitude>` : ''}
    <desc><![CDATA[${p.descripcion || `Villa en ${p.zona}. ${p.habitaciones} habitaciones y ${p.banos} baños.`}]]></desc>
    ${fotos.map((url, i) => `<image${i > 0 ? ` id="${i}"` : ''}><url><![CDATA[${url}]]></url></image${i > 0 ? i : ''}>`).join('\n    ')}
    <features>
      ${p.piscina !== 'NO' ? '<feature>pool</feature>' : ''}
      ${p.garaje ? '<feature>garage</feature>' : ''}
      ${p.jardin ? '<feature>garden</feature>' : ''}
      ${p.terraza ? '<feature>terrace</feature>' : ''}
      ${p.vistasMar ? '<feature>sea_views</feature>' : ''}
    </features>
  </property>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<export date="${new Date().toISOString()}" generator="IbizaLuxuryDreamsCRM">
  <properties>
  ${items}
  </properties>
</export>`;
}

/**
 * Genera el payload JSON para James Edition API.
 * James Edition requiere acuerdo directo como agencia premium.
 */
function adaptarParaJamesEditionJSON(propiedad, serverBaseUrl) {
  const fotos = obtenerFotosUrls(propiedad, serverBaseUrl);
  const precio = obtenerPrecioPrincipal(propiedad);

  return {
    reference: propiedad.referencia,
    title: propiedad.nombre,
    description: propiedad.descripcion || `Exclusiva villa en ${propiedad.zona}, Ibiza.`,
    property_type: 'villa',
    transaction_type: mapearTipoPropiedad(propiedad.tipo, 'james_edition'),
    price: precio,
    currency: 'EUR',
    location: {
      country: 'Spain',
      region: 'Balearic Islands',
      city: propiedad.municipio || 'Ibiza',
      neighborhood: propiedad.zona,
      latitude: propiedad.latitud ? Number(propiedad.latitud) : null,
      longitude: propiedad.longitud ? Number(propiedad.longitud) : null,
    },
    features: {
      bedrooms: propiedad.habitaciones || 0,
      bathrooms: propiedad.banos || 0,
      living_area: Math.round(Number(propiedad.metrosConstruidos) || 0),
      plot_area: propiedad.metrosParcela ? Math.round(Number(propiedad.metrosParcela)) : null,
      pool: propiedad.piscina !== 'NO',
      garage: propiedad.garaje,
      garden: propiedad.jardin,
      terrace: propiedad.terraza,
      sea_views: propiedad.vistasMar,
    },
    images: fotos.map((url, i) => ({ url, order: i + 1 })),
    contact: {
      agency: 'Ibiza Luxury Dreams',
      phone: '+34 971 000 000',
      email: 'info@ibizaluxurydreams.com',
      website: 'https://ibizaluxurydreams.com',
    },
    updated_at: new Date(propiedad.actualizadoEn).toISOString(),
  };
}

// ─── Lógica principal de publicación ────────────────────────────────────────

/**
 * Publica (o actualiza) una propiedad en los portales indicados.
 * Actualiza el registro PublicacionPortal en la DB.
 *
 * @param {string} propiedadId - ID de la propiedad
 * @param {string[]} portales - array de portales: ['idealista', 'fotocasa', 'james_edition', 'kyero']
 * @param {string} serverBaseUrl - URL base del servidor para construir URLs de fotos
 * @returns {Promise<Object[]>} - Array de resultados por portal
 */
async function publicarEnPortales(propiedadId, portales, serverBaseUrl) {
  // Cargar propiedad completa con documentos (fotos)
  const propiedad = await prisma.propiedad.findUnique({
    where: { id: propiedadId, activo: true },
    include: {
      propietario: { select: { nombre: true, apellidos: true, telefono: true, email: true } },
      alquilerVacacional: true,
      alquilerLargaDuracion: true,
      venta: true,
      documentos: {
        where: { tipo: 'FOTO' },
        orderBy: { creadoEn: 'asc' },
      },
    },
  });

  if (!propiedad) throw new Error(`Propiedad ${propiedadId} no encontrada`);

  const resultados = [];

  for (const portal of portales) {
    const config = PORTALES_CONFIG[portal];
    if (!config) {
      resultados.push({ portal, ok: false, error: `Portal desconocido: ${portal}` });
      continue;
    }

    // Marcar como PUBLICANDO
    await prisma.publicacionPortal.upsert({
      where: { propiedadId_portal: { propiedadId, portal } },
      create: { propiedadId, portal, estado: 'PUBLICANDO' },
      update: { estado: 'PUBLICANDO', errores: null },
    });

    try {
      let resultado;

      if (config.tipo === 'api_rest' && portal === 'james_edition') {
        resultado = await publicarJamesEdition(propiedad, config, serverBaseUrl);
      } else {
        // Para feeds XML: simplemente marcamos como publicado (el portal consume el feed automáticamente)
        resultado = await actualizarFeedXML(propiedad, portal, config);
      }

      await prisma.publicacionPortal.update({
        where: { propiedadId_portal: { propiedadId, portal } },
        data: {
          estado: 'PUBLICADO',
          urlPublicacion: resultado.urlPublicacion || null,
          idExterno: resultado.idExterno || null,
          errores: null,
          ultimoSync: new Date(),
          fechaPublicacion: new Date(),
        },
      });

      resultados.push({ portal, ok: true, ...resultado });
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido';
      await prisma.publicacionPortal.update({
        where: { propiedadId_portal: { propiedadId, portal } },
        data: {
          estado: 'ERROR',
          errores: JSON.stringify({ mensaje: errorMsg, fecha: new Date() }),
          ultimoSync: new Date(),
        },
      });
      resultados.push({ portal, ok: false, error: errorMsg });
    }
  }

  return resultados;
}

/**
 * Simula / ejecuta publicación en James Edition vía REST API.
 * En producción: hacer POST/PUT a la API de JamesEdition con el token de agencia.
 */
async function publicarJamesEdition(propiedad, config, serverBaseUrl) {
  const payload = adaptarParaJamesEditionJSON(propiedad, serverBaseUrl);

  if (config.apiKey) {
    // Producción: llamada real a la API
    const https = require('https');
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

    const res = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Agency-Id': process.env.JAMES_EDITION_AGENCY_ID || '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`James Edition API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return {
      urlPublicacion: data.listing_url || `${config.baseUrl}/properties/${propiedad.referencia}`,
      idExterno: data.listing_id || null,
    };
  }

  // Modo simulación (sin API key)
  console.log(`[PORTALES] Simulando publicación en James Edition para ${propiedad.referencia}`);
  return {
    urlPublicacion: `${config.baseUrl}/luxury-homes/es/ibiza/${propiedad.referencia.toLowerCase()}/`,
    idExterno: `JE-SIM-${propiedad.referencia}`,
    simulado: true,
  };
}

/**
 * Para portales de tipo feed XML (Idealista, Fotocasa, Kyero):
 * La propiedad se incluirá automáticamente en el próximo ciclo del feed.
 * Aquí solo registramos el estado y retornamos la URL del feed que el portal debe consumir.
 */
async function actualizarFeedXML(propiedad, portal, config) {
  const feedUrlPublica = config.feedUrl || `${process.env.PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/portales/feed?portal=${portal}`;

  console.log(`[PORTALES] Propiedad ${propiedad.referencia} añadida al feed de ${config.nombre}`);

  return {
    urlPublicacion: null, // Se conocerá cuando el portal indexe el feed
    feedUrl: feedUrlPublica,
    mensaje: `La propiedad aparecerá en ${config.nombre} en el próximo ciclo de importación del feed (máx. 24h).`,
    simulado: !config.apiKey,
  };
}

/**
 * Despublica una propiedad de los portales indicados.
 */
async function despublicarDePortales(propiedadId, portales) {
  for (const portal of portales) {
    await prisma.publicacionPortal.upsert({
      where: { propiedadId_portal: { propiedadId, portal } },
      create: { propiedadId, portal, estado: 'NO_PUBLICADO' },
      update: { estado: 'NO_PUBLICADO', urlPublicacion: null, idExterno: null, ultimoSync: new Date() },
    });
  }
  return { ok: true, portales };
}

/**
 * Obtiene el estado de publicación de una propiedad en todos los portales.
 */
async function obtenerEstadoPublicacion(propiedadId) {
  const publicaciones = await prisma.publicacionPortal.findMany({
    where: { propiedadId },
    orderBy: { actualizadoEn: 'desc' },
  });

  // Construir estado completo de todos los portales (incluyendo los no configurados aún)
  return Object.entries(PORTALES_CONFIG).map(([id, config]) => {
    const pub = publicaciones.find(p => p.portal === id);
    return {
      id,
      nombre: config.nombre,
      logo: config.logo,
      tipo: config.tipo,
      requiereCredenciales: config.tipo === 'api_rest' ? !config.apiKey : false,
      estado: pub?.estado || 'NO_PUBLICADO',
      urlPublicacion: pub?.urlPublicacion || null,
      idExterno: pub?.idExterno || null,
      ultimoSync: pub?.ultimoSync || null,
      fechaPublicacion: pub?.fechaPublicacion || null,
      errores: pub?.errores ? JSON.parse(pub.errores) : null,
    };
  });
}

/**
 * Genera el feed XML consolidado de todas las propiedades publicadas en un portal.
 * Este endpoint es el que los portales consumen periódicamente.
 *
 * @param {string} portal - 'idealista' | 'fotocasa' | 'kyero'
 * @param {string} serverBaseUrl - URL base pública del servidor
 */
async function generarFeedXML(portal, serverBaseUrl) {
  // Obtener todas las propiedades activas marcadas para este portal
  const publicaciones = await prisma.publicacionPortal.findMany({
    where: { portal, estado: { in: ['PUBLICADO', 'PUBLICANDO'] } },
    include: {
      propiedad: {
        include: {
          alquilerVacacional: true,
          alquilerLargaDuracion: true,
          venta: true,
          documentos: { where: { tipo: 'FOTO' }, orderBy: { creadoEn: 'asc' } },
        },
      },
    },
  });

  const propiedades = publicaciones
    .map(p => p.propiedad)
    .filter(p => p && p.activo);

  switch (portal) {
    case 'idealista':
      return adaptarParaIdealistaXML(propiedades, serverBaseUrl);
    case 'fotocasa':
      return adaptarParaFotocasaXML(propiedades, serverBaseUrl);
    case 'kyero':
      return adaptarParaKyeroXML(propiedades, serverBaseUrl);
    default:
      throw new Error(`Portal ${portal} no soporta feed XML`);
  }
}

module.exports = {
  publicarEnPortales,
  despublicarDePortales,
  obtenerEstadoPublicacion,
  generarFeedXML,
  PORTALES_CONFIG,
};
