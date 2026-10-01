# 💳 Configuración de Stripe — SYNNER CRM

Guía paso a paso para activar los pagos. La integración ya está programada; solo
falta crear tu cuenta y productos en Stripe y pegar las claves en el `.env`. Mientras
no lo hagas, los pagos quedan deshabilitados (las rutas devuelven 503) sin romper nada.

---

## 1. Crear la cuenta

1. Regístrate en https://stripe.com y completa los datos de tu empresa.
2. Trabaja primero en **modo test** (hay un interruptor "Test mode" arriba a la
   derecha). Las claves de test empiezan por `sk_test_` / `pk_test_`. Cuando todo
   funcione, repites los pasos en modo real (`sk_live_`).

---

## 2. Crear los 3 productos y sus precios

En el panel: **Catálogo de productos → Añadir producto**. Crea **un producto por plan**
y, dentro de cada uno, **dos precios recurrentes** (mensual y anual). El anual lleva un
**15% de descuento**:

| Producto | Precio mensual | Precio anual (−15%) |
|----------|---------------|---------------------|
| SYNNER Silver | 199 € / mes | 2.030 € / año |
| SYNNER Gold | 399 € / mes | 4.070 € / año |
| SYNNER Premium | 599 € / mes | 6.110 € / año |

> Nota sobre el IVA: puedes activar **Stripe Tax** para que calcule el IVA
> automáticamente, o crear los precios con el IVA incluido. Decídelo con tu asesoría.

Al crear cada precio, Stripe genera un **Price ID** (`price_XXXX`). Copia los **6**:
3 mensuales y 3 anuales. Son los que van en el `.env`.

---

## 3. Configurar el webhook

El webhook permite que Stripe avise a SYNNER cuando alguien paga, falla un pago o
cancela (así se activa/suspende la agencia automáticamente).

1. Panel: **Desarrolladores → Webhooks → Añadir endpoint**.
2. URL del endpoint: `https://<tu-api>/api/suscripciones/webhook`
   (ej. `https://api.synner.com/api/suscripciones/webhook`).
3. Eventos a escuchar (selecciona estos):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Al guardar, Stripe muestra el **Signing secret** del webhook (`whsec_XXXX`). Cópialo.

Para probar en local puedes usar el **Stripe CLI**:
```bash
stripe listen --forward-to localhost:3000/api/suscripciones/webhook
```
Ese comando te da un `whsec_...` temporal para pruebas.

---

## 4. Rellenar el `.env` del backend

Añade estas variables con los valores que copiaste:

```
STRIPE_SECRET_KEY=sk_test_...        # (o sk_live_... en producción)
STRIPE_WEBHOOK_SECRET=whsec_...
# Precios mensuales
STRIPE_PRICE_SILVER=price_...
STRIPE_PRICE_GOLD=price_...
STRIPE_PRICE_PREMIUM=price_...
# Precios anuales (−15%)
STRIPE_PRICE_SILVER_ANUAL=price_...
STRIPE_PRICE_GOLD_ANUAL=price_...
STRIPE_PRICE_PREMIUM_ANUAL=price_...
```

Reinicia el backend. En el arranque verás `[Stripe] Cliente inicializado.` en lugar de
"pagos deshabilitados".

---

## 5. Activar el portal de cliente (gestión/cancelación)

Para que las agencias puedan gestionar o cancelar su suscripción:
Panel → **Configuración → Billing → Customer portal** → actívalo y guarda.

---

## 6. Probar el flujo completo (modo test)

1. Entra como Director de una agencia y ve a **/planes**.
2. Pulsa "Contratar Gold" → te redirige al checkout de Stripe.
3. Usa una tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
4. Al pagar, el webhook marca la agencia como **ACTIVA** con el plan Gold.
5. Prueba un impago con la tarjeta `4000 0000 0000 0341` para ver la suspensión.

---

## 7. Pasar a producción

Repite productos y webhook en **modo real**, sustituye las claves `sk_test_`/`whsec_`
por las `live`, y actualiza el `.env` de producción (Render/hosting). Nunca subas las
claves a git.

---

## Resumen de qué necesita SYNNER de ti

| Variable | De dónde sale |
|----------|---------------|
| `STRIPE_SECRET_KEY` | Desarrolladores → Claves de API |
| `STRIPE_WEBHOOK_SECRET` | Al crear el webhook (paso 3) |
| `STRIPE_PRICE_SILVER/GOLD/PREMIUM` | Precio mensual de cada plan (paso 2) |
| `STRIPE_PRICE_*_ANUAL` | Precio anual de cada plan (paso 2) |
