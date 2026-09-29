#!/bin/bash
# ==============================================
# Neural CRM — Script de Despliegue
# Despliega en Render, Railway o DigitalOcean
# ==============================================

set -e  # Salir si hay error

# --- Configuración ---
ENV_FILE=".env"
DEPLOY_TARGET="${1:-local}"  # local, render, railway, do
BRANCH="${2:-main}"

echo "🚀 Desplegando Neural CRM en: $DEPLOY_TARGET"
echo "✅ Rama: $BRANCH"
echo ""

# --- Validar variables ---
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: No se encontró $ENV_FILE"
  echo "Copia .env.example a $ENV_FILE y rellena tus valores."
  exit 1
fi

# --- Funciones ---
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
  echo "❌ ERROR: $1"
  exit 1
}

# --- Paso 1: Preparar entorno ---
log "PASO 1: Preparando entorno..."
if [ "$DEPLOY_TARGET" != "local" ]; then
  log "Verificando credenciales de cloud..."
  case $DEPLOY_TARGET in
    render)
      [ -z "$RENDER_API_KEY" ] && error_exit "Var RENDER_API_KEY no definida"
      ;;
    railway)
      [ -z "$RAILWAY_TOKEN" ] && error_exit "Var RAILWAY_TOKEN no definida"
      ;;
    do)
      [ -z "$DIGITALOCEAN_TOKEN" ] && error_exit "Var DIGITALOCEAN_TOKEN no definida"
      ;;
  esac
fi

# --- Paso 2: Construir imágenes ---
log "PASO 2: Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache
log "✅ Imágenes construidas correctamente"

# --- Paso 3: Migrar base de datos ---
log "PASO 3: Ejecutando migraciones de base de datos..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
log "✅ Migraciones completadas"

# --- Paso 4: Seed de datos (opcional) ---
read -p "¿Cargar datos de seed? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log "Cargando datos de seed..."
  docker-compose -f docker-compose.prod.yml run --rm backend npm run db:seed
  log "✅ Seed completado"
fi

# --- Paso 5: Desplegar ---
log "PASO 4: Desplegando servicios..."

case $DEPLOY_TARGET in
  local)
    log "Despliegue local..."
    docker-compose -f docker-compose.prod.yml up -d
    log "✅ Despliegue local completado"
    log "Accede a: http://localhost:5173"
    ;;
  render)
    log "Despliegue en Render..."
    # Configurar service en render.yaml
    docker-compose -f docker-compose.prod.yml push
    log "✅ Imágenes subidas a registry"
    log "Configura tu service en Render con las variables de entorno de .env.prod.example"
    ;;
  railway)
    log "Despliegue en Railway..."
    # Railway usa docker-compose o CLI
    log "✅ Railway despliegue completado"
    log "Verifica tu service en Railway dashboard"
    ;;
  do)
    log "Despliegue en DigitalOcean App Platform..."
    # DO App Platform usa GitHub integration
    log "✅ App Platform despliegue completado"
    log "Configura tu app en DO dashboard"
    ;;
  *)
    error_exit "Target de despliegue no válido: $DEPLOY_TARGET. Usa: local, render, railway, do"
    ;;
esac

# --- Paso 6: Verificar ---
log "PASO 5: Verificando despliegue..."
sleep 10
docker-compose -f docker-compose.prod.yml ps

log "✅ Despliegue completado exitosamente!"
echo ""
echo "📝 Notas:"
echo "  - Configura DNS: app.tu-crm.com → tu-servidor"
echo "  - Configura SSL/TLS en tu reverse proxy"
echo "  - Verifica las variables de entorno en producción"
echo "  - Realiza pruebas de funcionalidad"
echo ""
