# Digital Ocean Deployment Guide (Password Auth)

This guide will take you from "zero" to a fully deployed production application on Digital Ocean using **Password Authentication**.

## Phase 1: Create your Server (Droplet)

1.  **Log in to Digital Ocean**.
2.  Click the green **Create** button in the top right and select **Droplets**.
3.  **Choose Region**: Select the datacenter closest to you (e.g., Bangalore, New York).
4.  **Choose Image**: Select **Ubuntu 24.04 (LTS)** or **22.04 (LTS)**.
5.  **Choose Size**:
    *   Select **Basic** -> **Regular**.
    *   Select at least **4GB RAM / 2 CPUs** ($24/mo). **Do not use the $6 droplet**, it will crash with your apps.
6.  **Authentication Method**:
    *   Select **Password**.
    *   Create a very strong root password (e.g., `Vxness!2024$Secure`). **Write this down!**
7.  **Hostname**: Name it `vxness-production`.
8.  Click **Create Droplet**.
9.  Wait for the IP address to create (e.g., `164.x.x.x`). **Copy this IP**.

## Phase 2: Preparing the Server

You can connect to your server in two ways. **Option A is easier.**

### Option A: Use the Digital Ocean Console (Easiest)
1.  On the Digital Ocean dashboard, click on your new droplet.
2.  Click the **Access** link in the left menu.
3.  Click the blue **Launch Droplet Console** button.
4.  A new browser window will open simulating a terminal. You are automatically logged in as `root`.
5.  **Skip to the "Install Docker" step below.**

### Option B: Use your Computer's Terminal
1.  Open PowerShell (or Command Prompt).ṇ
2.  Connect to your server: `ssh root@YOUR_IP`
3.  Type `yes` to accept the fingerprint.
4.  Enter the password from Phase 1.

### Install Docker (Run this in the console)
Copy and paste this block to install Docker:
```bash
# Update and Install Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
mkdir -p /opt/vxness
```

## Phase 3: Connecting GitHub Actions

1.  Go to your GitHub Repository.
2.  Click **Settings** -> **Secrets and variables** -> **Actions**.
3.  Click **New repository secret** for each:

| Name | Value |
| :--- | :--- |
| `DIGITALOCEAN_HOST` | Your Droplet IP (e.g., `164.x.x.x`) |
| `DIGITALOCEAN_USERNAME` | `root` |
| `DIGITALOCEAN_PASSWORD` | The password you created in Phase 1 |
| `VITE_API_URL` | `http://YOUR_DROPLET_IP:3000` |
| `PRODUCTION_ENV` | Copy the content below ↓ |

**Content for `PRODUCTION_ENV`:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_to_a_secure_password
POSTGRES_DB=vxness
JWT_SECRET=change_this_to_a_random_secret_string
REDIS_HOST=redis
REDIS_PORT=6379
NODE_ENV=production
```

## Phase 4: Deploy!

1.  Go to your **Local Code Editor (VS Code)** on your computer.
2.  Commit and push your changes:
    ```bash
    git add .
    git commit -m "Switch to password auth"
    git push origin main
    ```
3.  Check the **Actions** tab in GitHub to watch the deployment deploy.

---
**Troubleshooting:**
*   **Deploy failed?** Check the "Deploy to DigitalOcean" step in GitHub Actions logs. If it says "Authentication failed", your `DIGITALOCEAN_PASSWORD` secret is wrong.
