# Deployment Guide for vxness

This guide helps you deploy the `vxness` project to a Virtual Private Server (VPS) such as **DigitalOcean Droplet** or **AWS EC2**.

## Prerequisites

1.  **A VPS (server)** with Linux (Ubuntu 22.04 LTS recommended).
2.  **Domain Name** (optional, but recommended for production).
3.  **Git** installed on the server.
4.  **Docker** and **Docker Compose** installed on the server.

## 1. Prepare the Server

### Install Docker on Ubuntu

Connect to your server via SSH:
```bash
ssh root@your_server_ip
```

Run the following commands to install Docker:
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages:
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify installation:
```bash
sudo docker run hello-world
```

## 2. Deploy the Application

### Step 1: Clone the Repository
```bash
git clone https://github.com/vasantkr97/vxness-2.0.git
cd vxness
```

### Step 2: Configure Environment
Create a `.env` file in the root directory. You can copy the example if one exists, or create new.
**Crucially**, update the `VITE_API_URL` to point to your server's Public IP or Domain.

**Open `docker-compose.prod.yml` and check the environment variables.**
For the `web` service, you might need to rebuild if you change `VITE_API_URL`.

To pass environment variables to the build process (for the frontend), you may need to create a specific `.env` file that Docker Compose picks up, or modify the `docker-compose.prod.yml` `args` section if we used build args.

> **Note on Frontend Config**: The current Dockerfile for `web` builds the app. Vite replaces `import.meta.env.VITE_API_URL` at **build time**.
> If you want to change the API URL, you must either:
> 1. Edit the `.env` file on the server **before** building.
> 2. Pass it as a build arg (requires generic Dockerfile update).

**Simplest approach**:
1. Create `.env` on server:
   ```bash
   nano .env
   ```
   Add:
   ```env
   # This URL is baked into the frontend during build. 
   # It must match the public IP/Domain of your server + port 3001.
   VITE_API_URL=http://<YOUR_SERVER_IP>:3001
   
   POSTGRES_PASSWORD=securepassword
   jwt_secret=supersecret
   ```

### Step 3: Start the Application
Run the production compose file:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Important**: Because `VITE_API_URL` is a build argument, if you change it in the `.env` file, you **MUST** run with `--build` to rebuild the frontend image.

### Step 4: Verify
Open your browser and navigate to `http://<YOUR_SERVER_IP>`.
You should see the application running.

## Troubleshooting

- **Logs**: to see logs of a service
  ```bash
  docker compose -f docker-compose.prod.yml logs -f http-server
  ```
- **Rebuild**: If you change code or config
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
