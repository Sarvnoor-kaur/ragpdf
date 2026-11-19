# ❓ Why "No Data" in Dashboard - Expected Hai!

## 🎯 Current Status

### ✅ What's Working:
- ✅ Prometheus running (localhost:9090)
- ✅ Grafana running (localhost:3000)
- ✅ Dashboard imported successfully
- ✅ Prometheus → Grafana connection working

### ❌ What's Missing (That's Why No Data):
- ❌ **Node Exporter** - EC2 pe install nahi hua (system metrics ke liye)
- ❌ **Kube-State-Metrics** - K3s pe deploy nahi hua (K8s metrics ke liye)

---

## 🔍 Check Prometheus Targets

### Step 1: Open Prometheus
```
http://localhost:9090/targets
```

### Step 2: Check Target Status

Aapko ye dikhega:

| Target | Endpoint | State | Why? |
|--------|----------|-------|------|
| ✅ prometheus | localhost:9090 | **UP** | Local running |
| ❌ ec2-node-exporter | YOUR_IP:9100 | **DOWN** | Not installed yet |
| ❌ kube-state-metrics | YOUR_IP:30001 | **DOWN** | Not deployed yet |

**Ye bilkul normal hai!** Abhi setup complete nahi hua.

---

## 🚀 Fix - Next Steps

Ab aapko ye karna hai (order mein):

### Step 1: Update AWS Security Group (5 min)
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
terraform plan
terraform apply
```

**Ye kya karega:**
- Port 9100 open karega (Node Exporter)
- Port 30001 open karega (Kube-State-Metrics)

### Step 2: Install Node Exporter on EC2 (10 min)

**PowerShell se SSH karo:**
```powershell
# Get EC2 IP
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
terraform output k3s_public_ip

# SSH to EC2 (replace with your IP)
ssh -i C:\Users\sarvn\.ssh\shophub-key.pem ubuntu@YOUR_EC2_IP
```

**EC2 pe ye commands run karo:**
```bash
# Download Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz

# Extract
tar xzf node_exporter-1.7.0.linux-amd64.tar.gz

# Install
sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/

# Create user
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Check status
sudo systemctl status node_exporter

# Test locally
curl http://localhost:9100/metrics | head -n 20
```

**Expected Output:**
```
# HELP go_gc_duration_seconds A summary of the pause duration of garbage collection cycles.
# TYPE go_gc_duration_seconds summary
...
```

✅ **Node Exporter running!**

### Step 3: Deploy Kube-State-Metrics on K3s (5 min)

**Still on EC2 (via SSH), run:**
```bash
# Create kube-state-metrics
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kube-state-metrics
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kube-state-metrics
rules:
  - apiGroups: [""]
    resources: ["nodes", "pods", "services", "namespaces"]
    verbs: ["list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kube-state-metrics
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kube-state-metrics
subjects:
  - kind: ServiceAccount
    name: kube-state-metrics
    namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-state-metrics
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-state-metrics
  template:
    metadata:
      labels:
        app: kube-state-metrics
    spec:
      serviceAccountName: kube-state-metrics
      containers:
        - name: kube-state-metrics
          image: registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.10.1
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: kube-state-metrics
  namespace: kube-system
spec:
  type: NodePort
  selector:
    app: kube-state-metrics
  ports:
    - port: 8080
      targetPort: 8080
      nodePort: 30001
EOF

# Wait for pod to be ready
kubectl wait --for=condition=ready pod -l app=kube-state-metrics -n kube-system --timeout=60s

# Check status
kubectl get pods -n kube-system | grep kube-state

# Test metrics
curl http://localhost:30001/metrics | head -n 20
```

**Expected Output:**
```
# HELP kube_deployment_created Unix creation timestamp
# TYPE kube_deployment_created gauge
...
```

✅ **Kube-State-Metrics running!**

### Step 4: Test from Windows (2 min)

**Back in PowerShell on Windows:**
```powershell
# Replace with your EC2 IP
$EC2_IP = "13.233.203.127"

# Test Node Exporter
curl "http://${EC2_IP}:9100/metrics" | Select-String -Pattern "node_cpu"

# Test Kube-State-Metrics
curl "http://${EC2_IP}:30001/metrics" | Select-String -Pattern "kube_pod"
```

**If both work:** ✅ Metrics accessible!

---

## ✅ Final Verification

### Check Prometheus Targets Again:
```
http://localhost:9090/targets
```

**Now you should see:**

| Target | Endpoint | State |
|--------|----------|-------|
| ✅ prometheus | localhost:9090 | **UP** ✅ |
| ✅ ec2-node-exporter | YOUR_IP:9100 | **UP** ✅ |
| ✅ kube-state-metrics | YOUR_IP:30001 | **UP** ✅ |

### Check Grafana Dashboard:
```
http://localhost:3000/d/ragpdf-overview
```

**Now you should see:**
- 🖥️ EC2 Instance Status: **UP** (green)
- 💻 CPU Usage: Live percentage
- 🧠 Memory Usage: Live percentage
- 💾 Disk Usage: Live percentage
- 📈 Graphs with real data
- ☸️ Pod counts

---

## 🎯 Quick Command Summary

### EC2 Setup Commands (Copy-Paste):
```bash
# Node Exporter - One command installation
curl -fsSL https://raw.githubusercontent.com/prometheus/node_exporter/master/examples/systemd/node_exporter.service | sudo tee /etc/systemd/system/node_exporter.service
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xzf node_exporter-1.7.0.linux-amd64.tar.gz
sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter
sudo systemctl status node_exporter
```

### Test Everything:
```bash
# On EC2
curl http://localhost:9100/metrics | head
curl http://localhost:30001/metrics | head

# From Windows PowerShell
curl http://YOUR_EC2_IP:9100/metrics
curl http://YOUR_EC2_IP:30001/metrics
```

---

## 🆘 If Still No Data After Setup

### 1. Check Prometheus Targets:
```
http://localhost:9090/targets
```
All should be **UP**

### 2. Check Prometheus Config:
```powershell
# Verify EC2 IP is correct in config
Select-String -Path "C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring\prometheus\prometheus.yml" -Pattern "targets:"
```

### 3. Reload Prometheus:
```powershell
curl -X POST http://localhost:9090/-/reload
```

### 4. Check Grafana Datasource:
```
http://localhost:3000/connections/datasources
Click Prometheus → Test (should be green)
```

---

## 📋 Checklist

Complete karo ye steps:

- [ ] Terraform security group update (`terraform apply`)
- [ ] Node Exporter install on EC2
- [ ] Node Exporter service running (`systemctl status node_exporter`)
- [ ] Kube-State-Metrics deployed on K3s
- [ ] Kube-State-Metrics pod running (`kubectl get pods -n kube-system`)
- [ ] Port 9100 accessible from Windows (`curl EC2_IP:9100/metrics`)
- [ ] Port 30001 accessible from Windows (`curl EC2_IP:30001/metrics`)
- [ ] Prometheus targets all UP (http://localhost:9090/targets)
- [ ] Grafana dashboard showing data (http://localhost:3000/d/ragpdf-overview)

---

**🎉 Setup complete hone ke baad "No Data" gayab ho jayega aur live metrics dikhenge!**

**Documents:** 
- Full setup guide: `START_MONITORING.md`
- Step by step: `SETUP_STEPS.md`
