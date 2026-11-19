# 🚀 Quick Start Guide - RAGPDF Monitoring

Follow these steps in order to set up complete monitoring for your RAGPDF infrastructure.

## ⏱️ Estimated Time: 30 minutes

---

## Step 1: Update AWS Security Group (5 min)

Open PowerShell and run:

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform

# Apply security group updates to allow monitoring ports
terraform plan
terraform apply

# When prompted, type: yes
```

**Expected output:**
```
Plan: 0 to add, 1 to change, 0 to destroy
aws_security_group.k3s: Modifying...
aws_security_group.k3s: Modifications complete
```

---

## Step 2: Get EC2 Public IP (1 min)

```powershell
# Still in terraform folder
terraform output k3s_public_ip
```

**Copy this IP address** - you'll need it multiple times.  
Example: `13.233.203.127`

---

## Step 3: Install Node Exporter on EC2 (10 min)

Open a new PowerShell window and SSH to EC2:

```powershell
# Replace with your actual EC2 IP
ssh -i C:\Users\sarvn\.ssh\shophub-key.pem ubuntu@13.233.203.127
```

Once connected to EC2, run:

```bash
# Download and install Node Exporter
curl -L https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz -o node_exporter.tar.gz

tar xzf node_exporter.tar.gz

sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/

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

# Start and enable service
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Verify it's running
sudo systemctl status node_exporter

# Test locally (should see metrics)
curl http://localhost:9100/metrics | head -n 20
```

**Keep this SSH session open** - you'll need it for the next step.

---

## Step 4: Deploy Kube-State-Metrics on K3s (5 min)

**Still in the EC2 SSH session**, run:

```bash
# Create kube-state-metrics deployment
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
    resources: ["configmaps", "secrets", "nodes", "pods", "services", "resourcequotas", "replicationcontrollers", "limitranges", "persistentvolumeclaims", "persistentvolumes", "namespaces", "endpoints"]
    verbs: ["list", "watch"]
  - apiGroups: ["apps"]
    resources: ["statefulsets", "daemonsets", "deployments", "replicasets"]
    verbs: ["list", "watch"]
  - apiGroups: ["batch"]
    resources: ["cronjobs", "jobs"]
    verbs: ["list", "watch"]
  - apiGroups: ["autoscaling"]
    resources: ["horizontalpodautoscalers"]
    verbs: ["list", "watch"]
  - apiGroups: ["policy"]
    resources: ["poddisruptionbudgets"]
    verbs: ["list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses", "volumeattachments"]
    verbs: ["list", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["networkpolicies", "ingresses"]
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
            - name: http-metrics
              containerPort: 8080
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
    - name: http-metrics
      port: 8080
      targetPort: 8080
      nodePort: 30001
EOF

# Wait for pod to be ready
kubectl wait --for=condition=ready pod -l app=kube-state-metrics -n kube-system --timeout=60s

# Verify it's running
kubectl get pods -n kube-system | grep kube-state

# Test metrics
curl http://localhost:30001/metrics | head -n 20
```

**You can now close the SSH session** (type `exit`).

---

## Step 5: Configure Prometheus (2 min)

**Back in PowerShell on Windows:**

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Replace EC2_PUBLIC_IP with your actual IP
$EC2_IP = "13.233.203.127"  # ⚠️ CHANGE THIS TO YOUR IP

# Update prometheus.yml
(Get-Content prometheus/prometheus.yml) -replace 'EC2_PUBLIC_IP', $EC2_IP | Set-Content prometheus/prometheus.yml

# Verify the replacement worked
Select-String -Path prometheus/prometheus.yml -Pattern $EC2_IP
```

**Expected output:**
```
prometheus/prometheus.yml:50:      - targets: ['13.233.203.127:9100']
prometheus/prometheus.yml:75:      - targets: ['13.233.203.127:30001']
```

---

## Step 6: Test Connectivity from Windows (3 min)

**Before starting Docker containers, verify Windows can reach EC2 metrics:**

```powershell
# Test Node Exporter (should return metrics text)
curl http://13.233.203.127:9100/metrics

# Test Kube-State-Metrics (should return metrics text)
curl http://13.233.203.127:30001/metrics
```

**If you see errors:**
- Check AWS Security Group rules are applied
- Verify your current IP matches `admin_ip_cidr` in terraform
- Check services are running on EC2

---

## Step 7: Start Monitoring Stack (2 min)

```powershell
# Still in monitoring folder
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Start Prometheus and Grafana
docker-compose up -d

# Check containers are running
docker-compose ps

# View logs to ensure no errors
docker-compose logs
```

**Expected output:**
```
NAME                STATUS
ragpdf-prometheus   Up (healthy)
ragpdf-grafana      Up (healthy)
```

---

## Step 8: Verify Prometheus Targets (2 min)

Open browser:
1. Go to: http://localhost:9090
2. Click **Status → Targets**
3. Verify all targets show **UP** with green status:
   - ✅ `prometheus` (localhost:9090)
   - ✅ `ec2-node-exporter` (YOUR_IP:9100)
   - ✅ `kube-state-metrics` (YOUR_IP:30001)

**If any target is DOWN:**
- Click on the target to see error message
- Verify IP addresses are correct
- Check security group allows the port
- Review Prometheus logs: `docker-compose logs prometheus`

---

## Step 9: Access Grafana Dashboard (2 min)

Open browser:
1. Go to: http://localhost:3000
2. Login:
   - **Username:** `admin`
   - **Password:** `ragpdf123`
3. Click **Dashboards** (left sidebar)
4. Click **RAGPDF Monitoring** folder
5. Click **RAGPDF Infrastructure Overview**

**You should see:**
- 🖥️ EC2 Instance Status: **UP** (green)
- 💻 CPU Usage: Live gauge showing current %
- 🧠 Memory Usage: Live gauge showing current %
- 💾 Disk Usage: Live gauge showing current %
- 📈 Graphs with real-time metrics
- ☸️ Kubernetes pod counts
- 📦 Deployment status table

---

## ✅ Success Checklist

- [ ] AWS Security Group updated with ports 9100 and 30001
- [ ] Node Exporter running on EC2 (check: `systemctl status node_exporter`)
- [ ] Kube-State-Metrics running on K3s (check: `kubectl get pods -n kube-system`)
- [ ] Prometheus running locally (http://localhost:9090)
- [ ] All Prometheus targets showing UP
- [ ] Grafana running locally (http://localhost:3000)
- [ ] Dashboard showing live metrics

---

## 🎉 You're Done!

Your monitoring stack is now fully operational!

### What to do next:

1. **Explore the dashboard** - hover over graphs, change time ranges
2. **Check alerts** - go to http://localhost:9090/alerts
3. **Create custom panels** - add your own metrics
4. **Set up notifications** - configure Alertmanager (see README.md)

### Daily usage:

```powershell
# Start monitoring (if containers stopped)
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring
docker-compose up -d

# Stop monitoring (to free resources)
docker-compose down

# View logs if issues occur
docker-compose logs -f
```

### Access points:
- **Grafana Dashboard:** http://localhost:3000
- **Prometheus UI:** http://localhost:9090
- **Prometheus Targets:** http://localhost:9090/targets
- **Prometheus Alerts:** http://localhost:9090/alerts

---

## 🆘 Need Help?

If something went wrong:

1. **Check each step** - verify green checkmarks above
2. **Review README.md** - detailed troubleshooting section
3. **Check logs:**
   - Prometheus: `docker-compose logs prometheus`
   - Grafana: `docker-compose logs grafana`
   - Node Exporter: SSH and run `sudo journalctl -u node_exporter`
   - Kube-State-Metrics: SSH and run `kubectl logs -n kube-system -l app=kube-state-metrics`

Common issues and solutions are in **README.md Troubleshooting** section.

---

**📊 Happy Monitoring!**
