# Application Management Guide

This guide explains how to manually control your running application and your server.

## 1. Controlling the Application (Docker)

These commands control the *software* running on your server. Run these after SSHing into your server:
`ssh root@143.110.180.141`

### **Stop Everything**
To stop the application (users can't access it, but data is safe):
```bash
cd ~/vxness-2.0
docker compose down
```

### **Start Everything**
To start the application again:
```bash
cd ~/vxness-2.0
docker compose up -d
```

### **Restart to Apply Updates**
If you want to manually update to the latest version without using GitHub Actions:
```bash
cd ~/vxness-2.0
docker compose pull
docker compose up -d
```

### **Check Logs**
To see what's happening (errors, user activity):
```bash
cd ~/vxness-2.0
docker compose logs -f --tail=100
```
*(Press `Ctrl+C` to exit the logs)*

---

## 2. Controlling the Server (Digital Ocean)

These actions control the *computer* (VM) itself.

### **Option A: Stop the Server (Pause)**
*   **Action**: Go to Digital Ocean Console -> Click Droplet -> Power -> **Turn Off**.
*   **Result**: The server shuts down. The app goes offline.
*   **Cost**: **YOU STILL PAY**. Digital Ocean charges for the reserved IP address and the disk space even if the computer is off.
*   **To Resume**: Click **Turn On** in the console. Then SSH in and run `docker compose up -d`.

### **Option B: Destroy the Server (Stop Paying)**
*   **Action**: 
    1.  **Snapshot**: Go to Images -> Snapshots -> Take Snapshot (Save your data/state).
    2.  **Destroy**: Go to Destroy -> Destroy Droplet.
*   **Result**: The server is deleted. You stop paying for the Droplet (you pay a small fee for the Snapshot storage).
*   **To Resume**: 
    1.  Create a new Droplet from the **Snapshot** you made.
    2.  Update your GitHub Secrets (`DIGITALOCEAN_HOST`) with the new IP address.
    3.  App should start automatically (or run `docker compose up -d`).

### **Option C: Run "Wherever" (Migration)**
Since your app is containerized (Docker), you can run it on *any* cloud (AWS, Google, Azure, or another Digital Ocean droplet).

**To move to a new server:**
1.  **Database**: You must back up your data inside the volume (`postgres_data`) or you will lose it.
2.  **Code**: Just standard Git Clone.
3.  **Environment**: Set up the `.env` file (handled by your GitHub CD pipeline).

**Backup Command (Run before destroying if you care about data):**
```bash
docker compose exec postgres pg_dump -U vasantkr97 -d vxness > backup.sql
```
*(Download this `backup.sql` file to your computer using SCP)*
