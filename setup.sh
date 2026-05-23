#!/usr/bin/env bash
set -euo pipefail

SIOB_DIR="$(cd "$(dirname "$0")" && pwd)"
SIOF_DIR="$SIOB_DIR/../SIOF"

echo "========================================"
echo " SIO - Setup para produccion local"
echo "========================================"
echo ""

# 1. Build SIOF
echo "[1/4] Compilando SIOF..."
cd "$SIOF_DIR"
npm ci --legacy-peer-deps
npm run build -- --configuration production
echo "OK - SIOF compilado"
echo ""

# 2. Copiar a SIOB (juntos)
echo "[2/4] Copiando frontend a SIOB..."
rm -rf "$SIOB_DIR/src/public"
cp -r dist/sio-fe "$SIOB_DIR/src/public"
echo "OK - Frontend copiado a SIOB/src/public/"
echo ""

# 3. Docker Compose
echo "[3/4] Iniciando Docker Compose..."
cd "$SIOB_DIR"
docker compose up -d --build
echo "OK - Servicios iniciados"
echo ""

# 4. Estado
echo "[4/4] Estado:"
docker compose ps
echo ""
echo "========================================"
echo "  LISTO!"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:3000"
echo "  MongoDB:  localhost:27017"
echo "========================================"
