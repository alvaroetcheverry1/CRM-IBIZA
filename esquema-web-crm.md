# Esquema Web Corporativa - Neural CRM
## Landing Page para Agencias Inmobiliarias

**Version:** 2.0  
**Fecha:** Septiembre 2026  
**Proyecto:** Neural CRM | CRM Inmobiliario Inteligente  
**Objetivo:** Web pública atractiva que explique qué es Neural CRM y capture leads de agencias

---

## Estructura HTML Completa de la Landing Page

```html
<!DOCTYPE html>
<html lang="es">
<head>...</head>
<body>
  <!-- NAVBAR -->
  <nav>...</nav>

  <!-- HERO SECTION -->
  <section class="hero">...</section>

  <!-- ¿POR QUÉ NEURAL CRM? (8 Diferenciadores) -->
  <section class="why-us">...</section>

  <!-- FUNCIONALIDADES 3 EN 1 -->
  <section class="features-3in1">...</section>

  <!-- SISTEMA DE AGENTES IA -->
  <section class="agents-ia">...</section>

  <!-- CANALIZACIÓN & MULTI-TENANCY -->
  <section class="multitenancy">...</section>

  <!-- DASHBOARD ANALYTICS -->
  <section class="dashboard">...</section>

  <!-- PRECIOS / PLANES -->
  <section class="pricing">...</section>

  <!-- TESTIMONIOS -->
  <section class="testimonials">...</section>

  <!-- CTA FINAL -->
  <section class="cta-final">...</section>

  <!-- FOOTER -->
  <footer>...</footer>
</body>
</html>
```

---

## 1. Hero Section

```html
<!-- Hero -->
<section class="hero" style="background: linear-gradient(160deg, #0D1B2A 0%, #1A3A5C 55%, #0D1B2A 100%); min-height: 100vh; padding: 8rem 0;">
  <div class="container" style="max-width: 1280px; margin: 0 auto; padding: 0 2rem;">
    <div style="display: flex; align-items: center; gap: 4rem;">
      <div style="flex: 1;">
        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); border-radius: 20px; padding: 6px 16px; font-size: 0.72rem; font-weight: 600; color: #C9A84C; margin-bottom: 1.5rem;">
          <span>●</span> CRM Inmobiliario · Inteligencia Artificial
        </div>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 700; line-height: 1.15; margin-bottom: 1.5rem; color: white;">
          El CRM Inmobiliario<br/>Inteligente que<br/><span style="color: #C9A84C;">automatiza</span> tu agencia
        </h1>
        <p style="font-size: 1.05rem; color: rgba(255,255,255,0.72); line-height: 1.8; max-width: 550px;">
          IA que procesa dossiers en <strong>3 minutos</strong> (97% menos tiempo), 
          matchmaking automático de compradores con villas, 
          y control total de tu portfolio desde un solo dashboard.
        </p>
        
        <div style="display: flex; gap: 3rem; margin-bottom: 2.5rem;">
          <div><div style="font-size: 1.75rem; font-weight: 800; color: #C9A84C;">40+</div><div style="font-size: 0.72rem; color: #8A9BB0; text-transform: uppercase;">Funcionalidades</div></div>
          <div><div style="font-size: 1.75rem; font-weight: 800; color: #C9A84C;">97%</div><div style="font-size: 0.72rem; color: #8A9BB0; text-transform: uppercase;">Ahorro tiempo</div></div>
          <div><div style="font-size: 1.75rem; font-weight: 800; color: #C9A84C;">24/7</div><div style="font-size: 0.72rem; color: #8A9BB0; text-transform: uppercase;">WhatsApp Bot</div></div>
          <div><div style="font-size: 1.75rem; font-weight: 800; color: #C9A84C;">0%</div><div style="font-size: 0.72rem; color: #8A9BB0; text-transform: uppercase;">Doble reserva</div></div>
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <a href="#cta-final" style="background: linear-gradient(135deg, #C9A84C, #E8C96A); color: #0D1B2A; font-weight: 700; padding: 0.875rem 2rem; border-radius: 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
            🎯 Solicitar Demo
          </a>
          <a href="#cta-final" style="border: 1.5px solid rgba(255,255,255,0.25); color: white; padding: 0.875rem 2rem; border-radius: 10px; text-decoration: none;">
            🧪 Probar Gratis 14 días
          </a>
        </div>
      </div>
      
      <div style="width: 420px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 2.5rem;">
        <div style="width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #1A3A5C 0%, #4A6FA5 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 3.5rem;">
          ▶
        </div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; margin-bottom: 0.5rem; color: white;">Procesa un dossier en 3 minutos</h3>
        <p style="font-size: 0.85rem; color: #8A9BB0;">Sube un PDF → IA extrae datos, fotos y redacta copy comercial.</p>
      </div>
    </div>
  </div>
</section>
```

---

## 2. ¿Por qué Neural CRM? (8 Diferenciadores)

```html
<!-- Why Neural CRM -->
<section style="background: rgba(255,255,255,0.02); padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">¿Por qué Neural CRM?</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">8 diferenciadores que te llevarán al siguiente nivel</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        No es solo un CRM: es un sistema completo de automatización con IA que te ayuda a cerrar más ventas, ahorrar tiempo y escalar tu agencia.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
      <!-- 1. Matchmaking IA -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🎯</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">Matchmaking IA</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Conectamos automáticamente compradores con propiedades. Score 0-100 basado en presupuesto, zona y estado. Top 5 matches con frase persuasiva generada por GPT-4o.
        </p>
      </div>
      
      <!-- 2. OCR Triple Motor -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📄</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">OCR Triple Motor</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Procesa cualquier PDF: texto nativo + JPEG embebidos + Tesseract OCR 300 DPI. Incluso para PDFs escaneados sin coste adicional.
        </p>
      </div>
      
      <!-- 3. Catálogos+Tracking -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">Catálogos con Tracking</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Envía catálogos con enlace único. Recibe notificación en tiempo real: "El catálogo ha sido visualizado (3 visitas)".
        </p>
      </div>
      
      <!-- 4. Portal Propietario -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏠</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">Portal del Propietario</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          URL tokenizada (sin contraseña). Ve en tiempo real: reservas, cobros, actividades de sus villas.
        </p>
      </div>
      
      <!-- 5. Propuestas PDF -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🖨️</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">Propuestas Print-Ready</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Genera dossiers PDF de lujo con 3 plantillas. Selecciona 5 propiedades, elige plantilla y exporta.
        </p>
      </div>
      
      <!-- 6. WhatsApp Bot -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">💬</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">WhatsApp Bot 24/7</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Atención automática con GPT-4o. Recomendación de villas, cualificación de leads y envío de catálogos.
        </p>
      </div>
      
      <!-- 7. Channel Manager -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📅</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">Channel Manager iCal</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Sincronización con Airbnb, Booking, MioWeb. Evita doble reserva y ajusta precios automáticamente.
        </p>
      </div>
      
      <!-- 8. KPIs Avanzados -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📈</div>
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem; color: white;">8 KPIs de Negocio</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Tasa conversión, ocupación, rentabilidad, tiempo venta, comisiones por agente y más.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

## 3. Funcionalidades 3 en 1

```html
<!-- Funcionalidades 3 en 1 -->
<section style="padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">Núcleo Inmobiliario Híbrido</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Gestión completa de 3 modelos de negocio</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Alquiler vacacional, alquiler de larga duración y venta/captación: todo en un solo sistema.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
      <!-- Vacacional -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🌴</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem; color: white;">Alquiler Vacacional</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Licencias ETV, tarifas dinámicas (alta/media/baja), check-in/check-out. Sincronización con Airbnb, Booking.
        </p>
      </div>
      
      <!-- Larga Duración -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏡</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem; color: white;">Alquiler Larga Duración</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Seguimiento LAU, vencimientos (30/90 días), gestión fianzas y pagos recurrentes. Alertas de pagos en retraso.
        </p>
      </div>
      
      <!-- Venta -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏛</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem; color: white;">Venta / Captación</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.7;">
          Pipeline Kanban: Captación → Contacto → Visitas → Propuesta → Cierre. Referencias catastrales y precios confidenciales.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

## 4. Sistema de Agentes IA

```html
<!-- Agentes IA -->
<section style="background: rgba(255,255,255,0.02); padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">Sistema de Agentes IA</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Automatización inteligente de procesos</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Nuestros agentes IA trabajan 24/7 para procesar documentos, captar leads y automatizar tareas.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
      <!-- Vision AI -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🤖</div>
        <h3 style="font-weight: 700; margin-bottom: 0.5rem; color: white;">Vision AI</h3>
        <p style="font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.6;">
          Subes PDF → IA extrae datos, fotos y copy comercial en segundos. OCR 3 capas: texto nativo, JPEG embebidos, renderizado 300 DPI.
        </p>
      </div>
      
      <!-- Agentes -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-weight: 700; margin-bottom: 0.5rem; color: white;">Agente Captador</h3>
        <p style="font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.6;">
          Escanea Idealista, Fotocasa, Airbnb y Facebook. URLs personalizadas. Datos de contacto de particulares.
        </p>
      </div>
      
      <!-- WhatsApp Inbound -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">💬</div>
        <h3 style="font-weight: 700; margin-bottom: 0.5rem; color: white;">WhatsApp Inbound</h3>
        <p style="font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.6;">
          Atención 24/7 con GPT-4o y memoria de conversación. Recomendación de villas y cualificación automática.
        </p>
      </div>
      
      <!-- Legal & Setter -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚖️</div>
        <h3 style="font-weight: 700; margin-bottom: 0.5rem; color: white;">Legal & Setter</h3>
        <p style="font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.6;">
          Revisión de contratos frente a LAU. Recordatorios automáticos de visitas por WhatsApp.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

## 5. Dashboard Analytics

```html
<!-- Dashboard -->
<section style="padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">Dashboard Analytics</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Métricas avanzadas de negocio</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Nuestro dashboard calcula KPIs que te ayudan a tomar decisiones estratégicas.
      </p>
    </div>
    
    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h3 style="color: white;">📊 8 KPIs Avanzados</h3>
        <select style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 8px;">
          <option>Últimos 30 días</option>
          <option>Últimos 90 días</option>
          <option>Últimos 6 meses</option>
          <option>Últimos 12 meses</option>
        </select>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">💰</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Ingresos Mensuales</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">€42.3K</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 12% vs mes anterior</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">🎯</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Tasa Conversión</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">24.5%</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 3.2% vs mes anterior</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">🏖</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Ocupación Media</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">78.3%</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 5.1% vs mes anterior</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">📊</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Rentabilidad</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">12.8%</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 0.8% vs mes anterior</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">⏳</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Tiempo Venta</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">45 días</div>
          <div style="font-size: 0.72rem; color: #F56565;">↓ 7 días vs mes anterior</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">👥</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Comisiones</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">8 agentes</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 2 nuevos este mes</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">🔔</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Alertas</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">12</div>
          <div style="font-size: 0.72rem; color: #68D391;">↓ 3 solucionadas hoy</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem; text-align: center;">
          <div style="font-size: 1.5rem; color: #C9A84C; margin-bottom: 0.75rem;">👁️</div>
          <div style="font-size: 0.75rem; color: #8A9BB0; text-transform: uppercase;">Vistas Catálogos</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: white;">156</div>
          <div style="font-size: 0.72rem; color: #68D391;">↑ 24% vs mes anterior</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## 6. Precios / Planes SaaS

```html
<!-- Precios -->
<section style="background: rgba(255,255,255,0.02); padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">Precios SaaS</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Planes flexibles para agencias de todos los tamaños</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Sin costes ocultos. Cancela cuando quieras.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
      <!-- Starter -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 2.5rem;">
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: white;">Starter</h3>
        <div style="font-size: 2.5rem; font-weight: 800; color: #C9A84C; margin-bottom: 1rem;">299€<span style="font-size: 0.85rem; color: #8A9BB0;">/mes</span></div>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); margin-bottom: 2rem;">Ideal para agencias boutique en crecimiento.</p>
        <ul style="list-style: none; margin-bottom: 2rem;">
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Hasta 50 propiedades</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">2 usuarios activos</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">IA básica</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7);">Soporte por email</li>
        </ul>
        <a href="#cta-final" style="display: block; background: linear-gradient(135deg, #C9A84C, #E8C96A); color: #0D1B2A; text-align: center; font-weight: 700; padding: 1rem; border-radius: 12px; text-decoration: none;">Empezar Starter</a>
      </div>
      
      <!-- Pro (Popular) -->
      <div style="background: rgba(201,168,76,0.05); border: 1px solid #C9A84C; border-radius: 24px; padding: 2.5rem; position: relative;">
        <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: #C9A84C; color: #0D1B2A; font-size: 0.65rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.08em;">MÁS POPULAR</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: white;">Pro</h3>
        <div style="font-size: 2.5rem; font-weight: 800; color: #C9A84C; margin-bottom: 1rem;">799€<span style="font-size: 0.85rem; color: #8A9BB0;">/mes</span></div>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); margin-bottom: 2rem;">Para agencias medianas en crecimiento.</p>
        <ul style="list-style: none; margin-bottom: 2rem;">
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Hasta 200 propiedades</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">5 usuarios activos</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Channel Manager iCal</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">WhatsApp Bot 24/7</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Portal del propietario</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">OCR triple motor</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7);">8 KPIs avanzados</li>
        </ul>
        <a href="#cta-final" style="display: block; background: linear-gradient(135deg, #C9A84C, #E8C96A); color: #0D1B2A; text-align: center; font-weight: 700; padding: 1rem; border-radius: 12px; text-decoration: none;">Empezar Pro</a>
      </div>
      
      <!-- Elite -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 2.5rem;">
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: white;">Elite / Enterprise</h3>
        <div style="font-size: 2.5rem; font-weight: 800; color: #C9A84C; margin-bottom: 1rem;">1.999€<span style="font-size: 0.85rem; color: #8A9BB0;">/mes</span></div>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.65); margin-bottom: 2rem;">Agencias con necesidades avanzadas.</p>
        <ul style="list-style: none; margin-bottom: 2rem;">
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Ilimitado</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">15+ usuarios</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Marca blanca completa</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Agente Captador</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Migrador desde Google Drive</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06);">Feed XML automático</li>
          <li style="padding: 8px 0; color: rgba(255,255,255,0.7);">SLA 99.9%</li>
        </ul>
        <a href="#cta-final" style="display: block; background: linear-gradient(135deg, #C9A84C, #E8C96A); color: #0D1B2A; text-align: center; font-weight: 700; padding: 1rem; border-radius: 12px; text-decoration: none;">Solicitar Demo Enterprise</a>
      </div>
    </div>
  </div>
</section>
```

---

## 7. Testimonios / Casos de Éxito

```html
<!-- Testimonios -->
<section style="padding: 6rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">Casos de Éxito</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Lo que dicen nuestras agencias beta</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Agencias en Ibiza y Mallorca que ya están ahorrando tiempo y cerrando más ventas.
      </p>
    </div>
    
    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2.5rem;">
      <blockquote style="font-style: italic; font-size: 1.05rem; color: rgba(255,255,255,0.8); line-height: 1.8; margin-bottom: 1.5rem;">
        "El OCR triple motor nos ha cambiado la vida. Ya no perdemos tiempo extrayendo datos de PDFs y el WhatsApp Bot captura leads 24/7. En 3 meses hemos duplicado nuestro portafolio y nuestros ingresos."
      </blockquote>
      
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #C9A84C, #E8C96A); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #0D1B2A;">CM</div>
        <div>
          <h4 style="font-weight: 700; font-size: 1rem; color: white;">Carlos M.</h4>
          <p style="font-size: 0.75rem; color: #8A9BB0;">Director de <strong>Ibiza Luxury Dreams</strong></p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="background: rgba(255,255,255,0.04);">
            <th style="padding: 12px; text-align: left; color: #8A9BB0; text-transform: uppercase;">Métrica</th>
            <th style="padding: 12px; text-align: left; color: #8A9BB0; text-transform: uppercase;">Antes</th>
            <th style="padding: 12px; text-align: left; color: #8A9BB0; text-transform: uppercase;">Después</th>
            <th style="padding: 12px; text-align: right; color: #C9A84C; font-weight: 700;">Mejora</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Tiempo por dossier PDF</td><td>90 min</td><td>3 min</td><td style="color: #68D391;">97% ahorro</td></tr>
          <tr><td>Leads cualificados/día</td><td>5-7</td><td>12-15</td><td style="color: #68D391;">+100%</td></tr>
          <tr><td>Propiedades procesadas/semana</td><td>10</td><td>35</td><td style="color: #68D391;">+250%</td></tr>
          <tr><td>Cierre de ventas/mes</td><td>2-3</td><td>5-7</td><td style="color: #68D391;">+100%</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
```

---

## 8. CTA Final

```html
<!-- CTA Final -->
<section id="cta-final" style="background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(26,58,92,0.6)); padding: 5rem 0;">
  <div class="container">
    <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #C9A84C; font-weight: 600; margin-bottom: 0.75rem;">¿Listo para transformar tu agencia?</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Empieza tu prueba gratuita de 14 días</h2>
      <p style="color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.8;">
        Sin tarjeta de crédito. Sin compromiso. Descubre por qué las agencias de lujo eligen Neural CRM.
      </p>
    </div>
    
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 2.5rem;">
      <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; color: white;">Rellena tus datos y te contactamos en menos de 2 horas</h3>
      
      <form style="display: grid; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">Nombre *</label>
            <input type="text" placeholder="Tu nombre" style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">Apellido *</label>
            <input type="text" placeholder="Tu apellido" style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
          </div>
        </div>
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">Email corporativo *</label>
          <input type="email" placeholder="tu@agencia.com" style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">Teléfono</label>
            <input type="tel" placeholder="+34 600 000 000" style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">Agencia</label>
            <input type="text" placeholder="Nombre de tu agencia" style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
          </div>
        </div>
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #8A9BB0; margin-bottom: 6px;">¿Cuántas propiedades gestionas?</label>
          <select style="width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white;">
            <option value="">Selecciona una opción</option>
            <option value="1-10">1-10 propiedades</option>
            <option value="11-50">11-50 propiedades</option>
            <option value="51-200">51-200 propiedades</option>
            <option value="200+">Más de 200 propiedades</option>
          </select>
        </div>
        <button type="submit" style="width: 100%; background: linear-gradient(135deg, #C9A84C, #E8C96A); color: #0D1B2A; font-weight: 700; padding: 1rem; border: none; border-radius: 10px; cursor: pointer; margin-top: 0.5rem;">
          ✨ Solicitar Demostración
        </button>
        <p style="font-size: 0.68rem; color: #8A9BB0; text-align: center; margin-top: 1rem; line-height: 1.6;">
          🔒 Tus datos están protegidos · RGPD · Sin spam.<br/>
          Cancela cuando quieras. Sin costes de salida.
        </p>
      </form>
    </div>
  </div>
</section>
```

---

## 9. Footer

```html
<!-- Footer -->
<footer style="padding: 3rem 0 1.5rem; border-top: 1px solid rgba(255,255,255,0.06);">
  <div class="container">
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
      <div>
        <div style="font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700; color: white;">Neural <span style="color: #C9A84C;">CRM</span></div>
        <p style="font-size: 0.82rem; color: rgba(255,255,255,0.6); margin-top: 1rem; line-height: 1.6;">
          CRM Inmobiliario Inteligente que automatiza tu agencia de alto standing.<br/>
          IA que procesa dossiers en 3 minutos, matchmaking automático y control total de tu portfolio.
        </p>
      </div>
      <div>
        <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 1rem; color: white;">Plataforma</h4>
        <ul style="list-style: none;">
          <li><a href="#por-que-neural" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Por qué Neural CRM</a></li>
          <li><a href="#agentes-ia" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Agentes IA</a></li>
          <li><a href="#funcionalidades" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Funcionalidades</a></li>
          <li><a href="#dashboard" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Dashboard</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 1rem; color: white;">Recursos</h4>
        <ul style="list-style: none;">
          <li><a href="#" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Documentación</a></li>
          <li><a href="#" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Blog</a></li>
          <li><a href="#" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Casos de éxito</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 1rem; color: white;">Legal</h4>
        <ul style="list-style: none;">
          <li><a href="/politica-privacidad" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Privacidad</a></li>
          <li><a href="/terminos" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Términos</a></li>
          <li><a href="/cookies" style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.78rem; color: #8A9BB0;">
      <div>© 2026 Neural CRM SL · NIF: B-00000000 · All rights reserved</div>
      <div style="color: #C9A84C;">Licencia API: NEU-2026-IB-0001</div>
    </div>
  </div>
</footer>
```

---

## Paleta de Colores (Mediterranean Luxury)

| Token | Hex | Uso |
|-------|-----|-----|
| `--navy` | `#0D1B2A` | Header, sidebar, fondo principal |
| `--med` | `#1A3A5C` | CTAs, títulos, gradientes |
| `--sky` | `#4A6FA5` | Botones secundarios |
| `--gold` | `#C9A84C` | Accents, highlights, enlaces |
| `--gold-l` | `#E8C96A` | Hover states |
| `--gold-d` | `#9E7D2F` | Darker accents |
| `--pearl` | `#F5F0E8` | Fondos claros |
| `--white` | `#FFFFFF` | Texto primario |
| `--slate` | `#8A9BB0` | Texto secundario |

---

## Tipografía

- **Títulos:** Playfair Display (serif) - Elegante y premium
- **Cuerpo:** Inter (sans) - Legibilidad moderna
- **Sizes:** H1: 3.5rem, H2: 2.5rem, H3: 1.4rem, Body: 1rem

---

**Última actualización:** Septiembre 2026**
