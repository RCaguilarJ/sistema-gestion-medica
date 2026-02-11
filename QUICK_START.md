# ⚡ Despliegue en 5 Pasos - cPanel

## 1️⃣ Edita `.env.production` del Backend

```bash
# Abre: sistema-gestion-backend-/.env.production
# Cambia estos valores:

FRONTEND_URLS=https://tu-dominio.com,https://www.tu-dominio.com
DB_HOST=localhost
DB_NAME=tu_base_datos_real
DB_USER=usuario_bd_real
DB_PASS=password_bd_real
JWT_SECRET=clave-aleatoria-super-fuerte-aqui
```

## 2️⃣ Ejecuta el Script de Despliegue

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
DEPLOY_WINDOWS.bat
```

El script:
- Compila React con Vite
- Copia el build a `public_html/`
- Configura `.htaccess` con proxy
- Prepara el backend en `backend-api/`

## 3️⃣ Crea la App Node.js en cPanel

1. Accede a **cPanel → Software → Node.js App**
2. Click en **Create Node.js App**
3. Configura:
   - **App folder:** `/home/tuusuario/backend-api`
   - **App URL/domain:** `tu-dominio.com`
   - **Startup file:** `server.js`
   - **Node version:** 18+
4. Click en **Create**

## 4️⃣ Verifica que Funciona

```javascript
// En consola del navegador (F12):
fetch('/api/health').then(r => r.json()).then(console.log)

// Debe devolver:
// { ok: true, timestamp: "2024-02-06T14:30:00.000Z" }
```

## 5️⃣ Prueba Login

- Abre `https://tu-dominio.com`
- Intenta hacer login
- Debe funcionar con la base de datos de producción

---

## 📖 Para Más Detalles

- **README_DESPLIEGUE.md** - Guía completa
- **DESPLIEGUE_CPANEL.md** - Guía detallada con troubleshooting
