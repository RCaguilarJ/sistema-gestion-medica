#!/bin/bash
set -e

echo "Iniciando despliegue en cPanel..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

USER_HOME="/home/tuusuario"
PUBLIC_HTML="$USER_HOME/public_html"
BACKEND_DIR="$WORKSPACE_DIR/sistema-gestion-backend-"
API_PORT=""

if [ ! -d "$SCRIPT_DIR" ]; then
  echo "Error: No se encontro el directorio del frontend"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: No se encontro $BACKEND_DIR"
  exit 1
fi

if [ -f "$BACKEND_DIR/.env.production" ]; then
  API_PORT="$(grep -E '^PORT=' "$BACKEND_DIR/.env.production" | tail -n 1 | cut -d'=' -f2 | tr -d '\r')"
fi

API_PORT="${API_PORT:-4000}"

echo "Construyendo frontend..."
cd "$SCRIPT_DIR"
npm ci
npm run build

if [ ! -d "dist" ]; then
  echo "Error: dist/ no fue generado"
  exit 1
fi

echo "Copiando a public_html..."
rm -rf "$PUBLIC_HTML"/*
mkdir -p "$PUBLIC_HTML"
cp -r dist/* "$PUBLIC_HTML/"

cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESS_EOF'
<IfModule mod_proxy.c>
  ProxyRequests Off
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:__API_PORT__/
  ProxyPassReverse /api http://127.0.0.1:__API_PORT__/
  ProxyPass /uploads http://127.0.0.1:__API_PORT__/uploads
  ProxyPassReverse /uploads http://127.0.0.1:__API_PORT__/uploads
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_URI} !^/api(/|$)
  RewriteCond %{REQUEST_URI} !^/uploads(/|$)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS_EOF

sed -i "s/__API_PORT__/$API_PORT/g" "$PUBLIC_HTML/.htaccess"

echo "Frontend desplegado en $PUBLIC_HTML"
echo "Backend esperado en $BACKEND_DIR"
echo "Puerto backend: $API_PORT"
