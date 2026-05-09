# Deploy — BarberApp a Google Cloud Platform (GCP) + Docker

Este documento detalla el proceso de despliegue persistente utilizando una instancia de Compute Engine y contenedores Docker.

## 1. Infraestructura
- **Instancia:** `barberapp-server` (Compute Engine)
- **Región:** `us-central1-a`
- **IP Pública:** `34.172.114.2`
- **Sistema Operativo:** Ubuntu 24.04 LTS
- **Tipo de Máquina:** e2-micro (Configuración escalable)

## 2. Configuración del Servidor (GCP Console)
1. **Firewall:** Se habilitaron las reglas `default-allow-http` (80) y `default-allow-https` (443).
2. **Acceso:** SSH habilitado vía consola de Google Cloud.

## 3. Preparación del Entorno (Docker)
Para instalar Docker en el servidor, se ejecutaron los siguientes comandos:
```bash
# Actualizar sistema
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Agregar llave GPG de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Agregar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 4. Despliegue de la Aplicación
1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/pmailprueba-apps/barberapp-ant.git
   cd barberapp-ant
   ```
2. **Configurar Variables de Entorno:**
   Crear un archivo `.env.local` en el servidor con las credenciales de Firebase y ManyChat.
3. **Levantar contenedores:**
   ```bash
   docker compose up -d --build
   ```

## 5. Gestión de Dominios y SSL
Se recomienda el uso de **Nginx Proxy Manager** para gestionar los certificados SSL (Let's Encrypt) y apuntar el tráfico del puerto 80/443 al puerto interno del contenedor (3000).

---
**IP de Producción:** [http://34.172.114.2](http://34.172.114.2)
**Repositorio:** [https://github.com/pmailprueba-apps/barberapp-ant](https://github.com/pmailprueba-apps/barberapp-ant)
