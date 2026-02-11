#!/bin/bash
set -e

echo "🚀 Iniciando despliegue en cPanel..."

# ⚠️ CONFIGURA ESTOS VALORES CON TUS DATOS
USER_HOME="/home/tuusuario"
PUBLIC_HTML="$USER_HOME/public_html"
API_PORT="3000"

FRONTEND_DIR="$(pwd)/sistema-gestion-medica"
BACKEND_DIR="$(pwd)/sistema-gestion-backend-"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "❌ Error: No se encontró $FRONTEND_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ Error: No se encontró $BACKEND_DIR"
  exit 1
fi

# 1) Construir frontend
echo "📦 Construyendo frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Error: dist/ no fue generado"
  exit 1
fi

echo "✅ Frontend compilado"

# 2) Copiar a public_html
echo "📂 Copiando a public_html..."
rm -rf "$PUBLIC_HTML"/*
mkdir -p "$PUBLIC_HTML"
cp -r dist/* "$PUBLIC_HTML/"

echo "✅ Frontend copiado"

# 3) Crear .htaccess
echo "⚙️  Creando .htaccess..."
cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESS_EOF'
<IfModule mod_proxy.c>
  ProxyRequests Off
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:3000/
  ProxyPassReverse /api http://127.0.0.1:3000/
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
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS_EOF

echo "✅ .htaccess creado"

# 4) Preparar backend
echo "🔧 Preparando backend..."
BACKEND_DEPLOY="$USER_HOME/backend-api"
rm -rf "$BACKEND_DEPLOY"
mkdir -p "$BACKEND_DEPLOY"
cp -r "$BACKEND_DIR"/* "$BACKEND_DEPLOY/"

cd "$BACKEND_DEPLOY"
npm ci --production

echo "✅ Backend preparado"

echo ""
echo "=================================================="
echo "✅ ¡Despliegue completado!"
echo "=================================================="
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita: $BACKEND_DEPLOY/.env.production"
echo "   - Cambiar FRONTEND_URLS"
echo "   - Cambiar credenciales DB"
echo "   - Cambiar JWT_SECRET"
echo ""
echo "2. En cPanel → Node.js App → Crear/Restart:"
echo "   - App folder: $BACKEND_DEPLOY"
echo "   - Startup file: server.js"
echo "   - Port: $API_PORT"
echo ""
echo "3. Verifica: https://tu-dominio.com"
echo "=================================================="
