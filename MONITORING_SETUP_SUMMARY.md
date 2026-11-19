# 📊 RAGPDF Monitoring Setup - Structure Summary

## ✅ Folder Structure (CORRECT - No Conflicts)

```
ragpdf/
│
├── company-policy-ai/              ← Jenkins CI/CD deploys THIS folder
│   ├── backend/                    ← Node.js backend application
│   ├── frontend/                   ← React frontend application
│   └── k8s/                        ← Application K8s manifests
│       ├── namespace.yaml          (ragpdf namespace)
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── ingress.yaml
│       ├── configmap.yaml
│       └── secret.yaml
│
├── monitoring/                     ← SEPARATE monitoring folder (NOT in pipeline)
│   ├── docker-compose.yml          ← Runs Prometheus + Grafana on Windows
│   ├── README.md                   ← Complete setup guide
│   ├── START_MONITORING.md         ← Quick start guide
│   │
│   ├── prometheus/                 ← Prometheus configuration
│   │   ├── prometheus.yml          (scrape targets, EC2 + K8s)
│   │   └── alerts.yml              (alerting rules)
│   │
│   ├── grafana/                    ← Grafana configuration
│   │   ├── provisioning/
│   │   │   ├── datasources/
│   │   │   │   └── datasource.yml  (auto-configure Prometheus)
│   │   │   └── dashboards/
│   │   │       └── dashboard.yml   (auto-import dashboards)
│   │   └── dashboards/
│   │       └── ragpdf-overview.json (main dashboard)
│   │
│   ├── k8s/                        ← Monitoring-specific K8s manifests
│   │   ├── namespace.yaml          (monitoring namespace - optional)
│   │   └── kube-state-metrics.yaml (deploy on K3s for K8s metrics)
│   │
│   └── scripts/
│       └── install-node-exporter.sh (install on EC2 for system metrics)
│
├── terraform/                      ← AWS infrastructure
│   ├── provider.tf
│   ├── ec2.tf
│   ├── security-groups.tf          ← Updated with monitoring ports (9100, 30001)
│   ├── variables.tf
│   └── terraform.tfvars
│
├── Jenkinsfile                     ← CI/CD pipeline (NOT affected by monitoring)
├── sonar-project.properties        ← SonarQube config
└── README.md
```

---

## 🔍 Key Points

### 1. Jenkins Pipeline NOT Affected ✅

**Jenkins only deploys:**
- `company-policy-ai/backend/` → Docker image
- `company-policy-ai/frontend/` → Docker image
- K8s manifests from `company-policy-ai/k8s/` → ragpdf namespace

**Jenkins does NOT touch:**
- `monitoring/` folder (completely ignored)
- Monitoring is manual setup, not part of CI/CD

### 2. Monitoring is Completely Separate ✅

**Monitoring components:**
- **Prometheus + Grafana:** Run locally on Windows via Docker Compose
- **Node Exporter:** Installed manually on EC2 (system metrics)
- **Kube-State-Metrics:** Deployed manually on K3s (K8s metrics)

**NOT part of Jenkins deployment!**

### 3. K8s Manifests Separation ✅

**Application K8s manifests:**
- Location: `company-policy-ai/k8s/`
- Namespace: `ragpdf`
- Deployed by: Jenkins pipeline
- Purpose: Deploy RAGPDF app (backend, frontend, ingress)

**Monitoring K8s manifests:**
- Location: `monitoring/k8s/`
- Namespace: `kube-system` (for kube-state-metrics)
- Deployed by: Manual `kubectl apply`
- Purpose: Export K8s metrics to Prometheus

**No conflicts because they're in different folders and namespaces!**

---

## 📦 What Goes Where

### Jenkins Deploys (Automatic - CI/CD)
```
company-policy-ai/
├── backend/             → Docker build → sarvnoorkaur/ragpdf-backend:latest
├── frontend/            → Docker build → sarvnoorkaur/ragpdf-frontend:latest
└── k8s/                 → kubectl apply (via Jenkins SSH to EC2)
    ├── namespace.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    └── ingress.yaml
```

### You Deploy Manually (One-time Setup)
```
monitoring/
├── docker-compose.yml           → docker-compose up -d (on Windows)
├── k8s/kube-state-metrics.yaml  → kubectl apply -f (on EC2)
└── scripts/install-node-exporter.sh → sudo ./install-node-exporter.sh (on EC2)
```

### Terraform Manages (Infrastructure)
```
terraform/
├── ec2.tf                    → AWS EC2 instances
├── security-groups.tf        → Firewall rules (including monitoring ports)
└── *.tf                      → VPC, networking, etc.
```

---

## 🚀 Deployment Workflow

### Normal Application Deployment (Jenkins)
1. Code commit to GitHub
2. Jenkins pulls code
3. Jenkins builds Docker images
4. Jenkins pushes to Docker Hub
5. Jenkins SSH to EC2 → `kubectl rollout restart`
6. **Monitoring is NOT affected**

### Monitoring Deployment (Manual - One Time Only)
1. Update AWS security groups: `terraform apply`
2. Install Node Exporter on EC2 (SSH and run script)
3. Deploy kube-state-metrics on K3s (SSH and kubectl apply)
4. Configure Prometheus with EC2 IP
5. Start Docker Compose on Windows
6. **Application is NOT affected**

---

## ❓ FAQs

### Q: Will monitoring interfere with Jenkins pipeline?
**A:** NO. Jenkins only looks at `company-policy-ai/` folder. Monitoring is in separate `monitoring/` folder.

### Q: Will kube-state-metrics affect RAGPDF app?
**A:** NO. kube-state-metrics runs in `kube-system` namespace. RAGPDF app runs in `ragpdf` namespace. They don't interfere.

### Q: Can I delete monitoring folder without breaking the app?
**A:** YES. You can completely delete `monitoring/` folder and the application will work fine. Monitoring is optional.

### Q: Do I need to redeploy monitoring when app updates?
**A:** NO. Monitoring keeps running. It automatically detects new pods/deployments.

### Q: Will this increase my AWS costs?
**A:** Very minimal. Node Exporter uses ~10MB RAM. Kube-state-metrics uses ~100MB RAM. No additional EC2 needed.

### Q: Can I run Prometheus/Grafana on EC2 instead of Windows?
**A:** Yes, but you originally asked for Windows local setup. If you want EC2, we can modify docker-compose to run there.

---

## 📂 File Locations Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Application Code | `company-policy-ai/backend/`, `company-policy-ai/frontend/` | Your RAGPDF app |
| Application K8s | `company-policy-ai/k8s/*.yaml` | Deploy app to K3s |
| Monitoring Docker | `monitoring/docker-compose.yml` | Run Prometheus + Grafana on Windows |
| Monitoring Config | `monitoring/prometheus/`, `monitoring/grafana/` | Configure monitoring |
| Monitoring K8s | `monitoring/k8s/kube-state-metrics.yaml` | K8s metrics exporter |
| EC2 Script | `monitoring/scripts/install-node-exporter.sh` | System metrics exporter |
| Infrastructure | `terraform/*.tf` | AWS resources |
| CI/CD | `Jenkinsfile` | Build and deploy pipeline |

---

## ✅ Summary

**Your structure is PERFECT:**
- ✅ Monitoring is separate from application
- ✅ Jenkins pipeline won't be affected
- ✅ K8s manifests don't conflict (different folders & namespaces)
- ✅ Clean separation like terraform
- ✅ No mixing of concerns

**Just like:**
- `terraform/` manages infrastructure
- `company-policy-ai/` is your application
- `monitoring/` is observability

**All three are independent!**

---

## 🎯 Next Steps

Follow the **START_MONITORING.md** guide step-by-step:

1. Update security groups (terraform)
2. Install Node Exporter (EC2)
3. Deploy kube-state-metrics (K3s)
4. Configure Prometheus (Windows)
5. Start Docker Compose (Windows)
6. Open Grafana dashboard

**Estimated time: 30 minutes**

---

**📊 Your monitoring setup is clean and won't interfere with anything!**
