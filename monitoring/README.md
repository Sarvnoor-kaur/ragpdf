# 📊 RAGPDF Monitoring Setup

Complete Prometheus and Grafana monitoring solution for the RAGPDF AI Company Policy Assistant running on AWS EC2 with K3s Kubernetes.

## 📁 Project Structure

```
monitoring/
├── docker-compose.yml              # Local Prometheus + Grafana stack
├── prometheus/
│   ├── prometheus.yml              # Prometheus configuration
│   └── alerts.yml                  # Alert rules
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml      # Auto-configure Prometheus datasource
│   │   └── dashboards/
│   │       └── dashboard.yml       # Dashboard provisioning config
│   └── dashboards/
│       └── ragpdf-overview.json    # Main monitoring dashboard
├── k8s/
│   ├── namespace.yaml              # Monitoring namespace (optional)
│   └── kube-state-metrics.yaml     # K8s metrics exporter
├── scripts/
│   └── install-node-exporter.sh    # EC2 Node Exporter installer
└── README.md                        # This file
```

## 🎯 What Gets Monitored

### EC2 Instance Metrics (via Node Exporter)
- ✅ CPU usage and utilization
- ✅ Memory usage (total, available, used)
- ✅ Disk usage and I/O
- ✅ Network traffic (RX/TX bytes, errors)
- ✅ System load average (1m, 5m, 15m)
- ✅ File descriptors
- ✅ Uptime

### Kubernetes Metrics (via kube-state-metrics)
- ✅ Pod status (Running, Pending, Failed)
- ✅ Pod restarts and crash loops
- ✅ Deployment replicas (desired vs available)
- ✅ Node readiness
- ✅ Container resource requests/limits
- ✅ Namespace resource usage
- ✅ Service and Ingress status

## 📋 Prerequisites

### On Your Windows Machine
- ✅ Docker Desktop installed and running
- ✅ Git Bash or PowerShell
- ✅ SSH access to EC2 instance
- ✅ EC2 Public IP address

### On EC2 Instance
- ✅ K3s Kubernetes installed
- ✅ kubectl configured
- ✅ Ports available: 9100, 30001

---

## 🚀 Setup Instructions

### Step 1: Get Your EC2 Public IP

Run in **PowerShell** from the terraform folder:

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
terraform output k3s_public_ip
```

Copy the IP address (e.g., `13.233.203.127`). You'll need this for the next steps.

---

### Step 2: Update AWS Security Group

Add inbound rules to allow Prometheus to scrape metrics from EC2:

#### Option A: Using Terraform (Recommended)

Add to `terraform/security-groups.tf` in the `aws_security_group.k3s` ingress rules:

```hcl
# Node Exporter - metrics for Prometheus
ingress {
  description = "Node Exporter metrics"
  from_port   = 9100
  to_port     = 9100
  protocol    = "tcp"
  cidr_blocks = [var.admin_ip_cidr]  # Only your IP
}

# Kube State Metrics - K8s metrics for Prometheus
ingress {
  description = "Kube State Metrics"
  from_port   = 30001
  to_port     = 30001
  protocol    = "tcp"
  cidr_blocks = [var.admin_ip_cidr]  # Only your IP
}
```

Then apply:

```powershell
terraform plan
terraform apply
```

#### Option B: Using AWS Console

1. Go to AWS Console → EC2 → Security Groups
2. Find `ragpdf-k3s-sg`
3. Add Inbound Rules:
   - Type: Custom TCP, Port: 9100, Source: My IP
   - Type: Custom TCP, Port: 30001, Source: My IP

---

### Step 3: Install Node Exporter on EC2

**Run on EC2 instance** (via SSH):

```bash
# SSH to your EC2 instance
ssh -i ~/.ssh/shophub-key.pem ubuntu@YOUR_EC2_IP

# Download the installer script
cd ~
curl -O https://raw.githubusercontent.com/prometheus/node_exporter/master/examples/systemd/node_exporter.service

# Or copy from this repo
cat > install-node-exporter.sh << 'EOF'
# Paste content from monitoring/scripts/install-node-exporter.sh
EOF

# Make executable and run
chmod +x install-node-exporter.sh
sudo ./install-node-exporter.sh
```

**Verify Node Exporter is running:**

```bash
# Check service status
sudo systemctl status node_exporter

# Test metrics endpoint locally
curl http://localhost:9100/metrics | head -n 20

# Get your public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

**Test from Windows:**

```powershell
# Test Node Exporter from your Windows machine
curl http://YOUR_EC2_IP:9100/metrics
```

If you see metrics output, Node Exporter is working! ✅

---

### Step 4: Deploy kube-state-metrics on K3s

**Run on EC2 instance:**

```bash
# Apply the kube-state-metrics manifest
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kube-state-metrics/main/examples/standard/cluster-role-binding.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kube-state-metrics/main/examples/standard/cluster-role.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kube-state-metrics/main/examples/standard/service-account.yaml

# Or use the local manifest from this repo
# Copy monitoring/k8s/kube-state-metrics.yaml to EC2 and apply
kubectl apply -f kube-state-metrics.yaml
```

**Verify kube-state-metrics:**

```bash
# Check if pod is running
kubectl get pods -n kube-system | grep kube-state

# Check service
kubectl get svc -n kube-system kube-state-metrics

# Test metrics endpoint
kubectl port-forward -n kube-system svc/kube-state-metrics 8080:8080 &
curl http://localhost:8080/metrics | head -n 20
```

**Test from Windows:**

```powershell
# Test kube-state-metrics from your Windows machine
curl http://YOUR_EC2_IP:30001/metrics
```

---

### Step 5: Configure Prometheus

**On your Windows machine:**

Edit `monitoring/prometheus/prometheus.yml` and replace `EC2_PUBLIC_IP` with your actual EC2 IP:

```yaml
# Find and replace all instances of EC2_PUBLIC_IP
# Example: 13.233.203.127

# Line ~50: EC2 Node Exporter
- targets: ['13.233.203.127:9100']

# Line ~75: Kube State Metrics
- targets: ['13.233.203.127:30001']
```

**Quick PowerShell replacement:**

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Replace EC2_PUBLIC_IP with your actual IP
$EC2_IP = "13.233.203.127"  # Change this
(Get-Content prometheus/prometheus.yml) -replace 'EC2_PUBLIC_IP', $EC2_IP | Set-Content prometheus/prometheus.yml
```

---

### Step 6: Start Monitoring Stack

**On Windows, in PowerShell:**

```powershell
# Navigate to monitoring folder
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\monitoring

# Start Prometheus and Grafana
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Expected output:**

```
NAME                  IMAGE                      STATUS
ragpdf-prometheus     prom/prometheus:latest     Up (healthy)
ragpdf-grafana        grafana/grafana:latest     Up (healthy)
```

---

### Step 7: Verify Prometheus Targets

1. Open browser: http://localhost:9090
2. Go to **Status → Targets**
3. Check all targets are **UP**:
   - ✅ `prometheus` (localhost:9090)
   - ✅ `ec2-node-exporter` (EC2_IP:9100)
   - ✅ `kube-state-metrics` (EC2_IP:30001)

**If any target shows DOWN:**

- Check security group rules allow the port
- Verify service is running on EC2
- Check firewall/network connectivity
- Review Prometheus logs: `docker-compose logs prometheus`

---

### Step 8: Access Grafana Dashboard

1. Open browser: http://localhost:3000
2. Login credentials:
   - **Username:** `admin`
   - **Password:** `ragpdf123` ⚠️ Change in production!
3. Navigate to **Dashboards → RAGPDF Monitoring → RAGPDF Infrastructure Overview**

**You should see:**

- 🖥️ EC2 Instance Status
- 💻 CPU Usage gauge
- 🧠 Memory Usage gauge
- 💾 Disk Usage gauge
- 📈 CPU/Memory graphs over time
- ☸️ Kubernetes Pods Status
- 🔄 Pod Restarts
- 📦 Deployments Status
- 🌐 Network Traffic
- ⏱️ System Load Average

---

## 🔧 Management Commands

### Docker Compose Commands

```powershell
# Start monitoring stack
docker-compose up -d

# Stop monitoring stack
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f

# View Prometheus logs only
docker-compose logs -f prometheus

# View Grafana logs only
docker-compose logs -f grafana

# Restart specific service
docker-compose restart prometheus
docker-compose restart grafana

# Check container status
docker-compose ps

# Update and restart (after config changes)
docker-compose up -d --force-recreate
```

### Prometheus Commands

```powershell
# Reload Prometheus config (no restart needed)
curl -X POST http://localhost:9090/-/reload

# Check config validity
docker exec ragpdf-prometheus promtool check config /etc/prometheus/prometheus.yml

# Check alert rules validity
docker exec ragpdf-prometheus promtool check rules /etc/prometheus/alerts.yml

# Query Prometheus from command line
curl "http://localhost:9090/api/v1/query?query=up"
```

### EC2 Node Exporter Commands

```bash
# SSH to EC2
ssh -i ~/.ssh/shophub-key.pem ubuntu@YOUR_EC2_IP

# Check status
sudo systemctl status node_exporter

# Stop/Start/Restart
sudo systemctl stop node_exporter
sudo systemctl start node_exporter
sudo systemctl restart node_exporter

# View logs
sudo journalctl -u node_exporter -f

# Test locally
curl http://localhost:9100/metrics
```

### K8s Kube-State-Metrics Commands

```bash
# SSH to EC2
ssh -i ~/.ssh/shophub-key.pem ubuntu@YOUR_EC2_IP

# Check pod status
kubectl get pods -n kube-system | grep kube-state

# View logs
kubectl logs -n kube-system -l app.kubernetes.io/name=kube-state-metrics -f

# Restart
kubectl rollout restart deployment kube-state-metrics -n kube-system

# Delete and redeploy
kubectl delete -f kube-state-metrics.yaml
kubectl apply -f kube-state-metrics.yaml

# Test metrics
curl http://localhost:30001/metrics
```

---

## 📊 Using Grafana

### Creating Custom Dashboards

1. Click **+** → **Dashboard**
2. Click **Add visualization**
3. Select **Prometheus** datasource
4. Enter PromQL query (see examples below)
5. Configure visualization type (Graph, Gauge, Table, etc.)
6. Click **Save**

### Useful PromQL Queries

#### EC2 Metrics

```promql
# CPU Usage %
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage %
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk Usage %
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100

# Network RX bytes/sec
rate(node_network_receive_bytes_total[5m])

# Network TX bytes/sec
rate(node_network_transmit_bytes_total[5m])

# System Load 1min
node_load1

# Uptime seconds
node_time_seconds - node_boot_time_seconds
```

#### Kubernetes Metrics

```promql
# Running Pods count
count(kube_pod_status_phase{phase="Running"})

# Failed Pods count
count(kube_pod_status_phase{phase="Failed"})

# Pod restarts in last 1h
sum(increase(kube_pod_container_status_restarts_total[1h]))

# Deployment replicas available
kube_deployment_status_replicas_available

# Node ready status
kube_node_status_condition{condition="Ready",status="true"}

# Pods by namespace
count(kube_pod_info) by (namespace)
```

---

## 🚨 Alerts

Prometheus is configured with alerts in `prometheus/alerts.yml`:

### Critical Alerts
- 🔴 **EC2InstanceDown** - EC2 unreachable for 2m
- 🔴 **CriticalCPUUsage** - CPU > 95% for 2m
- 🔴 **CriticalMemoryUsage** - Memory > 95% for 2m
- 🔴 **CriticalDiskSpace** - Disk > 90% for 2m
- 🔴 **PodCrashLooping** - Pod restarting repeatedly
- 🔴 **DeploymentReplicasUnavailable** - All replicas down
- 🔴 **KubernetesNodeNotReady** - K8s node not ready

### Warning Alerts
- ⚠️ **HighCPUUsage** - CPU > 80% for 5m
- ⚠️ **HighMemoryUsage** - Memory > 80% for 5m
- ⚠️ **LowDiskSpace** - Disk > 80% for 5m
- ⚠️ **PodNotReady** - Pod not ready for 10m
- ⚠️ **DeploymentReplicasMismatch** - Desired ≠ Available

### View Active Alerts

1. Prometheus UI: http://localhost:9090/alerts
2. Or in Grafana: **Alerting → Alert rules**

---

## 🔍 Troubleshooting

### Prometheus Can't Reach EC2 Targets

**Symptoms:** Targets show as DOWN in Prometheus

**Solutions:**

1. **Check EC2 Security Group:**
   ```powershell
   # Verify ports 9100 and 30001 are open from your IP
   ```

2. **Verify Node Exporter is running:**
   ```bash
   ssh ubuntu@EC2_IP
   sudo systemctl status node_exporter
   curl http://localhost:9100/metrics
   ```

3. **Check network connectivity:**
   ```powershell
   # From Windows
   Test-NetConnection EC2_IP -Port 9100
   Test-NetConnection EC2_IP -Port 30001
   ```

4. **Verify prometheus.yml has correct IP:**
   ```powershell
   # Check monitoring/prometheus/prometheus.yml
   # Ensure EC2_PUBLIC_IP is replaced with actual IP
   ```

5. **Reload Prometheus config:**
   ```powershell
   curl -X POST http://localhost:9090/-/reload
   ```

### Grafana Shows "No Data"

**Solutions:**

1. **Check Prometheus datasource:**
   - Grafana → Configuration → Data sources
   - Test connection to Prometheus

2. **Verify time range:**
   - Ensure time range selector shows recent data
   - Try "Last 1 hour"

3. **Check metrics are available:**
   - Open Prometheus: http://localhost:9090
   - Run query: `up`
   - Should show all targets

4. **Refresh dashboard:**
   - Click refresh button in Grafana
   - Or change time range

### Docker Containers Won't Start

**Solutions:**

1. **Check Docker Desktop is running:**
   ```powershell
   docker ps
   ```

2. **Check for port conflicts:**
   ```powershell
   # Ports 9090 and 3000 must be free
   netstat -ano | findstr ":9090"
   netstat -ano | findstr ":3000"
   ```

3. **View container logs:**
   ```powershell
   docker-compose logs
   ```

4. **Remove and recreate:**
   ```powershell
   docker-compose down -v
   docker-compose up -d
   ```

### Kube-State-Metrics Not Working

**Solutions:**

1. **Check pod is running:**
   ```bash
   kubectl get pods -n kube-system | grep kube-state
   ```

2. **View pod logs:**
   ```bash
   kubectl logs -n kube-system -l app.kubernetes.io/name=kube-state-metrics
   ```

3. **Check service and NodePort:**
   ```bash
   kubectl get svc -n kube-system kube-state-metrics
   # Should show NodePort 30001
   ```

4. **Test locally on EC2:**
   ```bash
   curl http://localhost:30001/metrics
   ```

5. **Redeploy:**
   ```bash
   kubectl delete -f kube-state-metrics.yaml
   kubectl apply -f kube-state-metrics.yaml
   ```

---

## 🔒 Security Best Practices

### Production Recommendations

1. **Change Grafana Password:**
   - Edit `docker-compose.yml`
   - Change `GF_SECURITY_ADMIN_PASSWORD`
   - Restart: `docker-compose up -d`

2. **Restrict AWS Security Group:**
   - Allow ports 9100, 30001 only from your IP
   - Never use `0.0.0.0/0` for monitoring ports

3. **Use HTTPS:**
   - Configure Grafana with TLS certificate
   - Use reverse proxy (Nginx/Traefik)

4. **Limit Grafana Access:**
   - Bind to localhost only: `127.0.0.1:3000:3000`
   - Use VPN or SSH tunnel for remote access

5. **Prometheus Data Retention:**
   - Currently set to 30 days
   - Adjust in `docker-compose.yml`: `--storage.tsdb.retention.time=30d`

### SSH Tunnel for Remote Access

If you want to access monitoring from outside your local network:

```powershell
# Create SSH tunnel to EC2
ssh -i ~/.ssh/shophub-key.pem -L 9100:localhost:9100 -L 30001:localhost:30001 ubuntu@EC2_IP

# Then use localhost in prometheus.yml
- targets: ['localhost:9100']
- targets: ['localhost:30001']
```

---

## 📈 Next Steps

### Add Application Metrics

To monitor your RAGPDF backend application:

1. **Install prom-client:**
   ```bash
   cd company-policy-ai/backend
   npm install prom-client
   ```

2. **Add metrics endpoint to Express:**
   ```javascript
   const promClient = require('prom-client');
   const register = new promClient.Registry();
   
   // Collect default metrics
   promClient.collectDefaultMetrics({ register });
   
   // Add /metrics endpoint
   app.get('/metrics', async (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(await register.metrics());
   });
   ```

3. **Uncomment backend target in `prometheus.yml`**

4. **Create custom metrics:**
   ```javascript
   const httpRequestDuration = new promClient.Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests in seconds',
     labelNames: ['method', 'route', 'status_code']
   });
   ```

### Setup Alertmanager

For email/Slack notifications:

1. Add Alertmanager to `docker-compose.yml`
2. Configure notification receivers
3. Update Prometheus `alerting.alertmanagers`

### Add More Dashboards

Import community dashboards from https://grafana.com/grafana/dashboards/:

- **Node Exporter Full:** 1860
- **Kubernetes Cluster Monitoring:** 7249
- **Kubernetes Pod Monitoring:** 6417

---

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [Kube-State-Metrics](https://github.com/kubernetes/kube-state-metrics)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

## 🆘 Support

If you encounter issues:

1. Check Prometheus targets: http://localhost:9090/targets
2. Check Prometheus logs: `docker-compose logs prometheus`
3. Check Grafana logs: `docker-compose logs grafana`
4. Verify EC2 services: `ssh ubuntu@EC2_IP`
5. Review this README troubleshooting section

---

**🎉 Congratulations! Your RAGPDF monitoring stack is ready!**

Access Points:
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/ragpdf123)
- **Node Exporter:** http://EC2_IP:9100/metrics
- **Kube-State-Metrics:** http://EC2_IP:30001/metrics
