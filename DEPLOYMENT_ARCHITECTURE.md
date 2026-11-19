# 🏗️ RAGPDF Deployment Architecture - Complete Overview

## 📍 Kya Kaha Deployed Hai (What is Deployed Where)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS EC2 Instance (K3s Node)                     │
│                      Public IP: 13.233.203.127 (Example)                │
│                      Instance Type: t3.medium                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
         ┌──────▼─────┐      ┌─────▼─────┐     ┌──────▼──────┐
         │ Port 80/443│      │ Port 9100 │     │ Port 30001  │
         │  (Ingress) │      │Node Export│     │Kube-State   │
         │   Traefik  │      │           │     │Metrics      │
         └──────┬─────┘      └───────────┘     └─────────────┘
                │                   │                   │
                │                   │                   │
    ┌───────────┴────────────┐      │                   │
    │                        │      │                   │
┌───▼────┐            ┌──────▼──┐   │                   │
│Frontend│            │Backend  │   │                   │
│Service │            │Service  │   │                   │
│ClusterIP           │ClusterIP│   │                   │
│Port: 80│            │Port:5001│   │                   │
└───┬────┘            └────┬────┘   │                   │
    │                      │        │                   │
┌───▼────────┐      ┌──────▼──────┐ │                   │
│Frontend Pod│      │Backend Pod  │ │                   │
│Container   │      │Container    │ │                   │
│Port: 80    │      │Port: 5001   │ │                   │
└────────────┘      └─────────────┘ │                   │
                                     │                   │
                    ┌────────────────▼───────────────────▼────────┐
                    │    Prometheus (Windows - localhost:9090)     │
                    │    Scrapes metrics from EC2:9100 & EC2:30001 │
                    └──────────────────┬───────────────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Grafana (Windows)  │
                            │  localhost:3000     │
                            │  Visualizes metrics │
                            └─────────────────────┘
```

---

## 🎯 Complete IP & Port Mapping

### 1️⃣ **RAGPDF Application (Main App)**

#### 📍 Deployed On: 
**AWS EC2 Instance (K3s Kubernetes)**
- **EC2 Public IP:** Check with `terraform output k3s_public_ip`
- **Example:** `13.233.203.127`

#### 🌐 Access URLs:
```
Frontend:  http://EC2_PUBLIC_IP/           (Port 80)
Backend:   http://EC2_PUBLIC_IP/api/       (Port 80 → forwards to 5001)

Example:
Frontend:  http://13.233.203.127/
Backend:   http://13.233.203.127/api/auth/login
```

#### ⚙️ Internal K8s Services:

| Component | Service Type | ClusterIP Port | External Access |
|-----------|-------------|----------------|-----------------|
| **Frontend** | ClusterIP | 80 | Via Ingress (Port 80) |
| **Backend** | ClusterIP | 5001 | Via Ingress (Port 80 → /api) |

**Services Location:**
- `company-policy-ai/k8s/frontend-service.yaml` - ClusterIP (port 80)
- `company-policy-ai/k8s/backend-service.yaml` - ClusterIP (port 5001)

**Ingress:**
- `company-policy-ai/k8s/ingress.yaml` - Traefik Ingress
- Listens on Port 80/443
- Routes:
  - `/api/*` → backend-service (5001)
  - `/*` → frontend-service (80)

**NO NodePort for Application** - Uses ClusterIP + Ingress

---

### 2️⃣ **Monitoring - Node Exporter (System Metrics)**

#### 📍 Deployed On:
**Same AWS EC2 Instance (Systemd Service)**
- Runs directly on EC2 host (not in K8s)
- Installed via script: `monitoring/scripts/install-node-exporter.sh`

#### 🌐 Access:
```
URL:  http://EC2_PUBLIC_IP:9100/metrics
Example: http://13.233.203.127:9100/metrics
```

#### 📊 What it Monitors:
- CPU usage, memory, disk, network
- System load, file descriptors
- EC2 instance health

#### 🔒 Security:
- Port 9100 allowed from `admin_ip_cidr` only (your IP)
- Configured in: `terraform/security-groups.tf`

---

### 3️⃣ **Monitoring - Kube-State-Metrics (K8s Metrics)**

#### 📍 Deployed On:
**AWS EC2 K3s Cluster (Kubernetes Pod)**
- Namespace: `kube-system`
- Deployment: `kube-state-metrics`
- Service Type: **NodePort** ⬅️ **YEH HAI NODEPORT!**

#### 🌐 Access:
```
URL:  http://EC2_PUBLIC_IP:30001/metrics
Example: http://13.233.203.127:30001/metrics
```

#### ⚙️ K8s Service Details:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: kube-state-metrics
  namespace: kube-system
spec:
  type: NodePort              ⬅️ NodePort Service
  selector:
    app.kubernetes.io/name: kube-state-metrics
  ports:
    - name: http-metrics
      port: 8080              # ClusterIP internal port
      targetPort: 8080        # Container port
      nodePort: 30001         ⬅️ External NodePort (EC2_IP:30001)
```

#### 📊 What it Monitors:
- Pod status, restarts, phases
- Deployment replicas
- Node conditions
- Namespace resources
- Service/Ingress status

#### 🔒 Security:
- Port 30001 allowed from `admin_ip_cidr` only (your IP)
- Configured in: `terraform/security-groups.tf`

---

### 4️⃣ **Monitoring - Prometheus (Metrics Collection)**

#### 📍 Deployed On:
**Your Windows Machine (Docker)**
- Runs locally via Docker Compose
- Container name: `ragpdf-prometheus`

#### 🌐 Access:
```
URL:  http://localhost:9090
Targets: http://localhost:9090/targets
Alerts:  http://localhost:9090/alerts
```

#### 📡 What it Scrapes:
```yaml
1. Prometheus itself:    localhost:9090
2. Node Exporter:        EC2_IP:9100
3. Kube-State-Metrics:   EC2_IP:30001      ⬅️ Uses NodePort
```

#### 📁 Config File:
`monitoring/prometheus/prometheus.yml`

---

### 5️⃣ **Monitoring - Grafana (Visualization)**

#### 📍 Deployed On:
**Your Windows Machine (Docker)**
- Runs locally via Docker Compose
- Container name: `ragpdf-grafana`

#### 🌐 Access:
```
URL:      http://localhost:3000
Username: admin
Password: ragpdf123
```

#### 📊 Dashboard:
- **RAGPDF Infrastructure Overview**
- Shows EC2 + K8s metrics
- Real-time graphs and gauges

---

## 🔍 NodePort Summary - **YEH HAI POORA ANSWER!**

### ❓ NodePort Kaha Hai?

**Sirf ek hi NodePort hai:**

| Service | Type | Location | Port | IP:Port |
|---------|------|----------|------|---------|
| **kube-state-metrics** | NodePort | `monitoring/k8s/kube-state-metrics.yaml` | 30001 | `EC2_IP:30001` |

### ❓ Application ka NodePort?

**Application mein NodePort NAHI hai:**
- Frontend Service: **ClusterIP** (internal)
- Backend Service: **ClusterIP** (internal)
- External access via: **Ingress (Traefik)** on port 80/443

### ❓ Kyun NodePort sirf monitoring ke liye?

**Reason:**
1. **Application:** Production setup mein ClusterIP + Ingress use karte hain (best practice)
2. **Monitoring:** Prometheus bahar se (Windows) scrape karta hai, isliye NodePort chahiye

---

## 📊 Port Summary Table

| Port | Service | Type | Access From | Purpose |
|------|---------|------|-------------|---------|
| **80** | Traefik Ingress | Ingress | 0.0.0.0/0 | RAGPDF App (Frontend + Backend) |
| **443** | Traefik Ingress | Ingress | 0.0.0.0/0 | RAGPDF App (HTTPS) |
| **5001** | ragpdf-backend-svc | ClusterIP | Internal only | Backend pods (via Ingress) |
| **80** | ragpdf-frontend-svc | ClusterIP | Internal only | Frontend pods (via Ingress) |
| **6443** | K3s API Server | N/A | admin_ip_cidr | kubectl access |
| **9100** | Node Exporter | Host | admin_ip_cidr | EC2 system metrics |
| **30001** | kube-state-metrics | **NodePort** | admin_ip_cidr | K8s object metrics |
| **9090** | Prometheus | Docker | localhost | Metrics collection (Windows) |
| **3000** | Grafana | Docker | localhost | Dashboard (Windows) |

---

## 🚀 Quick Commands to Check

### Check Your EC2 IP:
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
terraform output k3s_public_ip
```

### Check Application is Running:
```powershell
# Frontend
curl http://YOUR_EC2_IP/

# Backend health check
curl http://YOUR_EC2_IP/api/health
```

### Check Node Exporter:
```powershell
curl http://YOUR_EC2_IP:9100/metrics
```

### Check Kube-State-Metrics (NodePort):
```powershell
curl http://YOUR_EC2_IP:30001/metrics
```

### SSH to EC2 and Check Services:
```bash
ssh -i ~/.ssh/shophub-key.pem ubuntu@YOUR_EC2_IP

# Check K8s services
kubectl get svc -A

# Check NodePort specifically
kubectl get svc -n kube-system kube-state-metrics

# Output should show:
# NAME                  TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# kube-state-metrics    NodePort   10.43.xxx.xxx   <none>        8080:30001/TCP   1h
```

---

## 🎯 Architecture Flow

```
Internet User
     │
     ▼
http://EC2_IP:80  ──────────────────────┐
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  AWS EC2 (K3s)  │
                              │  Public IP      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
          │ Traefik Ingress │  │ NodeExporter│  │Kube-State    │
          │    Port 80      │  │  Port 9100  │  │ Port 30001   │
          └────────┬────────┘  └──────┬──────┘  └──────┬───────┘
                   │                  │                 │
         ┌─────────┴─────────┐        │                 │
         │                   │        │                 │
         ▼                   ▼        ▼                 ▼
    ┌─────────┐        ┌──────────┐  │                 │
    │Frontend │        │ Backend  │  │                 │
    │ClusterIP│        │ClusterIP │  │                 │
    │Port: 80 │        │Port: 5001│  │                 │
    └─────────┘        └──────────┘  │                 │
                                      │                 │
                                      └────────┬────────┘
                                               │
                                     ┌─────────▼─────────┐
                                     │   Prometheus      │
                                     │   (Windows)       │
                                     │  localhost:9090   │
                                     └─────────┬─────────┘
                                               │
                                     ┌─────────▼─────────┐
                                     │    Grafana        │
                                     │   (Windows)       │
                                     │  localhost:3000   │
                                     └───────────────────┘
```

---

## ✅ Summary - Jawab Aapke Sawalon Ka

### 1. **NodePort kaha pe hai?**
- **File:** `monitoring/k8s/kube-state-metrics.yaml`
- **Service:** `kube-state-metrics`
- **Namespace:** `kube-system`
- **NodePort:** `30001`

### 2. **Deploy kidhar hai?**
- **Application (Frontend + Backend):** EC2 K3s cluster (namespace: ragpdf)
- **Kube-State-Metrics:** EC2 K3s cluster (namespace: kube-system) - **NodePort 30001**
- **Node Exporter:** EC2 host systemd service - **Port 9100**
- **Prometheus:** Windows Docker - **localhost:9090**
- **Grafana:** Windows Docker - **localhost:3000**

### 3. **Kis IP pe accessible hai?**
```
Application:           http://EC2_PUBLIC_IP/           (Port 80)
Node Exporter:         http://EC2_PUBLIC_IP:9100       (Direct port)
Kube-State-Metrics:    http://EC2_PUBLIC_IP:30001      (NodePort) ⬅️
Prometheus:            http://localhost:9090           (Windows)
Grafana:               http://localhost:3000           (Windows)
```

---

**🎯 Clear hai ab? Application mein NodePort NAHI hai, sirf monitoring ke kube-state-metrics mein NodePort 30001 use ho raha hai!**
