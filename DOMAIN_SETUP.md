# Domain Setup Guide

Follow these steps to point your custom domain (e.g., `vxness.com`) to your application.

## 1. Configure DNS (Where you bought your domain)
Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these **A Records**:

| Type | Name | Content / Value | TTL |
|------|------|-----------------|-----|
| A | @ | 143.110.180.141 | Auto |
| A | www | 143.110.180.141 | Auto |

*Wait 5-10 minutes for these changes to potentially propagate.*

## 2. Update GitHub Secrets
Your application needs to know its new URL.

1.  Go to **GitHub Repo -> Settings -> Secrets -> Actions**.
2.  Edit **`VITE_API_URL`**:
    *   Change from `http://143.110.180.141` to `https://vxness.com` (or whatever your domain is).
3.  Edit **`PRODUCTION_ENV`**:
    *   Add `FRONTEND_URL=https://vxness.com` to the list of variables.

## 3. Deploy Updates
Commit your changes to local code (like the CORS fix I just made) and push to main. This will rebuild your app with the new domain settings.
```bash
git add .
git commit -m "Update CORS and prepare for domain"
git push origin main
```

## 4. Enable HTTPS (Free SSL)
Currently, your site is only HTTP. To get the secure lock icon (HTTPS), follow these steps on your server.

**SSH into your server:**
```bash
ssh root@143.110.180.141
```

**Run Certbot (Automated SSL):**
We will interpret your existing Nginx container setup. Since you are using a Dockerized Nginx inside the `web` container, the easiest way to get SSL without modifying your Dockerfile extensively is to put a **reverse proxy** *in front* of your Docker containers using Caddy or Traefik, or simpler:

**The "Easiest" Production SSL Method (Caddy):**

1.  **Modify `docker-compose.prod.yml`** to use Caddy instead of just exposing Nginx ports directly.
    *   *I can automate this file change for you if you tell me your domain name.*

**Alternatively (Manual Certbot on Host):**
If you don't want to change Docker config:
1.  Install Certbot on the Droplet host: `apt install certbot`
2.  Stop Docker Nginx temporarily: `docker stop $(docker ps -q)`
3.  Get Cert: `certbot certonly --standalone -d vxness.com -d www.vxness.com`
4.  Mount these certs into your Nginx container (requires editing `docker-compose.prod.yml`).

**Recommended:**
Since you are using Docker Compose, adding **Caddy** as a service is the absolute easiest way. It handles SSL automatically. **Please tell me your domain name**, and I will write the precise `docker-compose.prod.yml` update for you.
