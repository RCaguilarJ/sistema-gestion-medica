# 📘 Guía Completa de Despliegue en cPanel

## 🎯 Resumen

Tu aplicación React + Node.js se desplegará así:

```
https://tu-dominio.com
    ↓
Apache (public_html/)
    ├─ Frontend React (SPA)
    └─ Proxy /api → Node.js (localhost:3000)
         ↓
    Express API + MySQL
```

## 📋 Requisitos

- ✅ Acceso SSH/cPanel
- ✅ Node.js 18+ en cPanel
- ✅ Dominio apuntando a cPanel
- ✅ Base de datos MySQL en producción

## 🚀 Paso a Paso

### 1. Edita .env.production

**Archivo:** `sistema-gestion-backend-/.env.production`

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

FRONTEND_URLS=https://tu-dominio.com,https://www.tu-dominio.com

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_db_real
DB_USER=usuario_bd_real
DB_PASS=password_bd_real

JWT_SECRET=clave-jwt-aleatoria-super-segura
```

### 2. Ejecuta el Script

```bash
./deploy.sh
```

Esto copia:
- Frontend → `/home/usuario/public_html/`
- Backend → `/home/usuario/backend-api/`
- `.htaccess` con proxy Apache

### 3. Crea Node.js App en cPanel

```
cPanel → Software → Node.js App → Create
  App folder: /home/usuario/backend-api
  App URL: tu-dominio.com
  Startup file: server.js
  Node version: 18+
```

### 4. Verifica

```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

Debe devolver:
```json
{ "ok": true, "timestamp": "..." }
```

## 🐛 Troubleshooting

### El frontend carga pero `/api` no funciona

**Problema:** Apache no redirige `/api` a Node.js

**Solución:**
1. Verifica que `.htaccess` existe en `public_html/`
2. Verifica que Apache tiene `mod_proxy` habilitado
3. Verifica que Node.js está "Running" en cPanel

### Node.js se queda "Stopped"

**Problema:** La app se crasheó

**Solución:**
1. Ve a cPanel → Node.js App → Logs
2. Busca el error
3. Verifica que `.env.production` tiene credenciales válidas
4. Haz click en "Restart"

### CORS Error

**Problema:** Tu dominio no está en `FRONTEND_URLS`

**Solución:**
1. Edita `.env.production`
2. Agrega tu dominio: `FRONTEND_URLS=https://tu-dominio.com`
3. Reinicia Node.js en cPanel

## ✅ Checklist

- [ ] .env.production editado con valores reales
- [ ] deploy.sh ejecutado
- [ ] Node.js App creada en cPanel
- [ ] Frontend carga en https://tu-dominio.com
- [ ] /api/health responde
- [ ] Login funciona

---

**¿Problemas? Lee README_DESPLIEGUE.md o RESUMEN_CAMBIOS.md**
