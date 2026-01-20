# How to Set Up Multiple Domains on Digital Ocean

You have successfully configured your code. Now follow these steps on your server.

## Step 1: DNS Setup (Where you bought the domain)
Go to your domain provider (GoDaddy, Namecheap, etc.) and add these **A Records**:

| Type | Name | Value |
| :--- | :--- | :--- |
| A | `vxness` | `YOUR_DROPLET_IP` |
| A | `*` | `YOUR_DROPLET_IP` (Optional) |

## Step 2: Install Nginx on Server
Open your Digital Ocean Console (or SSH) and run:

```bash
# 1. Install Nginx
apt update
apt install nginx -y

# 2. Check it is running
systemctl status nginx
```

## Step 3: Configure Nginx
We generated a config file in your project at `nginx/vasanth.site`.
Once you deploy your latest entry (git push), do this:

```bash
# 1. Copy the config to Nginx folder
cp /opt/vxness/nginx/vasanth.site /etc/nginx/sites-available/vasanth.site

# 2. Enable the site
ln -s /etc/nginx/sites-available/vasanth.site /etc/nginx/sites-enabled/

# 3. Test for errors
nginx -t

# 4. Restart Nginx
systemctl restart nginx
```

## Step 4: Update GitHub Secrets
Since everything is on the same domain, update:
-   `VITE_API_URL`: `/api`  (or `https://vxness.vasanth.site/api`)
-   `FRONTEND_URL`: `https://vxness.vasanth.site`

## Step 5: Enable SSL (HTTPS)
Secure your sites for free with Certbot:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d vxness.vasanth.site
```
