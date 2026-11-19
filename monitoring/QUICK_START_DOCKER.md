# ⚡ Quick Start - Docker pe Prometheus & Grafana (5 Minutes)

## 🎯 Super Simple - Sirf 3 Commands!

### Step 1: EC2 IP Update Karo (1 command)
```powershell
# PowerShell open karo and run:
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# YOUR IP se replace karo
$EC2_IP = "13.233.203.127"  # ⚠️ Apna IP yaha daalo

# Auto-replace
(Get-Content prometheus\prometheus.yml) -replace 'EC2_PUBLIC_IP', $EC2_IP | Set-Content prometheus\prometheus.yml
```

### Step 2: Docker Start Karo (1 command)
```powershell
# Same PowerShell mein run karo:
docker-compose up -d
```

**Wait 30 seconds...**

### Step 3: Browser Open Karo
```
Prometheus: http://localhost:9090
Grafana:    http://localhost:3000 (admin/ragpdf123)
```

## ✅ Done! Simple tha na?

---

## 🔍 Check Karo Sab Chal Raha Hai

```powershell
# Container status check karo
docker-compose ps

# Should show:
# ragpdf-prometheus   Up (healthy)
# ragpdf-grafana      Up (healthy)
```

---

## 🛑 Stop Karne Ke Liye

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring
docker-compose down
```

---

## 🔄 Dobara Start Karne Ke Liye

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring
docker-compose up -d
```

---

## 🎉 Bas! Itna Hi!

**Ab Prometheus aur Grafana run ho rahe hain Docker pe!**

Baaki ka setup (Node Exporter, Kube-State-Metrics) ke liye dekho:
- `START_MONITORING.md` (complete guide)
- `SETUP_STEPS.md` (detailed steps)

---

## 📊 Screenshots - Kya Dikhna Chahiye

### Prometheus (localhost:9090):
```
┌─────────────────────────────────────┐
│  Prometheus                         │
│  Alerts | Graph | Status | Help     │
│                                     │
│  Expression: up                     │
│  [Execute]                          │
│                                     │
│  Console  Graph                     │
│  up{instance="localhost:9090"} = 1  │
└─────────────────────────────────────┘
```

### Grafana (localhost:3000):
```
┌─────────────────────────────────────┐
│  Grafana Login                      │
│                                     │
│  Username: [admin              ]    │
│  Password: [ragpdf123          ]    │
│                                     │
│           [Log In]                  │
└─────────────────────────────────────┘
```

---

**✅ Simple hai! Koi problem ho to `SETUP_STEPS.md` dekho detailed instructions ke liye.**
