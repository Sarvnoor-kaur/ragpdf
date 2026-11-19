# 🚀 Prometheus & Grafana Setup - Step by Step

## ⏱️ Total Time: 15-20 minutes

---

## 📋 Prerequisites Check

### 1. Docker Desktop Running Check:
```powershell
# Open PowerShell and run:
docker --version

# Should show something like:
# Docker version 24.0.x, build xxxxx
```

**If not installed:**
- Download: https://www.docker.com/products/docker-desktop
- Install and restart computer
- Ensure Docker Desktop is running (check system tray)

### 2. Get Your EC2 Public IP:
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
terraform output k3s_public_ip
```

**Copy this IP!** You'll need it multiple times.  
Example: `13.233.203.127`

---

## 🔧 Step 1: Update Prometheus Configuration (2 min)

### Open PowerShell:
```powershell
# Navigate to monitoring folder
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Edit prometheus.yml to replace EC2_PUBLIC_IP with your actual IP
notepad prometheus\prometheus.yml
```

### In Notepad:
1. Press `Ctrl + H` (Find and Replace)
2. **Find:** `EC2_PUBLIC_IP`
3. **Replace with:** Your actual IP (e.g., `13.233.203.127`)
4. Click **Replace All**
5. Save (`Ctrl + S`) and close

### OR Use PowerShell Command (Faster):
```powershell
# Replace YOUR_IP with your actual EC2 IP
$EC2_IP = "13.233.203.127"  # ⚠️ CHANGE THIS

# Replace in prometheus.yml
(Get-Content prometheus\prometheus.yml) -replace 'EC2_PUBLIC_IP', $EC2_IP | Set-Content prometheus\prometheus.yml

# Verify replacement
Select-String -Path prometheus\prometheus.yml -Pattern $EC2_IP
```

**Expected output:**
```
prometheus/prometheus.yml:50:      - targets: ['13.233.203.127:9100']
prometheus/prometheus.yml:75:      - targets: ['13.233.203.127:30001']
```

✅ **Done!** Prometheus config updated.

---

## 🐳 Step 2: Start Docker Containers (2 min)

### Run Docker Compose:
```powershell
# Still in monitoring folder
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Start Prometheus and Grafana
docker-compose up -d
```

**What this does:**
- Downloads Prometheus and Grafana Docker images (first time only)
- Creates Docker network `ragpdf-monitoring`
- Creates persistent volumes for data
- Starts both containers in background (`-d` = detached mode)

### Expected Output:
```
[+] Running 3/3
 ✔ Network ragpdf-monitoring        Created
 ✔ Container ragpdf-prometheus      Started
 ✔ Container ragpdf-grafana         Started
```

### Check Containers Are Running:
```powershell
docker-compose ps
```

**Expected:**
```
NAME                STATUS
ragpdf-prometheus   Up (healthy)
ragpdf-grafana      Up (healthy)
```

**If status shows "starting":** Wait 30 seconds and check again.

**If status shows "unhealthy" or "exited":** View logs:
```powershell
docker-compose logs
```

✅ **Done!** Docker containers running.

---

## 🔍 Step 3: Verify Prometheus is Working (3 min)

### Open Prometheus UI:
1. Open browser
2. Go to: http://localhost:9090

**You should see:** Prometheus web interface

### Check Targets:
1. Click **Status → Targets** (top menu)
2. You should see 3 targets:

| Target | Endpoint | State |
|--------|----------|-------|
| prometheus | localhost:9090 | ✅ UP |
| ec2-node-exporter | YOUR_IP:9100 | ⏳ DOWN (for now) |
| kube-state-metrics | YOUR_IP:30001 | ⏳ DOWN (for now) |

**Why DOWN?**
- Node Exporter not installed yet on EC2
- Kube-state-metrics not deployed yet on K3s

**Don't worry!** We'll fix this in next steps.

### Test Prometheus Query:
1. Go to: http://localhost:9090/graph
2. In query box, type: `up`
3. Click **Execute**

**You should see:** `up{instance="localhost:9090", job="prometheus"} = 1`

✅ **Done!** Prometheus working locally.

---

## 🎨 Step 4: Access Grafana (2 min)

### Open Grafana:
1. Open browser
2. Go to: http://localhost:3000

### Login:
```
Username: admin
Password: ragpdf123
```

**You should see:** Grafana home page

### Check Datasource:
1. Click **Configuration** (⚙️ gear icon) → **Data sources**
2. You should see **Prometheus** already configured
3. Click on **Prometheus**
4. Scroll down and click **Test**

**Expected:** ✅ "Data source is working"

✅ **Done!** Grafana connected to Prometheus.

---

## 📊 Step 5: View Dashboard (1 min)

### Open Dashboard:
1. Click **Dashboards** (☰ four squares icon) in left sidebar
2. Click **RAGPDF Monitoring** folder
3. Click **RAGPDF Infrastructure Overview**

**You should see:**
- 🖥️ EC2 Instance Status: DOWN (red) - because Node Exporter not installed
- Empty graphs - no metrics yet

**This is expected!** We haven't installed monitoring on EC2 yet.

✅ **Done!** Dashboard is ready, waiting for metrics.

---

## 🎉 Prometheus & Grafana Are Running!

### What's Working:
- ✅ Prometheus running on http://localhost:9090
- ✅ Grafana running on http://localhost:3000
- ✅ Both containers healthy
- ✅ Grafana connected to Prometheus
- ✅ Dashboard imported

### What's Not Working Yet:
- ⏳ No EC2 metrics (Node Exporter not installed)
- ⏳ No K8s metrics (Kube-state-metrics not deployed)

---

## 🔄 Daily Usage Commands

### Start Monitoring (if stopped):
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring
docker-compose up -d
```

### Stop Monitoring:
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring
docker-compose down
```

### View Logs (if issues):
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# All logs
docker-compose logs -f

# Prometheus only
docker-compose logs -f prometheus

# Grafana only
docker-compose logs -f grafana
```

### Restart Containers:
```powershell
docker-compose restart
```

### Check Container Status:
```powershell
docker-compose ps
```

### Remove Everything (including data):
```powershell
# ⚠️ This will delete all metrics and dashboards!
docker-compose down -v
```

---

## 🆘 Troubleshooting

### ❌ Problem: Port 9090 or 3000 Already in Use

**Error:** `Bind for 0.0.0.0:9090 failed: port is already allocated`

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :9090
netstat -ano | findstr :3000

# Kill the process (if safe to do so)
# Or change port in docker-compose.yml
```

### ❌ Problem: Docker Desktop Not Running

**Error:** `error during connect: This error may indicate that the docker daemon is not running`

**Solution:**
1. Start Docker Desktop from Start Menu
2. Wait for it to fully start (whale icon in system tray should be steady)
3. Try again

### ❌ Problem: Containers Show "Unhealthy"

**Check logs:**
```powershell
docker-compose logs prometheus
docker-compose logs grafana
```

**Common fixes:**
```powershell
# Recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

### ❌ Problem: Grafana Dashboard Shows "No Data"

**Possible reasons:**
1. Prometheus targets are DOWN (expected until EC2 setup)
2. Time range is wrong (change to "Last 1 hour")
3. Datasource not working (test it in Configuration)

---

## ✅ Verification Checklist

- [ ] Docker Desktop is running
- [ ] EC2 IP updated in prometheus.yml
- [ ] `docker-compose up -d` completed successfully
- [ ] Both containers show "Up (healthy)" status
- [ ] Prometheus accessible at http://localhost:9090
- [ ] Prometheus shows `up` metric = 1
- [ ] Grafana accessible at http://localhost:3000
- [ ] Grafana login successful (admin/ragpdf123)
- [ ] Prometheus datasource test passes
- [ ] Dashboard visible (even if empty)

---

## 🚀 Next Steps

Now that Prometheus and Grafana are running, you need to:

### 1. Install Node Exporter on EC2
This will enable EC2 system metrics (CPU, RAM, disk, network)

### 2. Deploy Kube-State-Metrics on K3s
This will enable Kubernetes metrics (pods, deployments, etc.)

**Follow:** `START_MONITORING.md` for complete setup.

---

## 📝 Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | N/A |
| **Prometheus Targets** | http://localhost:9090/targets | N/A |
| **Grafana** | http://localhost:3000 | admin / ragpdf123 |
| **Dashboard** | Dashboards → RAGPDF Monitoring | N/A |

---

**🎉 Docker setup complete! Prometheus aur Grafana run ho rahe hain!**
